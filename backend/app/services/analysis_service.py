from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.ai.provider_factory import get_ai_provider
from app.models.analysis import JobAnalysis
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.job_repository import JobRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.analysis import (
    AnalysisCreateRequest,
    JobAnalysisListResponse,
    JobAnalysisResponse,
    ResumeSuggestionsOutput,
)


class AnalysisNotFoundError(Exception):
    pass


class AnalysisJobNotFoundError(Exception):
    pass


class AnalysisService:
    def __init__(self, db: Session) -> None:
        self.repository = AnalysisRepository(db)
        self.job_repository = JobRepository(db)
        self.profile_repository = ProfileRepository(db)
        self.resume_repository = ResumeRepository(db)

    def list_analyses(
        self,
        user_id: str,
        *,
        job_posting_id: str | None = None,
        analysis_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> JobAnalysisListResponse:
        analyses, total = self.repository.list_for_user(
            user_id,
            job_posting_id=job_posting_id,
            analysis_type=analysis_type,
            skip=skip,
            limit=limit,
        )
        return JobAnalysisListResponse(items=[serialize_analysis(analysis) for analysis in analyses], total=total)

    def get_analysis(self, user_id: str, analysis_id: str) -> JobAnalysisResponse:
        analysis = self.repository.get_for_user(user_id, analysis_id)
        if analysis is None:
            raise AnalysisNotFoundError
        return serialize_analysis(analysis)

    def create_resume_suggestions(self, user_id: str, payload: AnalysisCreateRequest) -> JobAnalysisResponse:
        job, profile, resume = self._get_owned_context(user_id, payload.job_posting_id)
        provider = get_ai_provider()
        output = provider.suggest_resume_tailoring(job=job, profile=profile, resume=resume)
        analysis = JobAnalysis(
            user_id=user_id,
            job_posting_id=job.id,
            analysis_type="resume_suggestions",
            provider=provider.name,
            result=output.model_dump(),
        )
        return serialize_analysis(self.repository.save(analysis))

    def _get_owned_context(self, user_id: str, job_posting_id: str):
        job = self.job_repository.get_for_user(user_id, job_posting_id)
        if job is None:
            raise AnalysisJobNotFoundError
        return (
            job,
            self.profile_repository.get_by_user_id(user_id),
            self.resume_repository.get_by_user_id(user_id),
        )


def serialize_analysis(analysis: JobAnalysis) -> JobAnalysisResponse:
    result = ResumeSuggestionsOutput.model_validate(analysis.result)
    return JobAnalysisResponse(
        id=analysis.id,
        job_posting_id=analysis.job_posting_id,
        job_title=analysis.job_posting.title,
        company=analysis.job_posting.company,
        analysis_type=analysis.analysis_type,
        provider=analysis.provider,
        result=result,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )
