from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.interview import (
    InterviewAnswerCreate,
    InterviewAnswerResponse,
    InterviewSessionCreate,
    InterviewSessionListResponse,
    InterviewSessionResponse,
)
from app.services.interview_service import (
    InterviewApplicationNotFoundError,
    InterviewQuestionNotFoundError,
    InterviewService,
    InterviewSessionNotFoundError,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=InterviewSessionListResponse)
def list_interview_sessions(
    application_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> InterviewSessionListResponse:
    try:
        return InterviewService(db).list_sessions(
            current_user.id,
            application_id,
            skip=skip,
            limit=limit,
        )
    except InterviewApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.") from exc


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    payload: InterviewSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> InterviewSessionResponse:
    try:
        return InterviewService(db).create_session(current_user.id, payload)
    except InterviewApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.") from exc


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
def get_interview_session(
    session_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> InterviewSessionResponse:
    try:
        return InterviewService(db).get_session(current_user.id, session_id)
    except InterviewSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.") from exc


@router.post(
    "/sessions/{session_id}/questions/{question_id}/answers",
    response_model=InterviewAnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def answer_interview_question(
    session_id: str,
    question_id: str,
    payload: InterviewAnswerCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> InterviewAnswerResponse:
    try:
        return InterviewService(db).answer_question(current_user.id, session_id, question_id, payload)
    except InterviewSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.") from exc
    except InterviewQuestionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview question not found.") from exc
