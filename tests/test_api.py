"""Tests for the API client wrapper (unit tests, no real API calls)."""

import pytest

from synthpop.api.client import UsageStats, CostLimitExceeded, MODEL_PRICING


class TestUsageStats:
    """Tests for usage tracking."""

    def test_record_updates_totals(self) -> None:
        """Recording usage updates all counters."""
        stats = UsageStats()
        cost = stats.record("claude-haiku-4-5", input_tokens=1000, output_tokens=500)

        assert stats.total_input_tokens == 1000
        assert stats.total_output_tokens == 500
        assert stats.request_count == 1
        assert cost > 0

    def test_record_accumulates(self) -> None:
        """Multiple records accumulate correctly."""
        stats = UsageStats()
        stats.record("claude-haiku-4-5", 1000, 500)
        stats.record("claude-haiku-4-5", 2000, 1000)

        assert stats.total_input_tokens == 3000
        assert stats.total_output_tokens == 1500
        assert stats.request_count == 2

    def test_cost_calculation(self) -> None:
        """Cost is calculated correctly from pricing."""
        stats = UsageStats()
        # Haiku: $1.00 input, $5.00 output per 1M tokens
        cost = stats.record("claude-haiku-4-5", input_tokens=1_000_000, output_tokens=1_000_000)
        expected = 1.00 + 5.00  # $6.00 total
        assert abs(cost - expected) < 0.01

    def test_summary_dict(self) -> None:
        """Summary returns a well-formed dict."""
        stats = UsageStats()
        stats.record("claude-haiku-4-5", 100, 50)
        summary = stats.summary()
        assert "total_input_tokens" in summary
        assert "total_cost_usd" in summary
        assert "by_model" in summary

    def test_by_model_tracking(self) -> None:
        """Usage is tracked per model."""
        stats = UsageStats()
        stats.record("claude-haiku-4-5", 1000, 500)
        stats.record("claude-sonnet-4-0", 2000, 1000)

        summary = stats.summary()
        assert "claude-haiku-4-5" in summary["by_model"]
        assert "claude-sonnet-4-0" in summary["by_model"]


class TestAnthropicClient:
    """Tests for client initialization (no API calls)."""

    def test_missing_api_key_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Client raises ValueError without API key."""
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        from synthpop.api.client import AnthropicClient

        with pytest.raises(ValueError, match="No API key"):
            AnthropicClient(api_key=None)

    def test_cost_limit_check(self) -> None:
        """Cost limit is enforced."""
        from synthpop.api.client import AnthropicClient

        client = AnthropicClient(api_key="test-key", max_cost_usd=0.01)
        # Manually push usage over limit
        client.usage.record("claude-haiku-4-5", 1_000_000, 1_000_000)
        with pytest.raises(CostLimitExceeded):
            client._check_cost()


class TestModelPricing:
    """Tests for pricing constants."""

    def test_all_models_have_pricing(self) -> None:
        """All expected models have pricing defined."""
        assert "claude-haiku-4-5" in MODEL_PRICING
        assert "claude-sonnet-4-0" in MODEL_PRICING

    def test_pricing_tuples_are_positive(self) -> None:
        """All prices are positive."""
        for model, (input_price, output_price) in MODEL_PRICING.items():
            assert input_price > 0, f"{model} input price"
            assert output_price > 0, f"{model} output price"
