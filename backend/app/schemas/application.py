from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.tracker import APPLICATION_STAGES


class ApplicationBase(BaseModel):
    stage: str = Field(default="Saved")
    date_applied: date | None = None
    deadline: date | None = None
    follow_up_date: date | None = None
    notes: str = Field(default="", max_length=10000)
    important_contacts: list[str] = Field(default_factory=list, max_length=20)
    next_action: str = Field(default="", max_length=500)

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in APPLICATION_STAGES:
            raise ValueError("Choose a valid application stage.")
        return cleaned

    @field_validator("notes", "next_action")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("important_contacts")
    @classmethod
    def clean_contacts(cls, value: list[str]) -> list[str]:
        return [contact.strip() for contact in value if contact.strip()]


class ApplicationCreate(ApplicationBase):
    job_posting_id: str


class ApplicationUpdate(ApplicationBase):
    pass


class ApplicationStageHistoryResponse(BaseModel):
    id: str
    from_stage: str | None
    to_stage: str
    changed_at: datetime
    note: str

    model_config = {"from_attributes": True}


class ApplicationResponse(ApplicationBase):
    id: str
    job_posting_id: str
    job_title: str
    company: str
    location: str
    employment_type: str
    created_at: datetime
    updated_at: datetime
    stage_history: list[ApplicationStageHistoryResponse]


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
    counts_by_stage: dict[str, int]
