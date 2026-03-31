"""LLM opinion verbalization from agent state."""

import numpy as np
import structlog
from pydantic import BaseModel, Field
from sklearn.cluster import KMeans

from synthpop.api.client import AnthropicClient, MODEL_GENERATION
from synthpop.config import VerbalizationConfig
from synthpop.personas.models import Persona
from synthpop.simulation.opinion import OpinionState

logger = structlog.get_logger()

VERBALIZATION_SYSTEM = """\
You are embodying a persona in a population simulation.
Express your opinion authentically, in first person.
Be natural, specific, and true to the persona's background.
2-4 sentences only. No meta-commentary."""

VERBALIZATION_TEMPLATE = """\
You are {name}, {age} ans, {occupation}.
Backstory: {backstory}

Your position on "{topic}" is {position:.2f} (scale -1 strongly against to +1 strongly for).
Your confidence is {confidence:.2f} (scale 0 to 1).

Express your opinion naturally, in 2-4 sentences.
Speak in first person. Be authentic to your persona."""

POLL_SYSTEM = """\
You are embodying a persona in a population survey.
Answer the question authentically, in first person.
Be natural, specific, and true to the persona's background.
Respond in 2-4 sentences.

After your response, on a new line, output your stance in this exact format:
STANCE: for|against|neutral
CONFIDENCE: 0.0-1.0"""

POLL_TEMPLATE = """\
You are {name}, {age} ans, {occupation}.
Backstory: {backstory}

Question: "{question}"

Answer as this persona. After your answer, indicate your stance."""


class VerbalizedOpinion(BaseModel):
    """A single verbalized opinion from an agent."""

    persona_id: str
    persona_name: str
    position: float
    confidence: float
    text: str
    cluster: int = -1


class ClusterSummary(BaseModel):
    """Summary of one opinion cluster."""

    cluster_id: int
    label: str
    mean_position: float
    agent_count: int
    percentage: float
    representative_quotes: list[VerbalizedOpinion]


class PollResult(BaseModel):
    """Aggregated results from a poll or verbalization."""

    question: str
    total_agents: int
    for_pct: float = 0.0
    against_pct: float = 0.0
    neutral_pct: float = 0.0
    mean_position: float = 0.0
    mean_confidence: float = 0.0
    clusters: list[ClusterSummary] = Field(default_factory=list)
    all_opinions: list[VerbalizedOpinion] = Field(default_factory=list)

    def summary(self) -> str:
        """Return a human-readable summary."""
        lines = [
            f"Question: {self.question}",
            f"Population: {self.total_agents} agents",
            f"For: {self.for_pct:.1f}% | Against: {self.against_pct:.1f}% | Neutral: {self.neutral_pct:.1f}%",
            f"Mean position: {self.mean_position:.2f} | Mean confidence: {self.mean_confidence:.2f}",
            "",
        ]
        for cluster in self.clusters:
            lines.append(f"--- {cluster.label} ({cluster.percentage:.1f}%) ---")
            for quote in cluster.representative_quotes:
                lines.append(f'  [{quote.persona_name}]: "{quote.text}"')
            lines.append("")
        return "\n".join(lines)


def _cluster_opinions(
    opinions: list[dict],
    n_clusters: int = 4,
) -> dict[int, list[dict]]:
    """Cluster agents by opinion position using KMeans.

    Args:
        opinions: List of dicts with 'opinion' key containing position.
        n_clusters: Target number of clusters.

    Returns:
        Mapping of cluster_id to list of opinion dicts.
    """
    if len(opinions) <= n_clusters:
        return {i: [o] for i, o in enumerate(opinions)}

    positions = np.array([o["opinion"]["position"] for o in opinions]).reshape(-1, 1)
    n_clusters = min(n_clusters, len(opinions))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(positions)

    clusters: dict[int, list[dict]] = {}
    for label, opinion in zip(labels, opinions):
        clusters.setdefault(int(label), []).append(opinion)

    return clusters


