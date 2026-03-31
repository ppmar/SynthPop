"""Tests for configuration loading and validation."""

import pytest
from pydantic import ValidationError

from synthpop.config import load_config, SynthPopConfig


def test_load_default_config(default_config: SynthPopConfig) -> None:
    """Default config loads and validates correctly."""
    assert default_config.population.size == 200
    assert default_config.population.country == "France"
    assert default_config.simulation.seed == 42
    assert default_config.simulation.opinion_model == "bounded_confidence"


def test_demographic_distributions_sum_to_one(default_config: SynthPopConfig) -> None:
    """All demographic distributions should sum to ~1.0."""
    dist = default_config.population.distributions
    assert abs(sum(dist.age.values()) - 1.0) < 0.01
    assert abs(sum(dist.gender.values()) - 1.0) < 0.01
    assert abs(sum(dist.location_type.values()) - 1.0) < 0.01
    assert abs(sum(dist.education.values()) - 1.0) < 0.01
    assert abs(sum(dist.income_bracket.values()) - 1.0) < 0.01


def test_load_nonexistent_config_raises() -> None:
    """Loading a non-existent file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        load_config("nonexistent.yaml")


def test_simulation_config_defaults() -> None:
    """SimulationConfig has sensible defaults."""
    from synthpop.config import SimulationConfig

    cfg = SimulationConfig()
    assert cfg.steps == 50
    assert cfg.network.topology == "small_world"
    assert cfg.bounded_confidence.epsilon == 0.3
    assert cfg.bounded_confidence.mu == 0.1


def test_api_config_defaults() -> None:
    """ApiConfig has sensible defaults."""
    from synthpop.config import ApiConfig

    cfg = ApiConfig()
    assert cfg.max_cost_usd == 5.0
    assert cfg.batch_size == 15
