from abc import ABC, abstractmethod

from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application
from app.schemas.analysis import ResumeSuggestionsOutput
from app.schemas.interview import InterviewFeedbackOutput, InterviewPrepOutput


class AIProviderError(Exception):
    pass


class BaseAIProvider(ABC):
    name: str

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