def _label_cluster(mean_position: float) -> str:
    """Generate a human-readable label for a cluster based on mean position."""
    if mean_position > 0.3:
        return "Strongly for"
    elif mean_position > 0.1:
        return "Leaning for"
    elif mean_position > -0.1:
        return "Neutral / Mixed"
    elif mean_position > -0.3:
        return "Leaning against"
    else:
        return "Strongly against"


async def verbalize_opinions(
    opinions: list[dict],
    topic: str,
    client: AnthropicClient,
    config: VerbalizationConfig | None = None,
) -> PollResult:
    """Verbalize opinions for a set of agents post-simulation.

    Args:
        opinions: List of dicts with 'persona' and 'opinion' keys.
        topic: The opinion topic.
        client: Anthropic API client.
        config: Verbalization parameters.

    Returns:
        PollResult with clusters and representative quotes.
    """
    if config is None:
        config = VerbalizationConfig()

    clusters = _cluster_opinions(opinions, config.clusters)
    all_verbalized: list[VerbalizedOpinion] = []

    for cluster_id, cluster_opinions in clusters.items():
        # Sample representatives
        rng = np.random.default_rng(42)
        sample_size = min(config.samples_per_cluster, len(cluster_opinions))
        indices = rng.choice(len(cluster_opinions), size=sample_size, replace=False)
        samples = [cluster_opinions[i] for i in indices]

        prompts = []
        for s in samples:
            p = s["persona"]
            o = s["opinion"]
            prompts.append(
                VERBALIZATION_TEMPLATE.format(
                    name=p["name"],
                    age=p["age"],
                    occupation=p["occupation"],
                    backstory=p["backstory"],
                    topic=topic,
                    position=o["position"],
                    confidence=o["confidence"],
                )
            )

        responses = await client.complete_batch(
            prompts=prompts,
            model=config.model,
            system=VERBALIZATION_SYSTEM,
            max_tokens=config.max_tokens,
            batch_size=5,
        )

        for s, text in zip(samples, responses):
            all_verbalized.append(
                VerbalizedOpinion(
                    persona_id=s["persona"]["id"],
                    persona_name=s["persona"]["name"],
                    position=s["opinion"]["position"],
                    confidence=s["opinion"]["confidence"],
                    text=text.strip(),
                    cluster=cluster_id,
                )
            )

    # Build cluster summaries
    positions = [o["opinion"]["position"] for o in opinions]
    confidences = [o["opinion"]["confidence"] for o in opinions]
    total = len(opinions)

    cluster_summaries = []
    for cluster_id, cluster_opinions in clusters.items():
        c_positions = [o["opinion"]["position"] for o in cluster_opinions]
        mean_pos = float(np.mean(c_positions))
        cluster_summaries.append(
            ClusterSummary(
                cluster_id=cluster_id,
                label=_label_cluster(mean_pos),
                mean_position=mean_pos,
                agent_count=len(cluster_opinions),
                percentage=len(cluster_opinions) / total * 100,
                representative_quotes=[
                    v for v in all_verbalized if v.cluster == cluster_id
                ],
            )
        )

    for_count = sum(1 for p in positions if p > 0.1)
    against_count = sum(1 for p in positions if p < -0.1)
    neutral_count = total - for_count - against_count

    return PollResult(
        question=topic,
        total_agents=total,
        for_pct=for_count / total * 100 if total else 0,
        against_pct=against_count / total * 100 if total else 0,
        neutral_pct=neutral_count / total * 100 if total else 0,
        mean_position=float(np.mean(positions)) if positions else 0,
        mean_confidence=float(np.mean(confidences)) if confidences else 0,
        clusters=sorted(cluster_summaries, key=lambda c: c.mean_position),
        all_opinions=all_verbalized,
    )


