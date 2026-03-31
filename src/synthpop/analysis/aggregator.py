"""Opinion aggregation and statistics."""

import numpy as np
import pandas as pd
from pydantic import BaseModel

from synthpop.simulation.agent import PersonAgent
from synthpop.simulation.model import PopulationModel


class SimulationStats(BaseModel):
    """Aggregate statistics from a simulation run."""

    topic: str
    total_agents: int
    total_steps: int
    final_mean_opinion: float
    final_variance: float
    final_mean_confidence: float
    polarization_index: float
    convergence_step: int | None = None
    for_pct: float
    against_pct: float
    neutral_pct: float


def compute_stats(model: PopulationModel) -> SimulationStats:
    """Compute aggregate statistics from a completed simulation.

    Args:
        model: The PopulationModel after simulation.

    Returns:
        SimulationStats with key metrics.
    """
    positions = []
    confidences = []
    for agent in model.agents:
        if not isinstance(agent, PersonAgent):
            continue
        opinion = agent.opinions.get(model.topic)
        if opinion:
            positions.append(opinion.position)
            confidences.append(opinion.confidence)

    positions_arr = np.array(positions)
    total = len(positions)

    mean_opinion = float(np.mean(positions_arr)) if total else 0.0
    variance = float(np.var(positions_arr)) if total else 0.0
    mean_confidence = float(np.mean(confidences)) if total else 0.0

    # Polarization: bimodality coefficient
    # Higher values = more polarized
    if total > 2:
        skewness = float(pd.Series(positions).skew())
        kurtosis = float(pd.Series(positions).kurtosis())
        polarization = (skewness**2 + 1) / (kurtosis + 3 * ((total - 1) ** 2) / ((total - 2) * (total - 3)))
    else:
        polarization = 0.0

    # Detect convergence: when variance stops changing significantly
    model_data = model.datacollector.get_model_vars_dataframe()
    convergence_step = None
    if len(model_data) > 10:
        variances = model_data["opinion_variance"].values
        for i in range(10, len(variances)):
            window = variances[i - 10 : i]
            if np.std(window) < 0.001:
                convergence_step = i - 10
                break

    for_count = int(np.sum(positions_arr > 0.1))
    against_count = int(np.sum(positions_arr < -0.1))
    neutral_count = total - for_count - against_count

    return SimulationStats(
        topic=model.topic,
        total_agents=total,
        total_steps=model.steps,
        final_mean_opinion=mean_opinion,
        final_variance=variance,
        final_mean_confidence=mean_confidence,
        polarization_index=polarization,
        convergence_step=convergence_step,
        for_pct=for_count / total * 100 if total else 0,
        against_pct=against_count / total * 100 if total else 0,
        neutral_pct=neutral_count / total * 100 if total else 0,
    )


def get_opinion_timeseries(model: PopulationModel) -> pd.DataFrame:
    """Extract model-level opinion timeseries from DataCollector.

    Args:
        model: The PopulationModel after simulation.

    Returns:
        DataFrame with columns: step, mean_opinion, opinion_variance, mean_confidence.
    """
    df = model.datacollector.get_model_vars_dataframe()
    df = df.reset_index()
    df.columns = ["step", "mean_opinion", "opinion_variance", "mean_confidence"]
    return df


def get_agent_trajectories(model: PopulationModel) -> pd.DataFrame:
    """Extract per-agent opinion trajectories.

    Args:
        model: The PopulationModel after simulation.

    Returns:
        DataFrame with columns: step, agent_id, position, confidence.
    """
    df = model.datacollector.get_agent_dataframe()
    df = df.reset_index()
    if len(df.columns) == 4:
        df.columns = ["step", "agent_id", "position", "confidence"]
    return df
