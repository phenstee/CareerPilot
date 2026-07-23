from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


def _clean_list(values: list[str]) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for value in values:
        item = value.strip()
        key = item.lower()
        if item and key not in seen:
            cleaned.append(item)
            seen.add(key)
    return cleaned


class SkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: Literal["technical", "soft"]

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()


class ProjectInput(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    technologies: list[str] = Field(default_factory=list, max_length=30)
    link: str | None = Field(default=None, max_length=500)
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("name", "description")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("technologies")
    @classmethod
    def clean_technologies(cls, values: list[str]) -> list[str]:
        return _clean_list(values)

    @field_validator("link")
    @classmethod
    def clean_link(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectInput":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("Project end date cannot be before start date.")
        return self


class ExperienceInput(BaseModel):
    organization: str = Field(min_length=1, max_length=255)
    position: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("organization", "position", "description")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_dates(self) -> "ExperienceInput":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("Experience end date cannot be before start date.")
        return self


class ProfileUpsertRequest(BaseModel):
    full_name: str = Field(default="", max_length=255)
    school: str = Field(default="", max_length=255)
    program: str = Field(default="", max_length=255)
    graduation_year: int | None = Field(default=None, ge=1900, le=2100)
    target_roles: list[str] = Field(default_factory=list, max_length=20)
    preferred_locations: list[str] = Field(default_factory=list, max_length=20)
    technical_skills: list[str] = Field(default_factory=list, max_length=80)
    soft_skills: list[str] = Field(default_factory=list, max_length=40)
    coursework: list[str] = Field(default_factory=list, max_length=40)
    career_goals: str = Field(default="", max_length=4000)
    projects: list[ProjectInput] = Field(default_factory=list, max_length=20)
    experiences: list[ExperienceInput] = Field(default_factory=list, max_length=20)

    @field_validator("full_name", "school", "program", "career_goals")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator(
        "target_roles",
        "preferred_locations",
        "technical_skills",
        "soft_skills",
        "coursework",
    )
    @classmethod
    def clean_lists(cls, values: list[str]) -> list[str]:
        return _clean_list(values)


class SkillResponse(BaseModel):
    id: str
    name: str
    category: str

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    technologies: list[str]
    link: str | None
    start_date: date | None
    end_date: date | None

    model_config = {"from_attributes": True}


class ExperienceResponse(BaseModel):
    id: str
    organization: str
    position: str
    description: str
    start_date: date | None
    end_date: date | None

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: str | None
    full_name: str
    school: str
    program: str
    graduation_year: int | None
    target_roles: list[str]
    preferred_locations: list[str]
    technical_skills: list[str]
    soft_skills: list[str]
    coursework: list[str]
    career_goals: str
    projects: list[ProjectResponse]
    experiences: list[ExperienceResponse]
    created_at: datetime | None = None
    updated_at: datetime | None = None
