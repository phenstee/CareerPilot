from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

AnalysisType = Literal[
    "resume_suggestions",
    "application_draft",
    "role_analysis",
    "preparation_plan",
]


class ResumeRewriteSuggestion(BaseModel):
    original_text: str = Field(default="", max_length=1000)
    suggested_text: str = Field(default="", max_length=1000)
    rationale: str = Field(default="", max_length=1000)

    @field_validator("original_text", "suggested_text", "rationale", mode="before")
    @classmethod
    def trim_text(cls, value: object) -> object:
        return _trim_text(value, 1000)


class ResumeSuggestionsOutput(BaseModel):
    keywords: list[str] = Field(default_factory=list, max_length=12)
    relevant_existing_resume_content: list[str] = Field(default_factory=list, max_length=8)
    suggested_additions: list[str] = Field(default_factory=list, max_length=6)
    less_important_items: list[str] = Field(default_factory=list, max_length=6)
    suggested_rewrites: list[ResumeRewriteSuggestion] = Field(default_factory=list, max_length=5)
    missing_information_questions: list[str] = Field(default_factory=list, max_length=5)
    application_checklist: list[str] = Field(default_factory=list, max_length=6)
    uncertainties: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("keywords", mode="before")
    @classmethod
    def trim_keywords(cls, value: object) -> object:
        return _trim_list(value, 12)

    @field_validator("relevant_existing_resume_content", mode="before")
    @classmethod
    def trim_relevant_existing_resume_content(cls, value: object) -> object:
        return _trim_list(value, 8)

    @field_validator("suggested_additions", "less_important_items", "application_checklist", mode="before")
    @classmethod
    def trim_six_item_lists(cls, value: object) -> object:
        return _trim_list(value, 6)

    @field_validator(
        "suggested_rewrites",
        "missing_information_questions",
        "uncertainties",
        mode="before",
    )
    @classmethod
    def trim_five_item_lists(cls, value: object) -> object:
        return _trim_list(value, 5)


class ApplicationEmphasis(BaseModel):
    item: str = Field(default="", max_length=500)
    evidence: str = Field(default="", max_length=1000)
    reason: str = Field(default="", max_length=1000)

    @field_validator("item", mode="before")
    @classmethod
    def trim_item(cls, value: object) -> object:
        return _trim_text(value, 500)

    @field_validator("evidence", "reason", mode="before")
    @classmethod
    def trim_evidence_fields(cls, value: object) -> object:
        return _trim_text(value, 1000)


class AutofillField(BaseModel):
    field: str = Field(default="", max_length=200)
    proposed_answer: str | None = Field(default=None, max_length=1200)
    evidence: str | None = Field(default=None, max_length=1000)
    requires_confirmation: bool = True

    @field_validator("field", mode="before")
    @classmethod
    def trim_field(cls, value: object) -> object:
        return _trim_text(value, 200)

    @field_validator("proposed_answer", mode="before")
    @classmethod
    def trim_proposed_answer(cls, value: object) -> object:
        return _trim_text(value, 1200)

    @field_validator("evidence", mode="before")
    @classmethod
    def trim_evidence(cls, value: object) -> object:
        return _trim_text(value, 1000)


class ApplicationDraftOutput(BaseModel):
    application_summary: str = Field(default="", max_length=700)
    keywords: list[str] = Field(default_factory=list, max_length=10)
    emphasis: list[ApplicationEmphasis] = Field(default_factory=list, max_length=5)
    missing_information_questions: list[str] = Field(default_factory=list, max_length=6)
    cover_letter: str = Field(default="", max_length=2600)
    autofill_preview: list[AutofillField] = Field(default_factory=list, max_length=8)
    warnings: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("application_summary", mode="before")
    @classmethod
    def trim_application_summary(cls, value: object) -> object:
        return _trim_text(value, 700)

    @field_validator("cover_letter", mode="before")
    @classmethod
    def trim_cover_letter(cls, value: object) -> object:
        return _trim_text(value, 2600)

    @field_validator("keywords", mode="before")
    @classmethod
    def trim_application_keywords(cls, value: object) -> object:
        return _trim_list(value, 10)

    @field_validator("emphasis", "warnings", mode="before")
    @classmethod
    def trim_five_application_items(cls, value: object) -> object:
        return _trim_list(value, 5)

    @field_validator("missing_information_questions", mode="before")
    @classmethod
    def trim_six_application_items(cls, value: object) -> object:
        return _trim_list(value, 6)

    @field_validator("autofill_preview", mode="before")
    @classmethod
    def trim_autofill_preview(cls, value: object) -> object:
        return _trim_list(value, 8)


