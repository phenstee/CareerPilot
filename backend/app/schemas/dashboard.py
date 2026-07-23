from datetime import date

from pydantic import BaseModel

from app.schemas.analysis import JobAnalysisResponse
from app.schemas.application import ApplicationResponse
from app.schemas.job import JobPostingResponse
from app.schemas.task import CareerTaskResponse


class DashboardResponse(BaseModel):
    active_applications: int
    saved_jobs: int
    priority_tasks: int
    counts_by_stage: dict[str, int]
    upcoming_deadlines: list[ApplicationResponse]
    follow_ups_due: list[ApplicationResponse]
    recent_jobs: list[JobPostingResponse]
    recent_analyses: list[JobAnalysisResponse]
    priority_task_items: list[CareerTaskResponse]
    today: date
