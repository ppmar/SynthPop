"""FastAPI REST server for SynthPop frontend integration."""

import asyncio
import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from synthpop.api.client import AnthropicClient
from synthpop.config import load_config, SynthPopConfig
from synthpop.personas.generator import (
    generate_personas,
    sample_skeletons,
    save_personas,
    load_personas,
)
from synthpop.personas.models import Persona
from synthpop.simulation.model import PopulationModel, run_simulation
from synthpop.simulation.agent import PersonAgent
from synthpop.analysis.aggregator import compute_stats, get_opinion_timeseries
from synthpop.verbalization.verbalizer import verbalize_opinions, poll_population

logger = structlog.get_logger()

# --- In-memory state ---

_simulations: dict[str, dict] = {}
_populations: dict[str, list[Persona]] = {}


# --- Request/Response models ---


class DemographicOverrides(BaseModel):
    """Optional demographic distribution overrides."""

    age: dict[str, float] | None = None
    gender: dict[str, float] | None = None
    location_type: dict[str, float] | None = None
    education: dict[str, float] | None = None
    income_bracket: dict[str, float] | None = None


class GenerateRequest(BaseModel):
    """Request to generate a population."""

    size: int = 200
    config_path: str = "config/default.yaml"
    demographics: DemographicOverrides | None = None


class GenerateResponse(BaseModel):
    """Response from population generation."""

    population_id: str
    agents: list[dict]
    count: int
    cost_usd: float


class PollRequest(BaseModel):
    """Request for a quick poll."""

    question: str
    population_size: int = 100
    population_id: str | None = None
    config_path: str = "config/default.yaml"


class PollResponse(BaseModel):
    """Response from a poll."""

    question: str
    total_agents: int
    for_pct: float
    against_pct: float
    neutral_pct: float
    mean_position: float
    mean_confidence: float
    clusters: list[dict]
    opinions: list[dict]
    cost_usd: float


class SimulateStartRequest(BaseModel):
    """Request to start a simulation."""

    population_id: str
    topic: str
    steps: int = 50
    opinion_model: str = "bounded_confidence"
    network_topology: str = "small_world"
    config_path: str = "config/default.yaml"


class SimulateStartResponse(BaseModel):
    """Response when starting a simulation."""

    simulation_id: str
    status: str
    total_steps: int


class SimulationStatusResponse(BaseModel):
    """Response for simulation status check."""

    simulation_id: str
    status: str  # pending, running, completed, failed
    current_step: int
    total_steps: int
    snapshots: list[dict] = Field(default_factory=list)


class SimulationResultsResponse(BaseModel):
    """Full simulation results."""

    simulation_id: str
    stats: dict
    timeseries: list[dict]
    final_opinions: list[dict]


class VerbalizeRequest(BaseModel):
    """Request to verbalize opinions."""

    simulation_id: str | None = None
    population_id: str | None = None
    topic: str | None = None
    clusters: int = 4
    samples_per_cluster: int = 2


class VerbalizeResponse(BaseModel):
    """Response from verbalization."""

    question: str
    clusters: list[dict]
    opinions: list[dict]
    cost_usd: float


# --- App ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("server_starting")
    yield
    logger.info("server_shutting_down")


