"""Social network topology generators."""

import networkx as nx
import structlog

logger = structlog.get_logger()


def create_network(
    n: int,
    topology: str = "small_world",
    k: int = 6,
    p: float = 0.1,
    seed: int | None = None,
) -> nx.Graph:
    """Create a social network graph.

    Args:
        n: Number of nodes (agents).
        topology: 'small_world' (Watts-Strogatz) or 'scale_free' (Barabási-Albert).
        k: Average neighbors for small-world, or edges per new node for scale-free.
        p: Rewiring probability (small-world only).
        seed: Random seed for reproducibility.

    Returns:
        A networkx Graph with n nodes.
    """
    if n < 2:
        g = nx.Graph()
        g.add_nodes_from(range(n))
        return g

    if topology == "small_world":
        # Watts-Strogatz requires k >= 2 and even
        effective_k = max(2, k if k % 2 == 0 else k + 1)
        effective_k = min(effective_k, n - 1)
        g = nx.watts_strogatz_graph(n, effective_k, p, seed=seed)
    elif topology == "scale_free":
        m = max(1, k // 2)
        g = nx.barabasi_albert_graph(n, m, seed=seed)
    else:
        raise ValueError(f"Unknown topology: {topology}. Use 'small_world' or 'scale_free'.")

    logger.info(
        "network_created",
        topology=topology,
        nodes=g.number_of_nodes(),
        edges=g.number_of_edges(),
    )
    return g
