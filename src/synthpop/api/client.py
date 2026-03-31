"""Anthropic API client wrapper with retry, cost tracking, and batching."""

import asyncio
import os
from dataclasses import dataclass, field

import anthropic
import structlog

logger = structlog.get_logger()

# Pricing per million tokens (input, output)
MODEL_PRICING: dict[str, tuple[float, float]] = {
    "claude-sonnet-4-0": (3.00, 15.00),
    "claude-haiku-4-5": (1.00, 5.00),
    "claude-opus-4-6": (5.00, 25.00),
}

# Default models per use case
MODEL_GENERATION = "claude-sonnet-4-0"
MODEL_BULK = "claude-haiku-4-5"


@dataclass
class UsageStats:
    """Tracks cumulative token usage and cost."""

    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    request_count: int = 0
    _by_model: dict[str, dict[str, int]] = field(default_factory=dict)

    def record(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Record usage from a single API call. Returns incremental cost."""
        input_price, output_price = MODEL_PRICING.get(model, (5.00, 25.00))
        cost = (input_tokens * input_price + output_tokens * output_price) / 1_000_000

        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_cost_usd += cost
        self.request_count += 1

        if model not in self._by_model:
            self._by_model[model] = {"input_tokens": 0, "output_tokens": 0}
        self._by_model[model]["input_tokens"] += input_tokens
        self._by_model[model]["output_tokens"] += output_tokens

        return cost

    def summary(self) -> dict:
        """Return a summary dict of usage stats."""
        return {
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cost_usd": round(self.total_cost_usd, 6),
            "request_count": self.request_count,
            "by_model": dict(self._by_model),
        }


class CostLimitExceeded(Exception):
    """Raised when cumulative API cost exceeds the configured ceiling."""


class AnthropicClient:
    """Async wrapper around the Anthropic API with cost tracking and batching.

    Args:
        api_key: Anthropic API key. Falls back to ANTHROPIC_API_KEY env var.
        max_cost_usd: Maximum cumulative cost before raising CostLimitExceeded.
        max_retries: Number of automatic retries on transient errors.
    """

    def __init__(
        self,
        api_key: str | None = None,
        max_cost_usd: float = 5.0,
        max_retries: int = 3,
    ) -> None:
        resolved_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not resolved_key:
            raise ValueError(
                "No API key provided. Set ANTHROPIC_API_KEY or pass api_key."
            )
        self._client = anthropic.AsyncAnthropic(
            api_key=resolved_key,
            max_retries=max_retries,
        )
        self.max_cost_usd = max_cost_usd
        self.usage = UsageStats()

    def _check_cost(self) -> None:
        """Raise if cumulative cost exceeds ceiling."""
        if self.usage.total_cost_usd >= self.max_cost_usd:
            raise CostLimitExceeded(
                f"Cost ${self.usage.total_cost_usd:.4f} exceeds "
                f"limit ${self.max_cost_usd:.2f}"
            )

    async def complete(
        self,
        messages: list[dict],
        model: str = MODEL_BULK,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 1.0,
    ) -> str:
        """Send a single message request and return the text response.

        Args:
            messages: Conversation messages.
            model: Model ID to use.
            system: Optional system prompt.
            max_tokens: Maximum output tokens.
            temperature: Sampling temperature.

        Returns:
            The text content of the response.

        Raises:
            CostLimitExceeded: If cumulative cost exceeds max_cost_usd.
        """
        self._check_cost()

        kwargs: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": messages,
            "temperature": temperature,
        }
        if system:
            kwargs["system"] = system

        response = await self._client.messages.create(**kwargs)

        cost = self.usage.record(
            model=model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )
        logger.debug(
            "api_call",
            model=model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            cost_usd=round(cost, 6),
            cumulative_cost=round(self.usage.total_cost_usd, 6),
        )

        return response.content[0].text

    async def complete_json(
        self,
        messages: list[dict],
        model: str = MODEL_BULK,
        system: str | None = None,
        max_tokens: int = 2048,
        temperature: float = 1.0,
    ) -> str:
        """Send a request expecting JSON output.

        Wraps complete() but instructs the model to respond with valid JSON.

        Args:
            messages: Conversation messages.
            model: Model ID to use.
            system: Optional system prompt (JSON instruction is prepended).
            max_tokens: Maximum output tokens.
            temperature: Sampling temperature.

        Returns:
            Raw JSON string from the model response.
        """
        json_instruction = "Respond with valid JSON only. No markdown, no commentary."
        full_system = (
            f"{json_instruction}\n\n{system}" if system else json_instruction
        )
        return await self.complete(
            messages=messages,
            model=model,
            system=full_system,
            max_tokens=max_tokens,
            temperature=temperature,
        )

    async def complete_batch(
        self,
        prompts: list[str],
        model: str = MODEL_BULK,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 1.0,
        batch_size: int = 10,
    ) -> list[str]:
        """Process multiple prompts concurrently in batches.

        Args:
            prompts: List of user message strings.
            model: Model ID to use.
            system: Optional system prompt applied to all requests.
            max_tokens: Maximum output tokens per request.
            temperature: Sampling temperature.
            batch_size: Number of concurrent requests per batch.

        Returns:
            List of text responses in the same order as prompts.
        """
        results: list[str] = []

        for i in range(0, len(prompts), batch_size):
            batch = prompts[i : i + batch_size]
            tasks = [
                self.complete(
                    messages=[{"role": "user", "content": prompt}],
                    model=model,
                    system=system,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                for prompt in batch
            ]
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
            logger.info(
                "batch_progress",
                completed=min(i + batch_size, len(prompts)),
                total=len(prompts),
            )

        return results
