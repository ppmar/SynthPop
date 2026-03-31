"""Configuration loading and validation."""

from pathlib import Path

import yaml
from pydantic import BaseModel, Field


class AgeDistribution(BaseModel):
    """Age bracket distribution (keys like '18-25', values are proportions)."""

    brackets: dict[str, float]


class DemographicDistributions(BaseModel):
    """Target demographic distributions for population generation."""

    age: dict[str, float]
    gender: dict[str, float]
    location_type: dict[str, float]
    education: dict[str, float]
    income_bracket: dict[str, float]


class PopulationConfig(BaseModel):
    """Population generation parameters."""

    size: int = 200
    country: str = "France"
    language: str = "fr"
    distributions: DemographicDistributions


class NetworkConfig(BaseModel):
    """Social network topology parameters."""

    topology: str = "small_world"
    k: int = 6
    p: float = 0.1


class BoundedConfidenceConfig(BaseModel):
    """Parameters for the Deffuant-Weisbuch bounded confidence model."""

    epsilon: float = 0.3
    mu: float = 0.1


class VoterConfig(BaseModel):
    """Parameters for the voter model."""

    weight_confidence: bool = True


class SimulationConfig(BaseModel):
    """Simulation engine parameters."""

    seed: int = 42
    steps: int = 50
    snapshot_interval: int = 5
    opinion_model: str = "bounded_confidence"
    network: NetworkConfig = Field(default_factory=NetworkConfig)
    bounded_confidence: BoundedConfidenceConfig = Field(
        default_factory=BoundedConfidenceConfig
    )
    voter: VoterConfig = Field(default_factory=VoterConfig)


class VerbalizationConfig(BaseModel):
    """Verbalization parameters."""

    model: str = "claude-sonnet-4-0"
    clusters: int = 4
    samples_per_cluster: int = 2
    max_tokens: int = 300


class ApiConfig(BaseModel):
    """API client configuration."""

    generation_model: str = "claude-haiku-4-5"
    bulk_model: str = "claude-haiku-4-5"
    max_cost_usd: float = 5.0
    max_retries: int = 3
    batch_size: int = 15


class SynthPopConfig(BaseModel):
    """Root configuration model."""

    population: PopulationConfig
    simulation: SimulationConfig = Field(default_factory=SimulationConfig)
    verbalization: VerbalizationConfig = Field(default_factory=VerbalizationConfig)
    api: ApiConfig = Field(default_factory=ApiConfig)


def load_config(path: str | Path) -> SynthPopConfig:
    """Load and validate configuration from a YAML file.

    Args:
        path: Path to YAML config file.

    Returns:
        Validated SynthPopConfig instance.

    Raises:
        FileNotFoundError: If config file doesn't exist.
        pydantic.ValidationError: If config is invalid.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    with open(path) as f:
        raw = yaml.safe_load(f)

    return SynthPopConfig(**raw)
