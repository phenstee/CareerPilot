from sqlalchemy.orm import Session

from app.models.job import JobPosting
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobPostingCreate, JobPostingListResponse, JobPostingResponse, JobPostingUpdate


class JobNotFoundError(Exception):
    pass


class JobService:
    def __init__(self, db: Session) -> None:
        self.repository = JobRepository(db)

    def list_jobs(
        self,
        user_id: str,
        *,
        search: str | None = None,
        company: str | None = None,
        employment_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> JobPostingListResponse:
        jobs, total = self.repository.list_for_user(
            user_id,
            search=search,
            company=company,
            employment_type=employment_type,
            skip=skip,
            limit=limit,
        )
        return JobPostingListResponse(items=[JobPostingResponse.model_validate(job) for job in jobs], total=total)

    def create_job(self, user_id: str, payload: JobPostingCreate) -> JobPostingResponse:
        job = JobPosting(user_id=user_id, **payload.model_dump())
        return JobPostingResponse.model_validate(self.repository.create(job))

    def get_job(self, user_id: str, job_id: str) -> JobPostingResponse:
        job = self.repository.get_for_user(user_id, job_id)
        if job is None:
            raise JobNotFoundError
        return JobPostingResponse.model_validate(job)

    def update_job(self, user_id: str, job_id: str, payload: JobPostingUpdate) -> JobPostingResponse:
        job = self.repository.get_for_user(user_id, job_id)
        if job is None:
            raise JobNotFoundError
        for key, value in payload.model_dump().items():
            setattr(job, key, value)
        return JobPostingResponse.model_validate(self.repository.save(job))

    def delete_job(self, user_id: str, job_id: str) -> None:
        job = self.repository.get_for_user(user_id, job_id)
        if job is None:
            raise JobNotFoundError
        self.repository.delete(job)
