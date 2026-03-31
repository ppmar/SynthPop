"""Tests for verbalization module."""

import pytest

from synthpop.verbalization.verbalizer import (
    _cluster_opinions,
    _label_cluster,
    _parse_poll_stance,
    PollResult,
    VerbalizedOpinion,
    ClusterSummary,
)


class TestClusterOpinions:
    """Tests for opinion clustering."""

    def test_clusters_with_clear_groups(self) -> None:
        """Opinions with clear separation form distinct clusters."""
        opinions = [
            {"persona": {"id": f"a{i}"}, "opinion": {"position": -0.8}}
            for i in range(10)
        ] + [
            {"persona": {"id": f"b{i}"}, "opinion": {"position": 0.8}}
            for i in range(10)
        ]
        clusters = _cluster_opinions(opinions, n_clusters=2)
        assert len(clusters) == 2

    def test_single_opinion_per_cluster(self) -> None:
        """Fewer opinions than clusters maps one per cluster."""
        opinions = [
            {"persona": {"id": "a"}, "opinion": {"position": -0.5}},
            {"persona": {"id": "b"}, "opinion": {"position": 0.5}},
        ]
        clusters = _cluster_opinions(opinions, n_clusters=4)
        assert len(clusters) == 2

    def test_empty_opinions(self) -> None:
        """Empty input returns empty clusters."""
        clusters = _cluster_opinions([], n_clusters=3)
        assert clusters == {}


class TestLabelCluster:
    """Tests for cluster labeling."""

    def test_strongly_for(self) -> None:
        assert _label_cluster(0.5) == "Strongly for"

    def test_leaning_for(self) -> None:
        assert _label_cluster(0.2) == "Leaning for"

    def test_neutral(self) -> None:
        assert _label_cluster(0.0) == "Neutral / Mixed"

    def test_leaning_against(self) -> None:
        assert _label_cluster(-0.2) == "Leaning against"

    def test_strongly_against(self) -> None:
        assert _label_cluster(-0.5) == "Strongly against"


class TestParsePollStance:
    """Tests for parsing poll response stance/confidence."""

    def test_for_stance(self) -> None:
        text = "I think this is great.\nSTANCE: for\nCONFIDENCE: 0.8"
        clean, position, confidence = _parse_poll_stance(text)
        assert "I think this is great." in clean
        assert position > 0
        assert confidence == 0.8

    def test_against_stance(self) -> None:
        text = "I disagree.\nSTANCE: against\nCONFIDENCE: 0.6"
        clean, position, confidence = _parse_poll_stance(text)
        assert position < 0
        assert confidence == 0.6

    def test_neutral_stance(self) -> None:
        text = "I have no strong opinion.\nSTANCE: neutral\nCONFIDENCE: 0.3"
        clean, position, confidence = _parse_poll_stance(text)
        assert position == 0.0

    def test_missing_stance_defaults(self) -> None:
        text = "Just some text without any stance markers."
        clean, position, confidence = _parse_poll_stance(text)
        assert clean == text
        assert position == 0.0
        assert confidence == 0.5

    def test_invalid_confidence_uses_default(self) -> None:
        text = "Opinion text.\nSTANCE: for\nCONFIDENCE: not_a_number"
        clean, position, confidence = _parse_poll_stance(text)
        assert position > 0
        assert confidence == 0.5


class TestPollResult:
    """Tests for PollResult model."""

    def test_summary_format(self) -> None:
        """Summary produces readable text."""
        result = PollResult(
            question="Test question?",
            total_agents=100,
            for_pct=60.0,
            against_pct=30.0,
            neutral_pct=10.0,
            mean_position=0.2,
            mean_confidence=0.6,
            clusters=[
                ClusterSummary(
                    cluster_id=0,
                    label="Leaning for",
                    mean_position=0.3,
                    agent_count=60,
                    percentage=60.0,
                    representative_quotes=[
                        VerbalizedOpinion(
                            persona_id="p1",
                            persona_name="Alice",
                            position=0.4,
                            confidence=0.7,
                            text="I support this.",
                        )
                    ],
                )
            ],
        )
        summary = result.summary()
        assert "Test question?" in summary
        assert "60.0%" in summary
        assert "Alice" in summary


class TestVerbalizedOpinion:
    """Tests for VerbalizedOpinion model."""

    def test_creation(self) -> None:
        v = VerbalizedOpinion(
            persona_id="p1",
            persona_name="Test",
            position=0.5,
            confidence=0.8,
            text="I agree.",
        )
        assert v.cluster == -1  # default
        assert v.text == "I agree."
