from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class JobPostingBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    location: str = Field(default="", max_length=255)
    job_url: str | None = Field(default=None, max_length=1000)
    employment_type: str = Field(default="", max_length=100)
    description: str = Field(min_length=1, max_length=20000)
    notes: str = Field(default="", max_length=10000)

    @field_validator("title", "company", "location", "employment_type", "description", "notes")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("job_url")
    @classmethod
    def clean_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class JobPostingCreate(JobPostingBase):
    pass


class JobPostingUpdate(JobPostingBase):
    pass


class JobPostingResponse(JobPostingBase):
    id: str
    date_saved: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobPostingListResponse(BaseModel):
    items: list[JobPostingResponse]
    total: int
