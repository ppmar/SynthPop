"""Quick poll example: generate 100 agents and ask them a question."""

import asyncio

from synthpop.api.client import AnthropicClient
from synthpop.personas.generator import generate_population
from synthpop.verbalization.verbalizer import poll_population


async def main() -> None:
    population = await generate_population(n=100, config="config/default.yaml")

    client = AnthropicClient(max_cost_usd=5.0)
    results = await poll_population(
        population=population,
        question="Should university education be free?",
        client=client,
    )

    print(results.summary())
    print(f"\nTotal API cost: ${client.usage.total_cost_usd:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
