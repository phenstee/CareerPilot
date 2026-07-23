from io import BytesIO

from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeResponse, ResumeTextResponse

MAX_RESUME_BYTES = 5 * 1024 * 1024
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


class ResumeValidationError(Exception):
    pass


class ResumeNotFoundError(Exception):
    pass


class ResumeService:
    def __init__(self, db: Session) -> None:
        self.repository = ResumeRepository(db)

    def get_resume(self, user_id: str) -> ResumeResponse | None:
        resume = self.repository.get_by_user_id(user_id)
        return serialize_resume(resume) if resume else None

    def get_resume_text(self, user_id: str) -> ResumeTextResponse:
        resume = self.repository.get_by_user_id(user_id)
        if resume is None:
            raise ResumeNotFoundError
        return ResumeTextResponse(id=resume.id, extracted_text=resume.extracted_text)

    async def upload_resume(self, user_id: str, file: UploadFile) -> ResumeResponse:
        filename = file.filename or "resume.pdf"
        content_type = file.content_type or ""
        if content_type not in PDF_CONTENT_TYPES or not filename.lower().endswith(".pdf"):
            raise ResumeValidationError("Upload a PDF resume.")

        contents = await file.read()
        if not contents:
            raise ResumeValidationError("The uploaded file is empty.")
        if len(contents) > MAX_RESUME_BYTES:
            raise ResumeValidationError("Resume PDF must be 5 MB or smaller.")

        extracted_text = extract_pdf_text(contents)
        if not extracted_text:
            raise ResumeValidationError("No readable text was found in this PDF.")

        resume = self.repository.get_by_user_id(user_id)
        if resume is None:
            resume = Resume(user_id=user_id)

        resume.filename = filename
        resume.content_type = content_type
        resume.size_bytes = len(contents)
        resume.extracted_text = extracted_text

        saved = self.repository.save(resume)
        return serialize_resume(saved)

    def delete_resume(self, user_id: str) -> None:
        resume = self.repository.get_by_user_id(user_id)
        if resume is None:
            raise ResumeNotFoundError
        self.repository.delete(resume)


def extract_pdf_text(contents: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(contents))
        page_text = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:
        raise ResumeValidationError("The uploaded PDF could not be read.") from exc

    return "\n".join(page_text).strip()


def serialize_resume(resume: Resume) -> ResumeResponse:
    preview = resume.extracted_text[:500]
    return ResumeResponse(
        id=resume.id,
        filename=resume.filename,
        content_type=resume.content_type,
        size_bytes=resume.size_bytes,
        uploaded_at=resume.uploaded_at,
        extracted_text_preview=preview,
        extracted_text_length=len(resume.extracted_text),
    )
