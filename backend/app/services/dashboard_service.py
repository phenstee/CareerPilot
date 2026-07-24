from datetime import date

from sqlalchemy.orm import Session

from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.schemas.dashboard import DashboardResponse
from app.schemas.job import JobPostingResponse
from app.services.application_service import serialize_application


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.application_repository = ApplicationRepository(db)
        self.job_repository = JobRepository(db)

    def get_dashboard(self, user_id: str) -> DashboardResponse:
        today = date.today()
        recent_jobs, saved_jobs = self.job_repository.list_for_user(user_id, limit=5)
        return DashboardResponse(
            active_applications=self.application_repository.count_active(user_id),
            saved_jobs=saved_jobs,
            counts_by_stage=self.application_repository.counts_by_stage(user_id),
            upcoming_deadlines=[
                serialize_application(application)
                for application in self.application_repository.upcoming_deadlines(user_id, today)
            ],
            recent_jobs=[JobPostingResponse.model_validate(job) for job in recent_jobs],
            today=today,
        )
