from sqlalchemy.orm import Session

from app.ai.provider_factory import get_ai_provider
from app.models.analysis import JobAnalysis
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.analysis import AnalysisCreateRequest, JobAnalysisResponse, PreparationPlanCreateRequest, RoleAnalysisOutput
from app.services.analysis_fingerprint import analysis_fingerprint
from app.services.analysis_service import AnalysisService, serialize_analysis


class AgentJobNotFoundError(Exception):
    pass


class AgentRoleAnalysisNotFoundError(Exception):
    pass


class StaleRoleAnalysisError(Exception):
    pass


class AgentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.analysis_repository = AnalysisRepository(db)
        self.application_repository = ApplicationRepository(db)
        self.job_repository = JobRepository(db)
        self.profile_repository = ProfileRepository(db)
        self.resume_repository = ResumeRepository(db)

    def create_application_draft(self, user_id: str, payload: AnalysisCreateRequest) -> JobAnalysisResponse:
        job, profile, resume, application = self._get_owned_context(user_id, payload.job_posting_id)
        provider = get_ai_provider()
        output = provider.generate_application_draft(
            job=job,
            profile=profile,
            resume=resume,
            application=application,
        )
        fingerprint = analysis_fingerprint(
            analysis_type="application_draft",
            job=job,
            profile=profile,
            resume=resume,
            application=application,
        )
        return self._save_analysis(
            user_id=user_id,
            job_posting_id=job.id,
            analysis_type="application_draft",
            provider=provider.name,
            provider_model=provider.model_name,
            source_fingerprint=fingerprint,
            result=output.model_dump(),
        )

    def create_role_analysis(self, user_id: str, payload: AnalysisCreateRequest) -> JobAnalysisResponse:
        job, profile, resume, _application = self._get_owned_context(user_id, payload.job_posting_id)
        provider = get_ai_provider()
        output = provider.analyze_role(job=job, profile=profile, resume=resume)
        fingerprint = analysis_fingerprint(
            analysis_type="role_analysis",
            job=job,
            profile=profile,
            resume=resume,
        )
        return self._save_analysis(
            user_id=user_id,
            job_posting_id=job.id,
            analysis_type="role_analysis",
            provider=provider.name,
            provider_model=provider.model_name,
            source_fingerprint=fingerprint,
            result=output.model_dump(),
        )

    def create_preparation_plan(self, user_id: str, payload: PreparationPlanCreateRequest) -> JobAnalysisResponse:
        job, profile, resume, application = self._get_owned_context(user_id, payload.job_posting_id)
        role_analysis = self._get_role_analysis(user_id, job.id, payload.role_analysis_id)
        if AnalysisService(self.db).is_analysis_stale(role_analysis):
            raise StaleRoleAnalysisError
        role_analysis_output = RoleAnalysisOutput.model_validate(role_analysis.result)
        provider = get_ai_provider()
        output = provider.create_preparation_plan(
            job=job,
            profile=profile,
            resume=resume,
            role_analysis=role_analysis_output,
            application=application,
        )
        fingerprint = analysis_fingerprint(
            analysis_type="preparation_plan",
            job=job,
            profile=profile,
            resume=resume,
            application=application,
            role_analysis_id=role_analysis.id,
            role_analysis_result=role_analysis.result,
        )
        return self._save_analysis(
            user_id=user_id,
            job_posting_id=job.id,
            analysis_type="preparation_plan",
            provider=provider.name,
            provider_model=provider.model_name,
            source_fingerprint=fingerprint,
            source_role_analysis_id=role_analysis.id,
            result=output.model_dump(),
        )

    def _get_owned_context(self, user_id: str, job_posting_id: str):
        job = self.job_repository.get_for_user(user_id, job_posting_id)
        if job is None:
            raise AgentJobNotFoundError
        return (
            job,
            self.profile_repository.get_by_user_id(user_id),
            self.resume_repository.get_by_user_id(user_id),
            self.application_repository.get_by_job_for_user(user_id, job.id),
        )

    def _get_role_analysis(self, user_id: str, job_posting_id: str, role_analysis_id: str | None) -> JobAnalysis:
        if role_analysis_id:
            analysis = self.analysis_repository.get_for_user(user_id, role_analysis_id)
        else:
            analysis = self.analysis_repository.get_latest_for_user(
                user_id,
                job_posting_id=job_posting_id,
                analysis_type="role_analysis",
            )

        if analysis is None or analysis.job_posting_id != job_posting_id or analysis.analysis_type != "role_analysis":
            raise AgentRoleAnalysisNotFoundError
        return analysis

    def _save_analysis(
        self,
        *,
        user_id: str,
        job_posting_id: str,
        analysis_type: str,
        provider: str,
        provider_model: str | None,
        source_fingerprint: str,
        source_role_analysis_id: str | None = None,
        result: dict[str, object],
    ) -> JobAnalysisResponse:
        analysis = JobAnalysis(
            user_id=user_id,
            job_posting_id=job_posting_id,
            analysis_type=analysis_type,
            provider=provider,
            provider_model=provider_model,
            source_fingerprint=source_fingerprint,
            source_role_analysis_id=source_role_analysis_id,
            result=result,
        )
        return serialize_analysis(self.analysis_repository.save(analysis))