def _parse_poll_stance(text: str) -> tuple[str, float, float]:
    """Parse stance and confidence from poll response text.

    Returns:
        Tuple of (clean_text, position, confidence).
    """
    lines = text.strip().split("\n")
    clean_lines = []
    position = 0.0
    confidence = 0.5

    for line in lines:
        stripped = line.strip().upper()
        if stripped.startswith("STANCE:"):
            stance = stripped.split(":", 1)[1].strip().lower()
            if "for" in stance:
                position = 0.6
            elif "against" in stance:
                position = -0.6
            else:
                position = 0.0
        elif stripped.startswith("CONFIDENCE:"):
            try:
                confidence = float(stripped.split(":", 1)[1].strip())
                confidence = max(0.0, min(1.0, confidence))
            except ValueError:
                pass
        else:
            clean_lines.append(line)

    return "\n".join(clean_lines).strip(), position, confidence


async def poll_population(
    population: list[Persona],
    question: str,
    client: AnthropicClient,
    model: str | None = None,
    sample: int | None = None,
) -> PollResult:
    """Quick poll: ask a question to the population without simulation.

    Args:
        population: List of personas to poll.
        question: The question to ask.
        client: Anthropic API client.
        model: Model override for responses.
        sample: Max number of agents to poll (samples randomly if set).

    Returns:
        PollResult with all verbalized opinions.
    """
    model = model or MODEL_GENERATION
    agents = list(population)

    if sample and sample < len(agents):
        rng = np.random.default_rng(42)
        indices = rng.choice(len(agents), size=sample, replace=False)
        agents = [agents[i] for i in indices]

    prompts = [
        POLL_TEMPLATE.format(
            name=p.name,
            age=p.age,
            occupation=p.occupation,
            backstory=p.backstory,
            question=question,
        )
        for p in agents
    ]

    logger.info("polling_population", agents=len(agents), question=question)

    responses = await client.complete_batch(
        prompts=prompts,
        model=model,
        system=POLL_SYSTEM,
        max_tokens=300,
        batch_size=10,
    )

    # Parse responses into opinions
    opinions = []
    all_verbalized = []
    for persona, raw_text in zip(agents, responses):
        clean_text, position, confidence = _parse_poll_stance(raw_text)
        opinions.append({
            "persona": persona.model_dump(),
            "opinion": {
                "topic": question,
                "position": position,
                "confidence": confidence,
                "reasoning_tags": [],
                "last_updated": 0,
            },
        })
        all_verbalized.append(
            VerbalizedOpinion(
                persona_id=persona.id,
                persona_name=persona.name,
                position=position,
                confidence=confidence,
                text=clean_text,
            )
        )

    # Cluster and build result
    positions = [o["opinion"]["position"] for o in opinions]
    total = len(opinions)
    for_count = sum(1 for p in positions if p > 0.1)
    against_count = sum(1 for p in positions if p < -0.1)
    neutral_count = total - for_count - against_count

    # Assign clusters
    clusters = _cluster_opinions(opinions, n_clusters=min(4, max(2, total // 10)))
    cluster_summaries = []
    for cluster_id, cluster_ops in clusters.items():
        c_positions = [o["opinion"]["position"] for o in cluster_ops]
        mean_pos = float(np.mean(c_positions))
        quotes = [v for v in all_verbalized if v.persona_id in {o["persona"]["id"] for o in cluster_ops}]
        # Limit quotes per cluster
        for q in quotes[:2]:
            q.cluster = cluster_id
        cluster_summaries.append(
            ClusterSummary(
                cluster_id=cluster_id,
                label=_label_cluster(mean_pos),
                mean_position=mean_pos,
                agent_count=len(cluster_ops),
                percentage=len(cluster_ops) / total * 100,
                representative_quotes=quotes[:2],
            )
        )

    return PollResult(
        question=question,
        total_agents=total,
        for_pct=for_count / total * 100 if total else 0,
        against_pct=against_count / total * 100 if total else 0,
        neutral_pct=neutral_count / total * 100 if total else 0,
        mean_position=float(np.mean(positions)) if positions else 0,
        mean_confidence=float(np.mean([o["opinion"]["confidence"] for o in opinions])) if opinions else 0,
        clusters=sorted(cluster_summaries, key=lambda c: c.mean_position),
        all_opinions=all_verbalized,
    )
