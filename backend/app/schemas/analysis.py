from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class AnalysisCreateRequest(BaseModel):
    job_posting_id: str


class JobAnalysisResponse(BaseModel):
    id: str
    job_posting_id: str
    job_title: str
    company: str
    analysis_type: Literal["resume_suggestions"]
    provider: str
    result: ResumeSuggestionsOutput
    created_at: datetime
    updated_at: datetime


class JobAnalysisListResponse(BaseModel):
    items: list[JobAnalysisResponse]
    total: int
