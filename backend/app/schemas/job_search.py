from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


WorkplaceType = Literal["Remote", "Hybrid", "Onsite"]
ExperienceLevel = Literal["Internship", "Entry-level", "Junior", "Mid-level", "Senior"]
DatePosted = Literal["Any time", "Past 24 hours", "Past week", "Past month"]


class JobSearchFilters(BaseModel):
    location: str = Field(default="", max_length=255)
    workplace_types: list[WorkplaceType] = Field(default_factory=list, max_length=3)
    employment_types: list[str] = Field(default_factory=list, max_length=10)
    experience_levels: list[ExperienceLevel] = Field(default_factory=list, max_length=5)
    preferred_role: str = Field(default="", max_length=255)
    date_posted: DatePosted = "Any time"

    @field_validator("location", "preferred_role")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("employment_types")
    @classmethod
    def clean_employment_types(cls, values: list[str]) -> list[str]:
        return [value.strip() for value in values if value.strip()]


class ProfileJobSearchRequest(JobSearchFilters):
    pass


class PromptJobSearchRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=2000)
    use_profile_context: bool = True

    @field_validator("prompt")
    @classmethod
    def clean_prompt(cls, value: str) -> str:
        return value.strip()


class NormalizedJobResult(BaseModel):
    external_id: str
    title: str
    company: str
    location: str
    workplace_type: WorkplaceType
    employment_type: str
    experience_level: str
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "USD"
    source: str
    source_url: str
    posted_at: datetime | None = None
    discovered_at: datetime
    short_description: str
    description: str
    requirements: list[str]
    skills: list[str]
    fit_label: Literal["Strong fit", "Possible fit", "Stretch opportunity"] = "Possible fit"
    profile_evidence: list[str]
    qualification_gaps: list[str]
    is_mock: bool = False


class JobSearchResponse(BaseModel):
    mode: Literal["profile", "prompt"]
    filters: JobSearchFilters
    strategy: str
    results: list[NormalizedJobResult]
    warnings: list[str] = Field(default_factory=list)
    provider_failures: list[str] = Field(default_factory=list)
    profile_incomplete: bool = False


class SaveDiscoveredJobRequest(BaseModel):
    result: NormalizedJobResult


class SaveDiscoveredJobResponse(BaseModel):
    id: str
    already_saved: bool = False
