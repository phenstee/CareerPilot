from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.tracker import TASK_PRIORITIES


class CareerTaskBase(BaseModel):
    application_id: str | None = None
    title: str = Field(min_length=1, max_length=255)
    explanation: str = Field(default="", max_length=10000)
    priority: str = Field(default="Medium")
    estimated_effort: str = Field(default="", max_length=100)
    related_skill: str = Field(default="", max_length=120)
    suggested_deadline: date | None = None
    is_completed: bool = False

    @field_validator("title", "explanation", "estimated_effort", "related_skill")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in TASK_PRIORITIES:
            raise ValueError("Choose a valid priority.")
        return cleaned


class CareerTaskCreate(CareerTaskBase):
    pass


class CareerTaskUpdate(CareerTaskBase):
    pass


class CareerTaskResponse(CareerTaskBase):
    id: str
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    application_company: str | None = None
    application_role: str | None = None


class CareerTaskListResponse(BaseModel):
    items: list[CareerTaskResponse]
    total: int
