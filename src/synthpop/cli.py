"""CLI entrypoint for SynthPop."""

import asyncio
import json
from pathlib import Path

import typer
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

app = typer.Typer(
    name="synthpop",
    help="SynthPop — Synthetic Population Opinion Simulator",
    no_args_is_help=True,
)


@app.command()
def generate(
    config: str = typer.Option("config/default.yaml", help="Path to config YAML"),
    output: str = typer.Option("population.jsonl", help="Output JSONL path"),
    n: int | None = typer.Option(None, help="Override population size"),
) -> None:
    """Generate a synthetic population."""
    from synthpop.personas.generator import generate_population

    personas = asyncio.run(generate_population(n=n, config=config, output=output))
    typer.echo(f"Generated {len(personas)} personas → {output}")


@app.command()
def simulate(
    population: str = typer.Option(..., help="Path to population JSONL"),
    topic: str = typer.Option(..., help="Opinion topic"),
    steps: int = typer.Option(50, help="Number of simulation steps"),
    config: str = typer.Option("config/default.yaml", help="Path to config YAML"),
    output: str = typer.Option(None, help="Output JSON path for results"),
) -> None:
    """Run an opinion dynamics simulation."""
    from synthpop.config import load_config
    from synthpop.personas.generator import load_personas
    from synthpop.simulation.model import run_simulation
    from synthpop.analysis.aggregator import compute_stats

    cfg = load_config(config)
    personas = load_personas(population)
    model = run_simulation(personas, topic, cfg.simulation, steps=steps)
    stats = compute_stats(model)

    typer.echo(f"\nSimulation complete: {stats.total_steps} steps")
    typer.echo(f"Mean opinion: {stats.final_mean_opinion:.3f}")
    typer.echo(f"Variance: {stats.final_variance:.3f}")
    typer.echo(f"For: {stats.for_pct:.1f}% | Against: {stats.against_pct:.1f}% | Neutral: {stats.neutral_pct:.1f}%")

    if output:
        Path(output).write_text(stats.model_dump_json(indent=2))
        typer.echo(f"Results saved → {output}")


@app.command()
def ask(
    population: str = typer.Option(..., help="Path to population JSONL"),
    question: str = typer.Option(..., help="Question to ask"),
    sample: int = typer.Option(20, help="Number of agents to verbalize"),
    config: str = typer.Option("config/default.yaml", help="Path to config YAML"),
) -> None:
    """Ask a question to an existing population (no simulation)."""
    from synthpop.api.client import AnthropicClient
    from synthpop.config import load_config
    from synthpop.personas.generator import load_personas
    from synthpop.verbalization.verbalizer import poll_population

    cfg = load_config(config)
    personas = load_personas(population)
    client = AnthropicClient(
        max_cost_usd=cfg.api.max_cost_usd,
        max_retries=cfg.api.max_retries,
    )

    result = asyncio.run(
        poll_population(personas, question, client, sample=sample)
    )
    typer.echo(result.summary())


@app.command()
def poll(
    question: str = typer.Argument(..., help="Question to ask"),
    n: int = typer.Option(100, help="Population size"),
    config: str = typer.Option("config/default.yaml", help="Path to config YAML"),
) -> None:
    """Quick one-shot poll: generate a population and ask a question."""
    from synthpop.api.client import AnthropicClient
    from synthpop.config import load_config
    from synthpop.personas.generator import generate_population
    from synthpop.verbalization.verbalizer import poll_population

    cfg = load_config(config)

    async def _run() -> None:
        client = AnthropicClient(
            max_cost_usd=cfg.api.max_cost_usd,
            max_retries=cfg.api.max_retries,
        )

        typer.echo(f"Generating {n} personas...")
        personas = await generate_population(n=n, config=cfg)

        typer.echo(f"Polling {len(personas)} agents...")
        result = await poll_population(personas, question, client)
        typer.echo(result.summary())

        typer.echo(f"\nAPI cost: ${client.usage.total_cost_usd:.4f}")

    asyncio.run(_run())


@app.command()
def run(
    config: str = typer.Option("config/default.yaml", help="Path to config YAML"),
    topic: str = typer.Option(..., help="Opinion topic"),
    steps: int = typer.Option(100, help="Number of simulation steps"),
    verbalize: bool = typer.Option(False, help="Verbalize final opinions"),
    output_dir: str = typer.Option("output", help="Output directory"),
) -> None:
    """Full pipeline: generate → simulate → (optionally) verbalize."""
    from synthpop.api.client import AnthropicClient
    from synthpop.config import load_config
    from synthpop.personas.generator import generate_population, save_personas
    from synthpop.simulation.model import run_simulation
    from synthpop.analysis.aggregator import compute_stats
    from synthpop.analysis.viz import plot_opinion_timeline, plot_opinion_distribution
    from synthpop.verbalization.verbalizer import verbalize_opinions

    cfg = load_config(config)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    async def _run() -> None:
        typer.echo(f"Generating {cfg.population.size} personas...")
        personas = await generate_population(config=cfg)
        save_personas(personas, out / "population.jsonl")

        typer.echo(f"Running simulation: {steps} steps on '{topic}'...")
        model = run_simulation(personas, topic, cfg.simulation, steps=steps)
        stats = compute_stats(model)

        typer.echo(f"\nMean opinion: {stats.final_mean_opinion:.3f}")
        typer.echo(f"Variance: {stats.final_variance:.3f}")
        typer.echo(f"For: {stats.for_pct:.1f}% | Against: {stats.against_pct:.1f}% | Neutral: {stats.neutral_pct:.1f}%")

        # Save stats
        (out / "stats.json").write_text(stats.model_dump_json(indent=2))

        # Save plots
        plot_opinion_timeline(model, out / "timeline.png")
        plot_opinion_distribution(model, out / "distribution.png")
        typer.echo(f"Plots saved → {out}/")

        if verbalize:
            client = AnthropicClient(
                max_cost_usd=cfg.api.max_cost_usd,
                max_retries=cfg.api.max_retries,
            )
            opinions = model.get_all_opinions()
            result = await verbalize_opinions(
                opinions, topic, client, cfg.verbalization
            )
            typer.echo("\n" + result.summary())
            (out / "verbalization.json").write_text(result.model_dump_json(indent=2))
            typer.echo(f"\nAPI cost: ${client.usage.total_cost_usd:.4f}")

    asyncio.run(_run())


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", help="Bind host"),
    port: int = typer.Option(8000, help="Bind port"),
) -> None:
    """Start the REST API server for frontend integration."""
    from synthpop.api.server import start_server

    typer.echo(f"Starting SynthPop API server on {host}:{port}")
    start_server(host=host, port=port)


if __name__ == "__main__":
    app()
