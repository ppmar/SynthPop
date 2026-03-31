"""LLM-based persona generation pipeline."""

import json
import uuid
from pathlib import Path

import numpy as np
import structlog

from synthpop.api.client import AnthropicClient
from synthpop.config import SynthPopConfig, load_config
from synthpop.personas.models import DemographicSkeleton, Persona

logger = structlog.get_logger()

PERSONA_GENERATION_SYSTEM = """\
You are a demographic persona generator for a population simulation.
Given a demographic skeleton, generate a complete, realistic persona.

Rules:
- Be diverse. Avoid stereotypes. Real people are contradictory.
- The backstory must be 2-3 sentences, specific and human.
- personality_traits: use Big Five shorthand like "openness:high", "conscientiousness:medium".
  Include all five: openness, conscientiousness, extraversion, agreeableness, neuroticism.
- values: pick 3-5 from tradition, innovation, security, freedom, equality, merit, community,
  individualism, ecology, prosperity, spirituality, pragmatism.
- political_leaning: float -1.0 (far left) to 1.0 (far right). Be nuanced.
- tech_savviness, risk_tolerance, influenceability: floats 0.0 to 1.0.
- Output MUST be valid JSON matching the schema below. No extra fields.

Schema:
{
  "name": "string",
  "occupation": "string",
  "personality_traits": ["string"],
  "values": ["string"],
  "political_leaning": float,
  "tech_savviness": float,
  "risk_tolerance": float,
  "influenceability": float,
  "backstory": "string"
}"""

PERSONA_GENERATION_TEMPLATE = """\
Generate a realistic persona for this demographic profile.
Respond with JSON only.

Demographics:
- ID: {id}
- Age: {age}
- Gender: {gender}
- Education: {education}
- Location: {location_type}
- Country: {country}
- Income: {income_bracket}"""


def _sample_from_distribution(distribution: dict[str, float], n: int, rng: np.random.Generator) -> list[str]:
    """Sample n values from a categorical distribution.

    Args:
        distribution: Mapping of category to probability.
        n: Number of samples.
        rng: Numpy random generator.

    Returns:
        List of sampled category strings.
    """
    categories = list(distribution.keys())
    probabilities = np.array(list(distribution.values()), dtype=float)
    probabilities /= probabilities.sum()
    return list(rng.choice(categories, size=n, p=probabilities))


def _parse_age_bracket(bracket: str, rng: np.random.Generator) -> int:
    """Convert an age bracket string to a concrete age.

    Args:
        bracket: String like '18-25' or '66+'.
        rng: Numpy random generator.

    Returns:
        Random integer age within the bracket.
    """
    if bracket.endswith("+"):
        low = int(bracket[:-1])
        return int(rng.integers(low, min(low + 20, 100)))
    parts = bracket.split("-")
    return int(rng.integers(int(parts[0]), int(parts[1]) + 1))


def sample_skeletons(config: SynthPopConfig, seed: int | None = None) -> list[DemographicSkeleton]:
    """Sample demographic skeletons from configured distributions.

    Args:
        config: Population configuration.
        seed: Random seed for reproducibility.

    Returns:
        List of DemographicSkeleton instances.
    """
    rng = np.random.default_rng(seed or config.simulation.seed)
    n = config.population.size
    dist = config.population.distributions

    age_brackets = _sample_from_distribution(dist.age, n, rng)
    ages = [_parse_age_bracket(b, rng) for b in age_brackets]
    genders = _sample_from_distribution(dist.gender, n, rng)
    educations = _sample_from_distribution(dist.education, n, rng)
    locations = _sample_from_distribution(dist.location_type, n, rng)
    incomes = _sample_from_distribution(dist.income_bracket, n, rng)

    skeletons = []
    for i in range(n):
        skeletons.append(
            DemographicSkeleton(
                id=str(uuid.uuid4())[:8],
                age=ages[i],
                gender=genders[i],
                education=educations[i],
                location_type=locations[i],
                country=config.population.country,
                income_bracket=incomes[i],
            )
        )

    return skeletons


