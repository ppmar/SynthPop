"""Pydantic data models for personas and related types."""

from pydantic import BaseModel, Field


class Persona(BaseModel):
    """A synthetic person with demographic and psychological attributes."""

    id: str
    name: str
    age: int = Field(ge=18, le=100)
    gender: str
    occupation: str
    education: str = Field(
        description="Education level: bac, licence, master, doctorat, autodidacte"
    )
    location_type: str = Field(description="urban, suburban, or rural")
    country: str = "France"
    income_bracket: str = Field(
        description="Income bracket: low, middle, upper-middle, high"
    )
    personality_traits: list[str] = Field(
        description='Big Five shorthand, e.g. ["openness:high", "conscientiousness:low"]'
    )
    values: list[str] = Field(
        description='e.g. ["tradition", "innovation", "security", "freedom"]'
    )
    political_leaning: float = Field(
        ge=-1.0, le=1.0, description="-1.0 (far left) to 1.0 (far right)"
    )
    tech_savviness: float = Field(ge=0.0, le=1.0)
    risk_tolerance: float = Field(ge=0.0, le=1.0)
    influenceability: float = Field(
        ge=0.0, le=1.0, description="How much neighbors affect this agent"
    )
    backstory: str = Field(description="2-3 sentence LLM-generated backstory")


class DemographicSkeleton(BaseModel):
    """Raw demographic attributes before LLM enrichment."""

    id: str
    age: int
    gender: str
    education: str
    location_type: str
    country: str = "France"
    income_bracket: str


class PersonaGenerationResult(BaseModel):
    """Result from generating a batch of personas."""

    personas: list[Persona]
    total_cost_usd: float
    tokens_used: int
