from abc import ABC, abstractmethod

from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application
from app.schemas.analysis import ApplicationDraftOutput, PreparationPlanOutput, ResumeSuggestionsOutput, RoleAnalysisOutput
from app.schemas.interview import InterviewFeedbackOutput, InterviewPrepOutput


class AIProviderError(Exception):
    pass


class BaseAIProvider(ABC):
    name: str
    model_name: str | None = None

    @abstractmethod
    def generate_application_draft(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        application: Application | None,
    ) -> ApplicationDraftOutput:
        pass

    @abstractmethod
    def analyze_role(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> RoleAnalysisOutput:
        pass

    @abstractmethod
    def create_preparation_plan(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        role_analysis: RoleAnalysisOutput,
        application: Application | None,
    ) -> PreparationPlanOutput:
        pass

    @abstractmethod
    def suggest_resume_tailoring(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> ResumeSuggestionsOutput:
        pass

    @abstractmethod
    def generate_interview_prep(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> InterviewPrepOutput:
        pass

    @abstractmethod
    def evaluate_interview_answer(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        question: str,
        answer: str,
    ) -> InterviewFeedbackOutput:
        pass
