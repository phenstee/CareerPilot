from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, enforce_user_rate_limit
from app.models.user import User
from app.schemas.interview import (
    InterviewAnswerCreate,
    InterviewAnswerResponse,
    InterviewSessionCreate,
    InterviewSessionListResponse,
    InterviewSessionResponse,
)
from app.schemas.task import AsyncTaskResponse
from app.services.async_task_service import AsyncTaskService
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


@router.post("/sessions", response_model=AsyncTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def create_interview_session(
    payload: InterviewSessionCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AsyncTaskResponse:
    idempotency_key = request.headers.get("Idempotency-Key")
    del request
    enforce_user_rate_limit(
        current_user.id,
        "ai",
        RateLimitRule(settings.ai_rate_limit_count, settings.ai_rate_limit_window_seconds),
    )
    try:
        InterviewService(db).validate_session_request(current_user.id, payload)
        return AsyncTaskService(db).enqueue_ai_task(
            user_id=current_user.id,
            task_type="interview_session",
            payload={"application_id": payload.application_id},
            idempotency_key=idempotency_key,
        )
    except InterviewApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


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
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> InterviewAnswerResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "ai",
        RateLimitRule(settings.ai_rate_limit_count, settings.ai_rate_limit_window_seconds),
    )
    try:
        return InterviewService(db).answer_question(current_user.id, session_id, question_id, payload)
    except InterviewSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.") from exc
    except InterviewQuestionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview question not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
