from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.ai.provider_factory import get_ai_provider
from app.models.analysis import JobAnalysis
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.analysis import (
    AnalysisCreateRequest,
    ApplicationDraftOutput,
    JobAnalysisListResponse,
    JobAnalysisResponse,
    PreparationPlanOutput,
    ResumeSuggestionsOutput,
    RoleAnalysisOutput,
)
from app.services.analysis_fingerprint import analysis_fingerprint


class AnalysisNotFoundError(Exception):
    pass


class AnalysisJobNotFoundError(Exception):
    pass


class AnalysisService:
    def __init__(self, db: Session) -> None:
        self.repository = AnalysisRepository(db)
        self.application_repository = ApplicationRepository(db)
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
        return JobAnalysisListResponse(items=[self._serialize_with_stale_status(analysis) for analysis in analyses], total=total)

    def get_analysis(self, user_id: str, analysis_id: str) -> JobAnalysisResponse:
        analysis = self.repository.get_for_user(user_id, analysis_id)
        if analysis is None:
            raise AnalysisNotFoundError
        return self._serialize_with_stale_status(analysis)

    def create_resume_suggestions(self, user_id: str, payload: AnalysisCreateRequest) -> JobAnalysisResponse:
        job, profile, resume = self._get_owned_context(user_id, payload.job_posting_id)
        provider = get_ai_provider()
        output = provider.suggest_resume_tailoring(job=job, profile=profile, resume=resume)
        fingerprint = analysis_fingerprint(
            analysis_type="resume_suggestions",
            job=job,
            profile=profile,
            resume=resume,
        )
        analysis = JobAnalysis(
            user_id=user_id,
            job_posting_id=job.id,
            analysis_type="resume_suggestions",
            provider=provider.name,
            provider_model=provider.model_name,
            source_fingerprint=fingerprint,
            result=output.model_dump(),
        )
        return self._serialize_with_stale_status(self.repository.save(analysis))

    def _get_owned_context(self, user_id: str, job_posting_id: str):
        job = self.job_repository.get_for_user(user_id, job_posting_id)
        if job is None:
            raise AnalysisJobNotFoundError
        return (
            job,
            self.profile_repository.get_by_user_id(user_id),
            self.resume_repository.get_by_user_id(user_id),
        )

    def _serialize_with_stale_status(self, analysis: JobAnalysis) -> JobAnalysisResponse:
        return serialize_analysis(analysis, is_stale=self.is_analysis_stale(analysis))

    def is_analysis_stale(self, analysis: JobAnalysis) -> bool:
        if not analysis.source_fingerprint:
            return True

        job, profile, resume = self._get_owned_context(analysis.user_id, analysis.job_posting_id)
        application = self.application_repository.get_by_job_for_user(analysis.user_id, analysis.job_posting_id)
        role_analysis_result: dict[str, object] | None = None
        if analysis.analysis_type == "preparation_plan":
            latest_role_analysis = self.repository.get_latest_for_user(
                analysis.user_id,
                job_posting_id=analysis.job_posting_id,
                analysis_type="role_analysis",
            )
            if latest_role_analysis is None or latest_role_analysis.id != analysis.source_role_analysis_id:
                return True
            role_analysis_result = latest_role_analysis.result

        current_fingerprint = analysis_fingerprint(
            analysis_type=analysis.analysis_type,
            job=job,
            profile=profile,
            resume=resume,
            application=application if analysis.analysis_type in {"application_draft", "preparation_plan"} else None,
            role_analysis_id=analysis.source_role_analysis_id,
            role_analysis_result=role_analysis_result,
        )
        return current_fingerprint != analysis.source_fingerprint


def serialize_analysis(analysis: JobAnalysis, *, is_stale: bool = False) -> JobAnalysisResponse:
    result_types = {
        "resume_suggestions": ResumeSuggestionsOutput,
        "application_draft": ApplicationDraftOutput,
        "role_analysis": RoleAnalysisOutput,
        "preparation_plan": PreparationPlanOutput,
    }
    result_type = result_types[analysis.analysis_type]
    result = result_type.model_validate(analysis.result)
    return JobAnalysisResponse(
        id=analysis.id,
        job_posting_id=analysis.job_posting_id,
        job_title=analysis.job_posting.title,
        company=analysis.job_posting.company,
        analysis_type=analysis.analysis_type,
        provider=analysis.provider,
        provider_model=analysis.provider_model,
        is_stale=is_stale,
        source_role_analysis_id=analysis.source_role_analysis_id,
        result=result,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
    )
