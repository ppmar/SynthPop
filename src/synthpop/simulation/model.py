"""Mesa Model subclass: the population simulation world."""

import mesa
import numpy as np
import structlog

from synthpop.config import SimulationConfig
from synthpop.personas.models import Persona
from synthpop.simulation.agent import PersonAgent
from synthpop.simulation.network import create_network

logger = structlog.get_logger()


def _mean_opinion(model: "PopulationModel") -> float:
    """Compute mean opinion position across all agents."""
    positions = []
    for agent in model.agents:
        if isinstance(agent, PersonAgent):
            for opinion in agent.opinions.values():
                positions.append(opinion.position)
    return float(np.mean(positions)) if positions else 0.0


def _opinion_variance(model: "PopulationModel") -> float:
    """Compute opinion variance (polarization metric)."""
    positions = []
    for agent in model.agents:
        if isinstance(agent, PersonAgent):
            for opinion in agent.opinions.values():
                positions.append(opinion.position)
    return float(np.var(positions)) if positions else 0.0


def _mean_confidence(model: "PopulationModel") -> float:
    """Compute mean confidence across all agents."""
    confidences = []
    for agent in model.agents:
        if isinstance(agent, PersonAgent):
            for opinion in agent.opinions.values():
                confidences.append(opinion.confidence)
    return float(np.mean(confidences)) if confidences else 0.0


class PopulationModel(mesa.Model):
    """ABM model holding all agents and their social network.

    Args:
        personas: List of Persona instances to populate the model.
        topic: The opinion topic for this simulation.
        sim_config: Simulation configuration parameters.
    """

    def __init__(
        self,
        personas: list[Persona],
        topic: str,
        sim_config: SimulationConfig | None = None,
    ) -> None:
        super().__init__()

        if sim_config is None:
            sim_config = SimulationConfig()

        self.topic = topic
        self.opinion_model = sim_config.opinion_model

        # Opinion model parameters
        self.epsilon = sim_config.bounded_confidence.epsilon
        self.mu = sim_config.bounded_confidence.mu
        self.weight_confidence = sim_config.voter.weight_confidence

        n = len(personas)
        network = create_network(
            n=n,
            topology=sim_config.network.topology,
            k=sim_config.network.k,
            p=sim_config.network.p,
            seed=sim_config.seed,
        )

        self.grid = mesa.space.NetworkGrid(network)

        rng = np.random.default_rng(sim_config.seed)

        # Create agents and place on network
        nodes = list(network.nodes())
        for i, persona in enumerate(personas):
            agent = PersonAgent(self, persona)
            agent.initialize_opinion(topic, rng)
            self.grid.place_agent(agent, nodes[i])

        # Data collector
        self.datacollector = mesa.DataCollector(
            model_reporters={
                "mean_opinion": _mean_opinion,
                "opinion_variance": _opinion_variance,
                "mean_confidence": _mean_confidence,
            },
            agent_reporters={
                "position": lambda a: (
                    list(a.opinions.values())[0].position
                    if isinstance(a, PersonAgent) and a.opinions
                    else None
                ),
                "confidence": lambda a: (
                    list(a.opinions.values())[0].confidence
                    if isinstance(a, PersonAgent) and a.opinions
                    else None
                ),
            },
        )

        logger.info(
            "model_initialized",
            agents=n,
            topic=topic,
            opinion_model=self.opinion_model,
            network_topology=sim_config.network.topology,
        )

    def step(self) -> None:
        """Advance the simulation by one step."""
        self.agents.shuffle_do("step")
        self.datacollector.collect(self)

    def get_all_opinions(self) -> list[dict]:
        """Return current opinion state for all agents.

        Returns:
            List of dicts with agent persona and opinion data.
        """
        results = []
        for agent in self.agents:
            if not isinstance(agent, PersonAgent):
                continue
            opinion = agent.opinions.get(self.topic)
            if opinion is None:
                continue
            results.append({
                "persona": agent.persona.model_dump(),
                "opinion": opinion.model_dump(),
            })
        return results


def run_simulation(
    personas: list[Persona],
    topic: str,
    sim_config: SimulationConfig | None = None,
    steps: int | None = None,
) -> PopulationModel:
    """Run a complete simulation and return the model.

    Args:
        personas: Population to simulate.
        topic: Opinion topic.
        sim_config: Simulation parameters.
        steps: Override number of steps.

    Returns:
        The PopulationModel after all steps have run.
    """
    if sim_config is None:
        sim_config = SimulationConfig()
    total_steps = steps or sim_config.steps

    model = PopulationModel(personas, topic, sim_config)

    logger.info("simulation_starting", steps=total_steps)
    for _ in range(total_steps):
        model.step()

    logger.info(
        "simulation_complete",
        steps=model.steps,
        final_mean=_mean_opinion(model),
        final_variance=_opinion_variance(model),
    )
    return model
