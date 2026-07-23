from datetime import date

from sqlalchemy.orm import Session

from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.dashboard import DashboardResponse
from app.schemas.job import JobPostingResponse
from app.services.analysis_service import serialize_analysis
from app.services.application_service import serialize_application
from app.services.task_service import serialize_task


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.analysis_repository = AnalysisRepository(db)
        self.application_repository = ApplicationRepository(db)
        self.job_repository = JobRepository(db)
        self.task_repository = TaskRepository(db)

    def get_dashboard(self, user_id: str) -> DashboardResponse:
        today = date.today()
        recent_jobs, saved_jobs = self.job_repository.list_for_user(user_id, limit=5)
        recent_analyses, _ = self.analysis_repository.list_for_user(user_id, limit=5)
        return DashboardResponse(
            active_applications=self.application_repository.count_active(user_id),
            saved_jobs=saved_jobs,
            priority_tasks=self.task_repository.count_priority_open(user_id),
            counts_by_stage=self.application_repository.counts_by_stage(user_id),
            upcoming_deadlines=[
                serialize_application(application)
                for application in self.application_repository.upcoming_deadlines(user_id, today)
            ],
            follow_ups_due=[
                serialize_application(application)
                for application in self.application_repository.follow_ups_due(user_id, today)
            ],
            recent_jobs=[JobPostingResponse.model_validate(job) for job in recent_jobs],
            recent_analyses=[serialize_analysis(analysis) for analysis in recent_analyses],
            priority_task_items=[serialize_task(task) for task in self.task_repository.priority_open(user_id, today)],
            today=today,
        )
