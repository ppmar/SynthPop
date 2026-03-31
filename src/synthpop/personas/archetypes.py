"""Predefined archetype distributions for persona generation."""

from pathlib import Path

import yaml

DEFAULT_TEMPLATES_PATH = Path(__file__).parent.parent.parent.parent / "config" / "personas" / "templates.yaml"


def load_archetypes(path: str | Path | None = None) -> list[dict]:
    """Load persona archetype templates from YAML.

    Args:
        path: Path to templates YAML. Uses default if None.

    Returns:
        List of archetype dicts.
    """
    path = Path(path) if path else DEFAULT_TEMPLATES_PATH
    if not path.exists():
        return []

    with open(path) as f:
        data = yaml.safe_load(f)

    return data.get("archetypes", [])
