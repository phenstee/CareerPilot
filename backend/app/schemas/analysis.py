from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ResumeRewriteSuggestion(BaseModel):
    original_text: str = Field(default="", max_length=1000)
    suggested_text: str = Field(default="", max_length=1000)
    rationale: str = Field(default="", max_length=1000)


class JobMatchAnalysisOutput(BaseModel):
    overall_match_score: int = Field(ge=0, le=100)
    score_explanation: str = Field(max_length=2000)
    matching_skills: list[str] = Field(default_factory=list, max_length=30)
    missing_or_weak_skills: list[str] = Field(default_factory=list, max_length=30)
    relevant_experiences_and_projects: list[str] = Field(default_factory=list, max_length=30)
    important_job_requirements: list[str] = Field(default_factory=list, max_length=30)
    recommended_preparation_priorities: list[str] = Field(default_factory=list, max_length=20)
    potential_resume_improvements: list[str] = Field(default_factory=list, max_length=20)
    portfolio_project_ideas: list[str] = Field(default_factory=list, max_length=10)
    uncertainties: list[str] = Field(default_factory=list, max_length=20)
    supported_facts: list[str] = Field(default_factory=list, max_length=30)
    suggestions_for_improvement: list[str] = Field(default_factory=list, max_length=20)
    unknowns: list[str] = Field(default_factory=list, max_length=20)


class ResumeSuggestionsOutput(BaseModel):
    keywords: list[str] = Field(default_factory=list, max_length=40)
    relevant_existing_resume_content: list[str] = Field(default_factory=list, max_length=30)
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
    analysis_type: Literal["job_match", "resume_suggestions"]
    provider: str
    match_score: int | None
    result: JobMatchAnalysisOutput | ResumeSuggestionsOutput
    created_at: datetime
    updated_at: datetime


class JobAnalysisListResponse(BaseModel):
    items: list[JobAnalysisResponse]
    total: int
