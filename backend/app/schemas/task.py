from datetime import datetime
from typing import Literal

from pydantic import BaseModel

TaskStatus = Literal["QUEUED", "RUNNING", "RETRYING", "SUCCEEDED", "FAILED"]
TaskType = Literal[
    "resume_suggestions",
    "application_draft",
    "role_analysis",
    "preparation_plan",
    "interview_session",
]


class AsyncTaskResponse(BaseModel):
    id: str
    task_type: TaskType
    status: TaskStatus
    attempt_count: int
    max_attempts: int
    created_at: datetime
    queued_at: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    last_error_code: str | None = None
    last_error_message: str | None = None
    result_resource_type: str | None = None
    result_resource_id: str | None = None


class AsyncTaskListResponse(BaseModel):
    items: list[AsyncTaskResponse]
    total: int
