from datetime import datetime

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
    extracted_text_preview: str
    extracted_text_length: int


class ResumeTextResponse(BaseModel):
    id: str
    extracted_text: str
