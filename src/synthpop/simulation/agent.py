"""Mesa Agent subclass representing a person in the simulation."""

import mesa
import numpy as np

from synthpop.personas.models import Persona
from synthpop.simulation.opinion import (
    OpinionState,
    bounded_confidence_update,
    voter_model_update,
)


class PersonAgent(mesa.Agent):
    """A simulated person with a persona and opinions.

    Attributes:
        persona: The underlying Persona data.
        opinions: Mapping of topic to OpinionState.
    """

    def __init__(self, model: mesa.Model, persona: Persona) -> None:
        super().__init__(model)
        self.persona = persona
        self.opinions: dict[str, OpinionState] = {}

    def initialize_opinion(
        self,
        topic: str,
        rng: np.random.Generator | None = None,
    ) -> None:
        """Set an initial opinion on a topic based on persona traits.

        Args:
            topic: The opinion topic.
            rng: Random generator for initial position noise.
        """
        if rng is None:
            rng = np.random.default_rng()

        # Base position influenced by political leaning + noise
        base = self.persona.political_leaning * 0.3
        noise = rng.normal(0, 0.3)
        position = max(-1.0, min(1.0, base + noise))

        # Initial confidence based on education and personality
        confidence = 0.3 + rng.uniform(0, 0.4)

        self.opinions[topic] = OpinionState(
            topic=topic,
            position=position,
            confidence=confidence,
            reasoning_tags=[],
            last_updated=0,
        )

    def step(self) -> None:
        """Execute one interaction step: pick a neighbor and update opinion."""
        if not self.opinions:
            return

        neighbors = self.model.grid.get_neighbors(self.pos, include_center=False)
        if not neighbors:
            return

        neighbor = self.random.choice(neighbors)
        if not isinstance(neighbor, PersonAgent):
            return

        opinion_model = getattr(self.model, "opinion_model", "bounded_confidence")

        for topic, my_opinion in self.opinions.items():
            their_opinion = neighbor.opinions.get(topic)
            if their_opinion is None:
                continue

            if opinion_model == "bounded_confidence":
                epsilon = getattr(self.model, "epsilon", 0.3)
                mu = getattr(self.model, "mu", 0.1)
                new_pos, new_conf = bounded_confidence_update(
                    position_a=my_opinion.position,
                    position_b=their_opinion.position,
                    confidence_a=my_opinion.confidence,
                    confidence_b=their_opinion.confidence,
                    influenceability_a=self.persona.influenceability,
                    epsilon=epsilon,
                    mu=mu,
                )
            elif opinion_model == "voter":
                weight_conf = getattr(self.model, "weight_confidence", True)
                new_pos, new_conf = voter_model_update(
                    position_a=my_opinion.position,
                    confidence_a=my_opinion.confidence,
                    position_b=their_opinion.position,
                    confidence_b=their_opinion.confidence,
                    influenceability_a=self.persona.influenceability,
                    weight_confidence=weight_conf,
                )
            else:
                continue

            my_opinion.position = new_pos
            my_opinion.confidence = new_conf
            my_opinion.last_updated = self.model.steps
