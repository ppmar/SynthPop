"""Shared test fixtures."""

import pytest
import numpy as np

from synthpop.config import load_config, SynthPopConfig
from synthpop.personas.models import Persona


@pytest.fixture
def default_config() -> SynthPopConfig:
    """Load the default config."""
    return load_config("config/default.yaml")


@pytest.fixture
def sample_personas() -> list[Persona]:
    """Generate a list of deterministic fake personas for testing."""
    personas = []
    rng = np.random.default_rng(42)
    genders = ["homme", "femme"]
    educations = ["bac", "licence", "master", "doctorat", "autodidacte"]
    locations = ["urban", "suburban", "rural"]
    incomes = ["low", "middle", "upper-middle", "high"]

    for i in range(30):
        personas.append(
            Persona(
                id=f"test-{i:03d}",
                name=f"Agent {i}",
                age=int(rng.integers(18, 80)),
                gender=genders[i % 2],
                occupation="testeur",
                education=educations[i % len(educations)],
                location_type=locations[i % len(locations)],
                country="France",
                income_bracket=incomes[i % len(incomes)],
                personality_traits=[
                    "openness:high",
                    "conscientiousness:medium",
                    "extraversion:low",
                    "agreeableness:high",
                    "neuroticism:low",
                ],
                values=["innovation", "freedom", "equality"],
                political_leaning=float(rng.uniform(-1, 1)),
                tech_savviness=float(rng.uniform(0, 1)),
                risk_tolerance=float(rng.uniform(0, 1)),
                influenceability=float(rng.uniform(0.1, 0.8)),
                backstory=f"Agent {i} is a test persona for unit testing.",
            )
        )
    return personas
