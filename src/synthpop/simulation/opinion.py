"""Opinion dynamics models: Bounded Confidence and Voter Model."""

from pydantic import BaseModel, Field


class OpinionState(BaseModel):
    """An agent's opinion on a specific topic."""

    topic: str
    position: float = Field(ge=-1.0, le=1.0, description="Against (-1) to For (+1)")
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning_tags: list[str] = Field(
        default_factory=list,
        description='e.g. ["economic", "moral", "personal_experience"]',
    )
    last_updated: int = 0


def bounded_confidence_update(
    position_a: float,
    position_b: float,
    confidence_a: float,
    confidence_b: float,
    influenceability_a: float,
    epsilon: float = 0.3,
    mu: float = 0.1,
) -> tuple[float, float]:
    """Deffuant-Weisbuch bounded confidence update for agent A.

    Two agents interact only if their opinion distance < epsilon.
    Agent A moves toward B proportionally to mu and its influenceability.

    Args:
        position_a: Agent A's current opinion position.
        position_b: Agent B's current opinion position.
        confidence_a: Agent A's confidence level.
        confidence_b: Agent B's confidence level.
        influenceability_a: How susceptible agent A is to influence.
        epsilon: Maximum opinion distance for interaction.
        mu: Base convergence speed.

    Returns:
        Tuple of (new_position_a, new_confidence_a).
    """
    distance = abs(position_a - position_b)

    if distance >= epsilon:
        return position_a, confidence_a

    # Effective influence: scaled by influenceability and relative confidence
    effective_mu = mu * influenceability_a * (confidence_b / max(confidence_a, 0.01))
    effective_mu = min(effective_mu, 0.5)  # cap to prevent overshooting

    new_position = position_a + effective_mu * (position_b - position_a)
    new_position = max(-1.0, min(1.0, new_position))

    # Confidence increases slightly when interacting with similar opinions
    confidence_shift = 0.01 * (1.0 - distance / epsilon)
    new_confidence = min(1.0, confidence_a + confidence_shift)

    return new_position, new_confidence


def voter_model_update(
    position_a: float,
    confidence_a: float,
    position_b: float,
    confidence_b: float,
    influenceability_a: float,
    weight_confidence: bool = True,
) -> tuple[float, float]:
    """Voter model update: agent A may copy agent B's opinion.

    Args:
        position_a: Agent A's current position.
        confidence_a: Agent A's confidence.
        position_b: Neighbor B's position.
        confidence_b: Neighbor B's confidence.
        influenceability_a: How susceptible agent A is.
        weight_confidence: Whether to weight by neighbor's confidence.

    Returns:
        Tuple of (new_position_a, new_confidence_a).
    """
    adoption_probability = influenceability_a
    if weight_confidence:
        adoption_probability *= confidence_b

    # Instead of a hard copy, blend toward neighbor's position
    blend = adoption_probability * 0.3
    new_position = position_a + blend * (position_b - position_a)
    new_position = max(-1.0, min(1.0, new_position))

    # Confidence drifts toward neighbor's
    new_confidence = confidence_a + 0.05 * (confidence_b - confidence_a)
    new_confidence = max(0.0, min(1.0, new_confidence))

    return new_position, new_confidence
