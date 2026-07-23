from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeTextResponse
from app.services.resume_service import ResumeNotFoundError, ResumeService, ResumeValidationError

router = APIRouter(prefix="/resume", tags=["resume"])


@router.get("", response_model=ResumeResponse | None)
def get_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ResumeResponse | None:
    return ResumeService(db).get_resume(current_user.id)


@router.get("/text", response_model=ResumeTextResponse)
def get_resume_text(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ResumeTextResponse:
    try:
        return ResumeService(db).get_resume_text(current_user.id)
    except ResumeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.") from exc


@router.post("", response_model=ResumeResponse)
async def upload_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> ResumeResponse:
    try:
        return await ResumeService(db).upload_resume(current_user.id, file)
    except ResumeValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    try:
        ResumeService(db).delete_resume(current_user.id)
    except ResumeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.") from exc
