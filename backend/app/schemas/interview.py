from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

InterviewQuestionCategory = Literal[
    "behavioral",
    "technical",
    "job_description",
    "projects_resume",
]


class InterviewGeneratedQuestion(BaseModel):
    category: InterviewQuestionCategory
    question_text: str = Field(min_length=10, max_length=1200)
    rationale: str = Field(default="", max_length=1000)


class InterviewPrepOutput(BaseModel):
    behavioral_questions: list[InterviewGeneratedQuestion] = Field(default_factory=list, max_length=10)
    technical_questions: list[InterviewGeneratedQuestion] = Field(default_factory=list, max_length=10)
    job_description_questions: list[InterviewGeneratedQuestion] = Field(default_factory=list, max_length=10)
    projects_resume_questions: list[InterviewGeneratedQuestion] = Field(default_factory=list, max_length=10)
    preparation_plan: list[str] = Field(default_factory=list, max_length=20)
    strong_topics: list[str] = Field(default_factory=list, max_length=20)
    weak_areas: list[str] = Field(default_factory=list, max_length=20)


class InterviewFeedbackOutput(BaseModel):
    strong_points: list[str] = Field(default_factory=list, max_length=12)
    unclear_points: list[str] = Field(default_factory=list, max_length=12)
    missing_points: list[str] = Field(default_factory=list, max_length=12)
    stronger_answer_structure: list[str] = Field(default_factory=list, max_length=10)
    improved_outline: list[str] = Field(default_factory=list, max_length=10)
    overall_feedback: str = Field(default="", max_length=1600)


class InterviewSessionCreate(BaseModel):
    application_id: str


class InterviewAnswerCreate(BaseModel):
    answer_text: str = Field(min_length=1, max_length=8000)


class InterviewAnswerResponse(BaseModel):
    id: str
    question_id: str
    answer_text: str
    feedback: InterviewFeedbackOutput
    provider: str
    created_at: datetime


class InterviewQuestionResponse(BaseModel):
    id: str
    category: InterviewQuestionCategory
    question_text: str
    rationale: str
    display_order: int
    answers: list[InterviewAnswerResponse]
    created_at: datetime


class InterviewSessionResponse(BaseModel):
    id: str
    application_id: str
    job_title: str
    company: str
    provider: str
    preparation_plan: list[str]
    strong_topics: list[str]
    weak_areas: list[str]
    questions: list[InterviewQuestionResponse]
    created_at: datetime
    updated_at: datetime


class InterviewSessionListResponse(BaseModel):
    items: list[InterviewSessionResponse]
    total: int
