"""Debate example: agents discuss a topic and update opinions over time.

Generates a population, runs a bounded-confidence simulation,
then verbalizes the final opinion clusters.
"""

import asyncio

from synthpop.api.client import AnthropicClient
from synthpop.config import load_config
from synthpop.personas.generator import generate_population
from synthpop.simulation.model import run_simulation
from synthpop.analysis.aggregator import compute_stats
from synthpop.analysis.viz import plot_opinion_timeline, plot_opinion_distribution
from synthpop.verbalization.verbalizer import verbalize_opinions


async def main() -> None:
    cfg = load_config("config/default.yaml")

    # Step 1: Generate population
    print("Generating 100 personas...")
    personas = await generate_population(n=100, config=cfg)
    print(f"  Generated {len(personas)} personas")

    # Step 2: Run simulation
    topic = "Should remote work be mandatory 3 days per week?"
    print(f"\nRunning simulation: '{topic}' (100 steps, bounded confidence)...")
    model = run_simulation(personas, topic, cfg.simulation, steps=100)

    # Step 3: Analyze
    stats = compute_stats(model)
    print(f"\n--- Results after {stats.total_steps} steps ---")
    print(f"Mean opinion: {stats.final_mean_opinion:.3f}")
    print(f"Variance: {stats.final_variance:.3f}")
    print(f"Polarization: {stats.polarization_index:.3f}")
    print(f"For: {stats.for_pct:.1f}% | Against: {stats.against_pct:.1f}% | Neutral: {stats.neutral_pct:.1f}%")
    if stats.convergence_step:
        print(f"Converged at step: {stats.convergence_step}")

    # Step 4: Save plots
    plot_opinion_timeline(model, "output/debate_timeline.png")
    plot_opinion_distribution(model, "output/debate_distribution.png")
    print("\nPlots saved to output/")

    # Step 5: Verbalize
    print("\nVerbalizing opinions...")
    client = AnthropicClient(max_cost_usd=5.0)
    opinions = model.get_all_opinions()
    result = await verbalize_opinions(opinions, topic, client, cfg.verbalization)
    print(result.summary())
    print(f"\nTotal API cost: ${client.usage.total_cost_usd:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
