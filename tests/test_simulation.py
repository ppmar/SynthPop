"""Tests for simulation engine: opinion dynamics, network, model."""

import numpy as np
import pytest

from synthpop.config import SimulationConfig
from synthpop.personas.models import Persona
from synthpop.simulation.agent import PersonAgent
from synthpop.simulation.model import PopulationModel, run_simulation
from synthpop.simulation.network import create_network
from synthpop.simulation.opinion import (
    OpinionState,
    bounded_confidence_update,
    voter_model_update,
)
from synthpop.analysis.aggregator import compute_stats, get_opinion_timeseries


class TestOpinionDynamics:
    """Tests for opinion update functions."""

    def test_bounded_confidence_within_threshold(self) -> None:
        """Agents within epsilon converge."""
        new_pos, new_conf = bounded_confidence_update(
            position_a=0.2,
            position_b=0.3,
            confidence_a=0.5,
            confidence_b=0.5,
            influenceability_a=0.5,
            epsilon=0.3,
            mu=0.1,
        )
        # A should move toward B
        assert new_pos > 0.2
        assert new_pos < 0.3

    def test_bounded_confidence_outside_threshold(self) -> None:
        """Agents outside epsilon don't interact."""
        new_pos, new_conf = bounded_confidence_update(
            position_a=-0.8,
            position_b=0.8,
            confidence_a=0.5,
            confidence_b=0.5,
            influenceability_a=0.5,
            epsilon=0.3,
            mu=0.1,
        )
        assert new_pos == -0.8
        assert new_conf == 0.5

    def test_bounded_confidence_respects_bounds(self) -> None:
        """Output stays within [-1, 1]."""
        new_pos, _ = bounded_confidence_update(
            position_a=0.95,
            position_b=0.99,
            confidence_a=0.1,
            confidence_b=0.9,
            influenceability_a=1.0,
            epsilon=0.5,
            mu=0.5,
        )
        assert -1.0 <= new_pos <= 1.0

    def test_voter_model_blends_toward_neighbor(self) -> None:
        """Voter model moves A toward B."""
        new_pos, _ = voter_model_update(
            position_a=0.0,
            confidence_a=0.5,
            position_b=0.8,
            confidence_b=0.9,
            influenceability_a=0.7,
            weight_confidence=True,
        )
        assert new_pos > 0.0

    def test_voter_model_low_influenceability_minimal_change(self) -> None:
        """Low influenceability means minimal opinion change."""
        new_pos, _ = voter_model_update(
            position_a=0.0,
            confidence_a=0.5,
            position_b=0.8,
            confidence_b=0.9,
            influenceability_a=0.01,
            weight_confidence=True,
        )
        assert abs(new_pos) < 0.05


class TestOpinionState:
    """Tests for the OpinionState model."""

    def test_valid_opinion_state(self) -> None:
        """A valid OpinionState creates correctly."""
        o = OpinionState(topic="test", position=0.5, confidence=0.8)
        assert o.topic == "test"
        assert o.last_updated == 0

    def test_position_bounds(self) -> None:
        """Position must be in [-1, 1]."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            OpinionState(topic="test", position=1.5, confidence=0.5)


class TestNetwork:
    """Tests for network topology generation."""

    def test_small_world_node_count(self) -> None:
        """Small-world network has the right number of nodes."""
        g = create_network(100, "small_world", k=6, p=0.1, seed=42)
        assert g.number_of_nodes() == 100

    def test_scale_free_node_count(self) -> None:
        """Scale-free network has the right number of nodes."""
        g = create_network(100, "scale_free", k=6, seed=42)
        assert g.number_of_nodes() == 100

    def test_small_network(self) -> None:
        """A single-node network doesn't crash."""
        g = create_network(1, "small_world")
        assert g.number_of_nodes() == 1

    def test_invalid_topology_raises(self) -> None:
        """Unknown topology raises ValueError."""
        with pytest.raises(ValueError, match="Unknown topology"):
            create_network(10, "banana")

    def test_deterministic_with_seed(self) -> None:
        """Same seed produces same network."""
        g1 = create_network(50, "small_world", k=4, p=0.2, seed=99)
        g2 = create_network(50, "small_world", k=4, p=0.2, seed=99)
        assert list(g1.edges()) == list(g2.edges())


