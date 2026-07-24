from datetime import date

from pydantic import BaseModel

from app.schemas.application import ApplicationResponse
from app.schemas.job import JobPostingResponse


class DashboardResponse(BaseModel):
    active_applications: int
    saved_jobs: int
    counts_by_stage: dict[str, int]
    upcoming_deadlines: list[ApplicationResponse]
    recent_jobs: list[JobPostingResponse]
    today: date
