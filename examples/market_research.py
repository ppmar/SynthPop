"""Market research example: simulate product feedback from diverse demographics.

Generates multiple demographic segments, polls them about a product,
and compares opinions across segments.
"""

import asyncio
from copy import deepcopy

from synthpop.api.client import AnthropicClient
from synthpop.config import load_config
from synthpop.personas.generator import generate_population, sample_skeletons, generate_personas
from synthpop.verbalization.verbalizer import poll_population


async def main() -> None:
    cfg = load_config("config/default.yaml")
    client = AnthropicClient(max_cost_usd=10.0)
    question = "Would you pay 15€/month for an AI assistant that manages your household budget?"

    # Define segments with different demographic profiles
    segments = {
        "Young urban (18-30)": {
            "age": {"18-25": 0.5, "26-35": 0.5},
            "location_type": {"urban": 0.9, "suburban": 0.1, "rural": 0.0},
        },
        "Middle-aged suburban (35-55)": {
            "age": {"36-50": 0.7, "51-65": 0.3},
            "location_type": {"urban": 0.2, "suburban": 0.7, "rural": 0.1},
        },
        "Senior rural (60+)": {
            "age": {"51-65": 0.3, "66+": 0.7},
            "location_type": {"urban": 0.1, "suburban": 0.2, "rural": 0.7},
        },
    }

    print(f"Question: {question}\n")
    print("=" * 60)

    all_results = {}

    for segment_name, overrides in segments.items():
        print(f"\n--- {segment_name} ---")

        # Override demographics for this segment
        seg_cfg = deepcopy(cfg)
        seg_cfg.population.size = 30
        for key, dist in overrides.items():
            # Pad missing keys with 0
            current = getattr(seg_cfg.population.distributions, key)
            for k in current:
                if k not in dist:
                    dist[k] = 0.0
            setattr(seg_cfg.population.distributions, key, dist)

        print(f"  Generating {seg_cfg.population.size} personas...")
        personas = await generate_population(config=seg_cfg)
        print(f"  Generated {len(personas)} personas")

        print(f"  Polling...")
        result = await poll_population(
            population=personas,
            question=question,
            client=client,
        )

        all_results[segment_name] = result
        print(f"  For: {result.for_pct:.1f}% | Against: {result.against_pct:.1f}% | Neutral: {result.neutral_pct:.1f}%")

    # Compare segments
    print("\n" + "=" * 60)
    print("\nCross-segment comparison:")
    print(f"{'Segment':<35} {'For':>6} {'Against':>8} {'Neutral':>8}")
    print("-" * 60)
    for name, result in all_results.items():
        print(f"{name:<35} {result.for_pct:>5.1f}% {result.against_pct:>7.1f}% {result.neutral_pct:>7.1f}%")

    print(f"\nTotal API cost: ${client.usage.total_cost_usd:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