class TestPopulationModel:
    """Tests for the Mesa simulation model."""

    def test_model_initializes(self, sample_personas: list[Persona]) -> None:
        """Model initializes with correct agent count."""
        model = PopulationModel(sample_personas, "test topic")
        agents = [a for a in model.agents if isinstance(a, PersonAgent)]
        assert len(agents) == len(sample_personas)

    def test_agents_have_opinions(self, sample_personas: list[Persona]) -> None:
        """All agents start with an opinion on the topic."""
        model = PopulationModel(sample_personas, "test topic")
        for agent in model.agents:
            if isinstance(agent, PersonAgent):
                assert "test topic" in agent.opinions

    def test_step_updates_step_counter(self, sample_personas: list[Persona]) -> None:
        """Each step increments the step counter."""
        model = PopulationModel(sample_personas, "test topic")
        model.step()
        assert model.steps == 1
        model.step()
        assert model.steps == 2

    def test_opinions_change_after_steps(self, sample_personas: list[Persona]) -> None:
        """Opinions should change after enough steps."""
        model = PopulationModel(sample_personas, "test topic")
        initial_positions = [
            list(a.opinions.values())[0].position
            for a in model.agents
            if isinstance(a, PersonAgent)
        ]
        for _ in range(20):
            model.step()
        final_positions = [
            list(a.opinions.values())[0].position
            for a in model.agents
            if isinstance(a, PersonAgent)
        ]
        # At least some opinions should have changed
        changes = sum(
            abs(i - f) > 0.001
            for i, f in zip(initial_positions, final_positions)
        )
        assert changes > 0

    def test_get_all_opinions(self, sample_personas: list[Persona]) -> None:
        """get_all_opinions returns data for all agents."""
        model = PopulationModel(sample_personas, "test topic")
        opinions = model.get_all_opinions()
        assert len(opinions) == len(sample_personas)
        for o in opinions:
            assert "persona" in o
            assert "opinion" in o

    def test_voter_model_runs(self, sample_personas: list[Persona]) -> None:
        """Voter model variant runs without errors."""
        config = SimulationConfig(opinion_model="voter")
        model = PopulationModel(sample_personas, "test topic", config)
        for _ in range(10):
            model.step()
        assert model.steps == 10


class TestRunSimulation:
    """Tests for the run_simulation helper."""

    def test_runs_correct_steps(self, sample_personas: list[Persona]) -> None:
        """run_simulation executes the right number of steps."""
        model = run_simulation(sample_personas, "test", steps=25)
        assert model.steps == 25

    def test_datacollector_populated(self, sample_personas: list[Persona]) -> None:
        """DataCollector has data after simulation."""
        model = run_simulation(sample_personas, "test", steps=10)
        df = get_opinion_timeseries(model)
        assert len(df) == 10


class TestAggregator:
    """Tests for statistical aggregation."""

    def test_compute_stats(self, sample_personas: list[Persona]) -> None:
        """compute_stats returns valid statistics."""
        model = run_simulation(sample_personas, "test", steps=20)
        stats = compute_stats(model)
        assert stats.total_agents == len(sample_personas)
        assert stats.total_steps == 20
        assert -1.0 <= stats.final_mean_opinion <= 1.0
        assert stats.final_variance >= 0
        assert stats.for_pct + stats.against_pct + stats.neutral_pct == pytest.approx(100.0)

    def test_timeseries_shape(self, sample_personas: list[Persona]) -> None:
        """Timeseries has correct number of rows."""
        model = run_simulation(sample_personas, "test", steps=15)
        df = get_opinion_timeseries(model)
        assert len(df) == 15
        assert "mean_opinion" in df.columns
        assert "opinion_variance" in df.columns