def _build_prompt(skeleton: DemographicSkeleton) -> str:
    """Build the LLM prompt for a single skeleton."""
    return PERSONA_GENERATION_TEMPLATE.format(
        id=skeleton.id,
        age=skeleton.age,
        gender=skeleton.gender,
        education=skeleton.education,
        location_type=skeleton.location_type,
        country=skeleton.country,
        income_bracket=skeleton.income_bracket,
    )


def _parse_persona_response(skeleton: DemographicSkeleton, raw_json: str) -> Persona:
    """Parse LLM JSON response into a Persona, merging with skeleton data.

    Args:
        skeleton: The original demographic skeleton.
        raw_json: Raw JSON string from the LLM.

    Returns:
        Complete Persona instance.
    """
    # Strip markdown fences if present
    text = raw_json.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    data = json.loads(text)
    return Persona(
        id=skeleton.id,
        age=skeleton.age,
        gender=skeleton.gender,
        education=skeleton.education,
        location_type=skeleton.location_type,
        country=skeleton.country,
        income_bracket=skeleton.income_bracket,
        name=data["name"],
        occupation=data["occupation"],
        personality_traits=data["personality_traits"],
        values=data["values"],
        political_leaning=data["political_leaning"],
        tech_savviness=data["tech_savviness"],
        risk_tolerance=data["risk_tolerance"],
        influenceability=data["influenceability"],
        backstory=data["backstory"],
    )


async def generate_personas(
    skeletons: list[DemographicSkeleton],
    client: AnthropicClient,
    model: str | None = None,
    batch_size: int = 15,
) -> list[Persona]:
    """Generate full personas from demographic skeletons using LLM.

    Args:
        skeletons: List of demographic skeletons to enrich.
        client: Anthropic API client.
        model: Model ID override. Defaults to client's bulk model.
        batch_size: Number of concurrent requests per batch.

    Returns:
        List of generated Persona instances.
    """
    from synthpop.api.client import MODEL_BULK

    model = model or MODEL_BULK
    prompts = [_build_prompt(s) for s in skeletons]

    logger.info("generating_personas", count=len(skeletons), model=model)

    raw_responses = await client.complete_batch(
        prompts=prompts,
        model=model,
        system=PERSONA_GENERATION_SYSTEM,
        max_tokens=1024,
        temperature=1.0,
        batch_size=batch_size,
    )

    personas: list[Persona] = []
    for skeleton, raw in zip(skeletons, raw_responses):
        try:
            persona = _parse_persona_response(skeleton, raw)
            personas.append(persona)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(
                "persona_parse_failed",
                skeleton_id=skeleton.id,
                error=str(e),
            )

    logger.info(
        "generation_complete",
        generated=len(personas),
        failed=len(skeletons) - len(personas),
    )
    return personas


def save_personas(personas: list[Persona], path: str | Path) -> None:
    """Save personas to a JSONL file.

    Args:
        personas: List of personas to save.
        path: Output file path.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for persona in personas:
            f.write(persona.model_dump_json() + "\n")
    logger.info("personas_saved", path=str(path), count=len(personas))


def load_personas(path: str | Path) -> list[Persona]:
    """Load personas from a JSONL file.

    Args:
        path: Path to JSONL file.

    Returns:
        List of Persona instances.
    """
    path = Path(path)
    personas = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                personas.append(Persona.model_validate_json(line))
    return personas


async def generate_population(
    n: int | None = None,
    config: str | Path | SynthPopConfig = "config/default.yaml",
    output: str | Path | None = None,
    api_key: str | None = None,
) -> list[Persona]:
    """End-to-end population generation pipeline.

    Args:
        n: Population size override.
        config: Config path or pre-loaded config.
        output: Optional path to save generated personas.
        api_key: Optional API key override.

    Returns:
        List of generated Persona instances.
    """
    if isinstance(config, (str, Path)):
        cfg = load_config(config)
    else:
        cfg = config

    if n is not None:
        cfg.population.size = n

    client = AnthropicClient(
        api_key=api_key,
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

    if output:
        save_personas(personas, output)

    logger.info("population_ready", size=len(personas), cost=client.usage.summary())
    return personas
