"""Visualization helpers for simulation results."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from synthpop.analysis.aggregator import SimulationStats, get_opinion_timeseries
from synthpop.simulation.model import PopulationModel


def plot_opinion_timeline(
    model: PopulationModel,
    output: str | Path | None = None,
) -> plt.Figure:
    """Plot mean opinion and variance over simulation steps.

    Args:
        model: Completed PopulationModel.
        output: Optional file path to save the figure.

    Returns:
        Matplotlib Figure.
    """
    df = get_opinion_timeseries(model)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True)

    ax1.plot(df["step"], df["mean_opinion"], color="#F5A623", linewidth=2)
    ax1.fill_between(
        df["step"],
        df["mean_opinion"] - np.sqrt(df["opinion_variance"]),
        df["mean_opinion"] + np.sqrt(df["opinion_variance"]),
        alpha=0.2,
        color="#F5A623",
    )
    ax1.set_ylabel("Mean Opinion")
    ax1.set_ylim(-1.1, 1.1)
    ax1.axhline(y=0, color="#555", linestyle="--", alpha=0.5)
    ax1.set_title(f"Opinion Dynamics: {model.topic}")

    ax2.plot(df["step"], df["opinion_variance"], color="#F87171", linewidth=2)
    ax2.set_ylabel("Variance (Polarization)")
    ax2.set_xlabel("Step")

    plt.tight_layout()
    if output:
        fig.savefig(output, dpi=150, bbox_inches="tight")
    return fig


def plot_opinion_distribution(
    model: PopulationModel,
    output: str | Path | None = None,
) -> plt.Figure:
    """Plot histogram of final opinion positions.

    Args:
        model: Completed PopulationModel.
        output: Optional file path to save the figure.

    Returns:
        Matplotlib Figure.
    """
    from synthpop.simulation.agent import PersonAgent

    positions = []
    for agent in model.agents:
        if isinstance(agent, PersonAgent):
            opinion = agent.opinions.get(model.topic)
            if opinion:
                positions.append(opinion.position)

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.hist(
        positions,
        bins=40,
        range=(-1, 1),
        color="#F5A623",
        alpha=0.7,
        edgecolor="#0A0A0F",
    )
    ax.set_xlabel("Opinion Position")
    ax.set_ylabel("Count")
    ax.set_title(f"Opinion Distribution: {model.topic}")
    ax.axvline(x=0, color="#555", linestyle="--", alpha=0.5)

    # Add for/against/neutral zones
    ax.axvspan(-1, -0.1, alpha=0.05, color="#F87171")
    ax.axvspan(0.1, 1, alpha=0.05, color="#34D399")

    plt.tight_layout()
    if output:
        fig.savefig(output, dpi=150, bbox_inches="tight")
    return fig


def plot_network(
    model: PopulationModel,
    output: str | Path | None = None,
) -> plt.Figure:
    """Plot the social network colored by opinion.

    Args:
        model: Completed PopulationModel.
        output: Optional file path to save the figure.

    Returns:
        Matplotlib Figure.
    """
    import networkx as nx
    from synthpop.simulation.agent import PersonAgent

    graph = model.grid.G
    positions_layout = nx.spring_layout(graph, seed=42)

    node_colors = []
    for node in graph.nodes():
        agents = model.grid.get_cell_list_contents([node])
        if agents and isinstance(agents[0], PersonAgent):
            opinion = agents[0].opinions.get(model.topic)
            if opinion:
                node_colors.append(opinion.position)
            else:
                node_colors.append(0.0)
        else:
            node_colors.append(0.0)

    fig, ax = plt.subplots(figsize=(10, 10))

    cmap = sns.diverging_palette(0, 145, s=80, l=55, as_cmap=True)
    nx.draw_networkx_edges(graph, positions_layout, ax=ax, alpha=0.1, edge_color="#555")
    nodes = nx.draw_networkx_nodes(
        graph,
        positions_layout,
        ax=ax,
        node_color=node_colors,
        node_size=30,
        cmap=cmap,
        vmin=-1,
        vmax=1,
    )

    plt.colorbar(nodes, ax=ax, label="Opinion Position", shrink=0.8)
    ax.set_title(f"Social Network: {model.topic}")
    ax.axis("off")

    plt.tight_layout()
    if output:
        fig.savefig(output, dpi=150, bbox_inches="tight")
    return fig
