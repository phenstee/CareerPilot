from abc import ABC, abstractmethod

from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.schemas.analysis import JobMatchAnalysisOutput, ResumeSuggestionsOutput


class AIProviderError(Exception):
    pass


class BaseAIProvider(ABC):
    name: str

    @abstractmethod
    def analyze_job_match(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> JobMatchAnalysisOutput:
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
