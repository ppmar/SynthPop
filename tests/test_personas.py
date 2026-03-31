"""Tests for persona models and generation."""

import json
import tempfile
from pathlib import Path

import pytest
from pydantic import ValidationError

from synthpop.config import SynthPopConfig
from synthpop.personas.models import Persona, DemographicSkeleton
from synthpop.personas.generator import (
    sample_skeletons,
    _parse_persona_response,
    save_personas,
    load_personas,
)


class TestPersonaModel:
    """Tests for the Persona pydantic model."""

    def test_valid_persona(self, sample_personas: list[Persona]) -> None:
        """A well-formed persona validates correctly."""
        p = sample_personas[0]
        assert p.id == "test-000"
        assert 18 <= p.age <= 100
        assert -1.0 <= p.political_leaning <= 1.0

    def test_persona_serialization_roundtrip(self, sample_personas: list[Persona]) -> None:
        """Persona serializes to JSON and back."""
        p = sample_personas[0]
        json_str = p.model_dump_json()
        restored = Persona.model_validate_json(json_str)
        assert restored == p

    def test_invalid_age_rejected(self) -> None:
        """Ages outside 18-100 are rejected."""
        with pytest.raises(ValidationError):
            Persona(
                id="bad", name="Bad", age=5, gender="x", occupation="x",
                education="bac", location_type="urban", country="FR",
                income_bracket="low", personality_traits=[], values=[],
                political_leaning=0, tech_savviness=0.5, risk_tolerance=0.5,
                influenceability=0.5, backstory="x",
            )

    def test_invalid_political_leaning_rejected(self) -> None:
        """Political leaning outside [-1, 1] is rejected."""
        with pytest.raises(ValidationError):
            Persona(
                id="bad", name="Bad", age=30, gender="x", occupation="x",
                education="bac", location_type="urban", country="FR",
                income_bracket="low", personality_traits=[], values=[],
                political_leaning=2.0, tech_savviness=0.5, risk_tolerance=0.5,
                influenceability=0.5, backstory="x",
            )


class TestSkeletonSampling:
    """Tests for demographic skeleton sampling."""

    def test_correct_count(self, default_config: SynthPopConfig) -> None:
        """Sample produces the correct number of skeletons."""
        skeletons = sample_skeletons(default_config)
        assert len(skeletons) == default_config.population.size

    def test_deterministic_with_seed(self, default_config: SynthPopConfig) -> None:
        """Same seed produces identical demographic attributes."""
        s1 = sample_skeletons(default_config, seed=123)
        s2 = sample_skeletons(default_config, seed=123)
        # IDs are UUIDs (not seeded), but demographics must match
        assert [s.age for s in s1] == [s.age for s in s2]
        assert [s.gender for s in s1] == [s.gender for s in s2]
        assert [s.education for s in s1] == [s.education for s in s2]

    def test_different_seeds_differ(self, default_config: SynthPopConfig) -> None:
        """Different seeds produce different skeletons."""
        s1 = sample_skeletons(default_config, seed=1)
        s2 = sample_skeletons(default_config, seed=2)
        ages1 = [s.age for s in s1]
        ages2 = [s.age for s in s2]
        assert ages1 != ages2

    def test_valid_demographic_values(self, default_config: SynthPopConfig) -> None:
        """All sampled values come from valid categories."""
        skeletons = sample_skeletons(default_config)
        valid_locations = {"urban", "suburban", "rural"}
        valid_educations = {"bac", "licence", "master", "doctorat", "autodidacte"}
        for s in skeletons:
            assert s.location_type in valid_locations
            assert s.education in valid_educations
            assert 18 <= s.age <= 100


class TestParsePersonaResponse:
    """Tests for LLM response parsing."""

    def test_valid_json_response(self) -> None:
        """A valid JSON response is parsed into a Persona."""
        skeleton = DemographicSkeleton(
            id="abc", age=35, gender="femme", education="master",
            location_type="urban", country="France", income_bracket="middle",
        )
        raw = json.dumps({
            "name": "Marie Dupont",
            "occupation": "ingénieure",
            "personality_traits": ["openness:high", "conscientiousness:medium",
                                   "extraversion:high", "agreeableness:medium",
                                   "neuroticism:low"],
            "values": ["innovation", "equality", "freedom"],
            "political_leaning": -0.3,
            "tech_savviness": 0.8,
            "risk_tolerance": 0.5,
            "influenceability": 0.4,
            "backstory": "Marie grew up in Lyon. She studied engineering."
        })
        persona = _parse_persona_response(skeleton, raw)
        assert persona.name == "Marie Dupont"
        assert persona.age == 35
        assert persona.id == "abc"

    def test_json_with_markdown_fences(self) -> None:
        """JSON wrapped in ```json ... ``` is handled."""
        skeleton = DemographicSkeleton(
            id="def", age=50, gender="homme", education="bac",
            location_type="rural", country="France", income_bracket="low",
        )
        raw = '```json\n' + json.dumps({
            "name": "Pierre Martin",
            "occupation": "agriculteur",
            "personality_traits": ["openness:low"],
            "values": ["tradition"],
            "political_leaning": 0.3,
            "tech_savviness": 0.2,
            "risk_tolerance": 0.3,
            "influenceability": 0.5,
            "backstory": "Pierre lives on a farm."
        }) + '\n```'
        persona = _parse_persona_response(skeleton, raw)
        assert persona.name == "Pierre Martin"

    def test_invalid_json_raises(self) -> None:
        """Invalid JSON raises an error."""
        skeleton = DemographicSkeleton(
            id="bad", age=30, gender="x", education="bac",
            location_type="urban", country="FR", income_bracket="low",
        )
        with pytest.raises(json.JSONDecodeError):
            _parse_persona_response(skeleton, "not json at all")


class TestPersonaPersistence:
    """Tests for saving/loading personas to JSONL."""

    def test_save_and_load_roundtrip(self, sample_personas: list[Persona]) -> None:
        """Personas survive a save/load roundtrip."""
        with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
            path = Path(f.name)

        try:
            save_personas(sample_personas, path)
            loaded = load_personas(path)
            assert len(loaded) == len(sample_personas)
            for orig, restored in zip(sample_personas, loaded):
                assert orig.id == restored.id
                assert orig.name == restored.name
                assert orig.age == restored.age
        finally:
            path.unlink()

    def test_empty_list_produces_empty_file(self) -> None:
        """Saving an empty list creates an empty file."""
        with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
            path = Path(f.name)

        try:
            save_personas([], path)
            loaded = load_personas(path)
            assert loaded == []
        finally:
            path.unlink()