app = FastAPI(
    title="SynthPop API",
    description="Synthetic Population Opinion Simulator",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---


@app.post("/generate", response_model=GenerateResponse)
async def generate_population_endpoint(req: GenerateRequest) -> GenerateResponse:
    """Generate a synthetic population."""
    cfg = load_config(req.config_path)
    cfg.population.size = req.size

    if req.demographics:
        dist = cfg.population.distributions
        if req.demographics.age:
            dist.age = req.demographics.age
        if req.demographics.gender:
            dist.gender = req.demographics.gender
        if req.demographics.location_type:
            dist.location_type = req.demographics.location_type
        if req.demographics.education:
            dist.education = req.demographics.education
        if req.demographics.income_bracket:
            dist.income_bracket = req.demographics.income_bracket

    client = AnthropicClient(
        max_cost_usd=cfg.api.max_cost_usd,
        max_retries=cfg.api.max_retries,
    )

    skeletons = sample_skeletons(cfg)
    personas = await generate_personas(
        skeletons=skeletons,
        client=client,
        model=cfg.api.generation_model,
        batch_size=cfg.api.batch_size,
    )

    pop_id = str(uuid.uuid4())[:8]
    _populations[pop_id] = personas

    return GenerateResponse(
        population_id=pop_id,
        agents=[p.model_dump() for p in personas],
        count=len(personas),
        cost_usd=client.usage.total_cost_usd,
    )


@app.post("/poll", response_model=PollResponse)
async def poll_endpoint(req: PollRequest) -> PollResponse:
    """Quick poll: generate population (or use existing) and ask a question."""
    cfg = load_config(req.config_path)
    client = AnthropicClient(
        max_cost_usd=cfg.api.max_cost_usd,
        max_retries=cfg.api.max_retries,
    )

    if req.population_id and req.population_id in _populations:
        personas = _populations[req.population_id]
    else:
        skeletons = sample_skeletons(cfg)
        cfg.population.size = req.population_size
        skeletons = sample_skeletons(cfg)
        personas = await generate_personas(
            skeletons=skeletons,
            client=client,
            model=cfg.api.generation_model,
            batch_size=cfg.api.batch_size,
        )

    result = await poll_population(
        population=personas,
        question=req.question,
        client=client,
    )

    return PollResponse(
        question=result.question,
        total_agents=result.total_agents,
        for_pct=result.for_pct,
        against_pct=result.against_pct,
        neutral_pct=result.neutral_pct,
        mean_position=result.mean_position,
        mean_confidence=result.mean_confidence,
        clusters=[c.model_dump() for c in result.clusters],
        opinions=[o.model_dump() for o in result.all_opinions],
        cost_usd=client.usage.total_cost_usd,
    )


@app.post("/simulate/start", response_model=SimulateStartResponse)
async def simulate_start_endpoint(req: SimulateStartRequest) -> SimulateStartResponse:
    """Start an opinion dynamics simulation."""
    if req.population_id not in _populations:
        raise HTTPException(status_code=404, detail="Population not found")

    personas = _populations[req.population_id]
    sim_id = str(uuid.uuid4())[:8]

    cfg = load_config(req.config_path)
    cfg.simulation.opinion_model = req.opinion_model
    cfg.simulation.network.topology = req.network_topology

    _simulations[sim_id] = {
        "status": "running",
        "current_step": 0,
        "total_steps": req.steps,
        "model": None,
        "topic": req.topic,
        "config": cfg.simulation,
        "snapshots": [],
    }

    async def _run_simulation() -> None:
        try:
            model = PopulationModel(personas, req.topic, cfg.simulation)
            snapshot_interval = cfg.simulation.snapshot_interval

            for step in range(req.steps):
                model.step()
                _simulations[sim_id]["current_step"] = step + 1

                if (step + 1) % snapshot_interval == 0:
                    df = model.datacollector.get_model_vars_dataframe()
                    last_row = df.iloc[-1].to_dict()
                    _simulations[sim_id]["snapshots"].append({
                        "step": step + 1,
                        **{k: float(v) for k, v in last_row.items()},
                    })

                # Yield control to event loop for status polling
                if step % 5 == 0:
                    await asyncio.sleep(0)

            _simulations[sim_id]["model"] = model
            _simulations[sim_id]["status"] = "completed"
        except Exception as e:
            logger.error("simulation_failed", error=str(e))
            _simulations[sim_id]["status"] = "failed"

    asyncio.create_task(_run_simulation())

    return SimulateStartResponse(
        simulation_id=sim_id,
        status="running",
        total_steps=req.steps,
    )


@app.get("/simulate/{sim_id}/status", response_model=SimulationStatusResponse)
async def simulate_status_endpoint(sim_id: str) -> SimulationStatusResponse:
    """Check simulation progress."""
    if sim_id not in _simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")

    sim = _simulations[sim_id]
    return SimulationStatusResponse(
        simulation_id=sim_id,
        status=sim["status"],
        current_step=sim["current_step"],
        total_steps=sim["total_steps"],
        snapshots=sim["snapshots"],
    )


@app.get("/simulate/{sim_id}/results", response_model=SimulationResultsResponse)
async def simulate_results_endpoint(sim_id: str) -> SimulationResultsResponse:
    """Get full simulation results."""
    if sim_id not in _simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")

    sim = _simulations[sim_id]
    if sim["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Simulation is {sim['status']}")

    model = sim["model"]
    stats = compute_stats(model)
    ts = get_opinion_timeseries(model)
    opinions = model.get_all_opinions()

    return SimulationResultsResponse(
        simulation_id=sim_id,
        stats=stats.model_dump(),
        timeseries=ts.to_dict(orient="records"),
        final_opinions=opinions,
    )


@app.post("/verbalize", response_model=VerbalizeResponse)
async def verbalize_endpoint(req: VerbalizeRequest) -> VerbalizeResponse:
    """Verbalize opinions for a set of agents."""
    cfg = load_config("config/default.yaml")
    client = AnthropicClient(
        max_cost_usd=cfg.api.max_cost_usd,
        max_retries=cfg.api.max_retries,
    )

    if req.simulation_id and req.simulation_id in _simulations:
        sim = _simulations[req.simulation_id]
        if sim["status"] != "completed":
            raise HTTPException(status_code=400, detail="Simulation not completed")
        model = sim["model"]
        opinions = model.get_all_opinions()
        topic = sim["topic"]
    elif req.population_id and req.population_id in _populations:
        raise HTTPException(
            status_code=400,
            detail="Use /poll for populations without simulation"
        )
    else:
        raise HTTPException(status_code=404, detail="Simulation or population not found")

    cfg.verbalization.clusters = req.clusters
    cfg.verbalization.samples_per_cluster = req.samples_per_cluster

    result = await verbalize_opinions(opinions, topic, client, cfg.verbalization)

    return VerbalizeResponse(
        question=topic,
        clusters=[c.model_dump() for c in result.clusters],
        opinions=[o.model_dump() for o in result.all_opinions],
        cost_usd=client.usage.total_cost_usd,
    )


@app.get("/populations")
async def list_populations() -> dict:
    """List all generated populations."""
    return {
        "populations": [
            {"id": pid, "count": len(personas)}
            for pid, personas in _populations.items()
        ]
    }


@app.get("/populations/{pop_id}")
async def get_population(pop_id: str) -> dict:
    """Get a specific population's agents."""
    if pop_id not in _populations:
        raise HTTPException(status_code=404, detail="Population not found")

    personas = _populations[pop_id]
    return {
        "population_id": pop_id,
        "count": len(personas),
        "agents": [p.model_dump() for p in personas],
    }


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


def start_server(host: str = "0.0.0.0", port: int = 8000) -> None:
    """Start the API server."""
    import uvicorn

    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server()