class EvidenceItem(BaseModel):
    claim: str = Field(default="", max_length=700)
    evidence: str = Field(default="", max_length=1000)

    @field_validator("claim", mode="before")
    @classmethod
    def trim_claim(cls, value: object) -> object:
        return _trim_text(value, 700)

    @field_validator("evidence", mode="before")
    @classmethod
    def trim_evidence(cls, value: object) -> object:
        return _trim_text(value, 1000)


class QualificationGap(BaseModel):
    requirement: str = Field(default="", max_length=700)
    current_evidence: str | None = Field(default=None, max_length=1000)
    severity: Literal["low", "medium", "high", "unknown"] = "unknown"
    recommendation: str = Field(default="", max_length=1200)

    @field_validator("requirement", mode="before")
    @classmethod
    def trim_requirement(cls, value: object) -> object:
        return _trim_text(value, 700)

    @field_validator("current_evidence", mode="before")
    @classmethod
    def trim_current_evidence(cls, value: object) -> object:
        return _trim_text(value, 1000)

    @field_validator("recommendation", mode="before")
    @classmethod
    def trim_recommendation(cls, value: object) -> object:
        return _trim_text(value, 1200)


class RoleAnalysisOutput(BaseModel):
    role_summary: str = Field(default="", max_length=700)
    responsibilities: list[str] = Field(default_factory=list, max_length=6)
    required_skills: list[str] = Field(default_factory=list, max_length=12)
    preferred_skills: list[str] = Field(default_factory=list, max_length=8)
    technologies: list[str] = Field(default_factory=list, max_length=12)
    strengths: list[EvidenceItem] = Field(default_factory=list, max_length=6)
    gaps: list[QualificationGap] = Field(default_factory=list, max_length=6)
    uncertainties: list[str] = Field(default_factory=list, max_length=5)
    preparation_priorities: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("role_summary", mode="before")
    @classmethod
    def trim_role_summary(cls, value: object) -> object:
        return _trim_text(value, 700)

    @field_validator("responsibilities", "gaps", "strengths", mode="before")
    @classmethod
    def trim_six_role_items(cls, value: object) -> object:
        return _trim_list(value, 6)

    @field_validator("required_skills", "technologies", mode="before")
    @classmethod
    def trim_twelve_role_items(cls, value: object) -> object:
        return _trim_list(value, 12)

    @field_validator("preferred_skills", mode="before")
    @classmethod
    def trim_preferred_skills(cls, value: object) -> object:
        return _trim_list(value, 8)

    @field_validator("uncertainties", "preparation_priorities", mode="before")
    @classmethod
    def trim_five_role_items(cls, value: object) -> object:
        return _trim_list(value, 5)


class PreparationPlanOutput(BaseModel):
    essential_topics: list[str] = Field(default_factory=list, max_length=6)
    optional_topics: list[str] = Field(default_factory=list, max_length=5)
    technical_practice: list[str] = Field(default_factory=list, max_length=6)
    behavioral_practice: list[str] = Field(default_factory=list, max_length=5)
    research_tasks: list[str] = Field(default_factory=list, max_length=5)
    staged_plan: list[str] = Field(default_factory=list, max_length=5)
    concrete_exercises: list[str] = Field(default_factory=list, max_length=5)
    completion_checklist: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("essential_topics", "technical_practice", "completion_checklist", mode="before")
    @classmethod
    def trim_six_plan_items(cls, value: object) -> object:
        return _trim_list(value, 6)

    @field_validator(
        "optional_topics",
        "behavioral_practice",
        "research_tasks",
        "staged_plan",
        "concrete_exercises",
        mode="before",
    )
    @classmethod
    def trim_five_plan_items(cls, value: object) -> object:
        return _trim_list(value, 5)


class AnalysisCreateRequest(BaseModel):
    job_posting_id: str


class PreparationPlanCreateRequest(AnalysisCreateRequest):
    role_analysis_id: str | None = None


AnalysisResult = ResumeSuggestionsOutput | ApplicationDraftOutput | RoleAnalysisOutput | PreparationPlanOutput


class JobAnalysisResponse(BaseModel):
    id: str
    job_posting_id: str
    job_title: str
    company: str
    analysis_type: AnalysisType
    provider: str
    provider_model: str | None = None
    is_stale: bool = False
    source_role_analysis_id: str | None = None
    result: AnalysisResult
    created_at: datetime
    updated_at: datetime


class JobAnalysisListResponse(BaseModel):
    items: list[JobAnalysisResponse]
    total: int


def _trim_list(value: object, max_items: int) -> object:
    if isinstance(value, list):
        return value[:max_items]
    return value


def _trim_text(value: object, max_length: int) -> object:
    if isinstance(value, str):
        return value[:max_length]
    return value
