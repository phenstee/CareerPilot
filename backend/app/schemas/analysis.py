from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

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


class ResumeSuggestionsOutput(BaseModel):
    keywords: list[str] = Field(default_factory=list, max_length=40)
    relevant_existing_resume_content: list[str] = Field(default_factory=list, max_length=30)
    suggested_additions: list[str] = Field(default_factory=list, max_length=20)
    less_important_items: list[str] = Field(default_factory=list, max_length=20)
    suggested_rewrites: list[ResumeRewriteSuggestion] = Field(default_factory=list, max_length=15)
    missing_information_questions: list[str] = Field(default_factory=list, max_length=20)
    application_checklist: list[str] = Field(default_factory=list, max_length=20)
    uncertainties: list[str] = Field(default_factory=list, max_length=20)


class ApplicationEmphasis(BaseModel):
    item: str = Field(default="", max_length=500)
    evidence: str = Field(default="", max_length=1000)
    reason: str = Field(default="", max_length=1000)


class AutofillField(BaseModel):
    field: str = Field(default="", max_length=200)
    proposed_answer: str | None = Field(default=None, max_length=1200)
    evidence: str | None = Field(default=None, max_length=1000)
    requires_confirmation: bool = True


class ApplicationDraftOutput(BaseModel):
    application_summary: str = Field(default="", max_length=1800)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    emphasis: list[ApplicationEmphasis] = Field(default_factory=list, max_length=12)
    missing_information_questions: list[str] = Field(default_factory=list, max_length=20)
    cover_letter: str = Field(default="", max_length=5000)
    autofill_preview: list[AutofillField] = Field(default_factory=list, max_length=20)
    warnings: list[str] = Field(default_factory=list, max_length=20)


class EvidenceItem(BaseModel):
    claim: str = Field(default="", max_length=700)
    evidence: str = Field(default="", max_length=1000)


class QualificationGap(BaseModel):
    requirement: str = Field(default="", max_length=700)
    current_evidence: str | None = Field(default=None, max_length=1000)
    severity: Literal["low", "medium", "high", "unknown"] = "unknown"
    recommendation: str = Field(default="", max_length=1200)


class RoleAnalysisOutput(BaseModel):
    role_summary: str = Field(default="", max_length=1800)
    responsibilities: list[str] = Field(default_factory=list, max_length=20)
    required_skills: list[str] = Field(default_factory=list, max_length=30)
    preferred_skills: list[str] = Field(default_factory=list, max_length=30)
    technologies: list[str] = Field(default_factory=list, max_length=30)
    strengths: list[EvidenceItem] = Field(default_factory=list, max_length=15)
    gaps: list[QualificationGap] = Field(default_factory=list, max_length=15)
    uncertainties: list[str] = Field(default_factory=list, max_length=20)
    preparation_priorities: list[str] = Field(default_factory=list, max_length=15)


class PreparationPlanOutput(BaseModel):
    essential_topics: list[str] = Field(default_factory=list, max_length=20)
    optional_topics: list[str] = Field(default_factory=list, max_length=20)
    technical_practice: list[str] = Field(default_factory=list, max_length=20)
    behavioral_practice: list[str] = Field(default_factory=list, max_length=20)
    research_tasks: list[str] = Field(default_factory=list, max_length=20)
    staged_plan: list[str] = Field(default_factory=list, max_length=20)
    concrete_exercises: list[str] = Field(default_factory=list, max_length=20)
    completion_checklist: list[str] = Field(default_factory=list, max_length=20)


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
