from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, enforce_user_rate_limit
from app.models.user import User
from app.schemas.analysis import AnalysisCreateRequest, AnalysisType, JobAnalysisListResponse, JobAnalysisResponse
from app.schemas.task import AsyncTaskResponse
from app.services.analysis_service import AnalysisJobNotFoundError, AnalysisNotFoundError, AnalysisService
from app.services.async_task_service import AsyncTaskService

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=JobAnalysisListResponse)
def list_analyses(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    job_posting_id: str | None = None,
    analysis_type: AnalysisType | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> JobAnalysisListResponse:
    return AnalysisService(db).list_analyses(
        current_user.id,
        job_posting_id=job_posting_id,
        analysis_type=analysis_type,
        skip=skip,
        limit=limit,
    )


@router.post("/resume-suggestions", response_model=AsyncTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def create_resume_suggestions(
    payload: AnalysisCreateRequest,
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
        AnalysisService(db).validate_resume_suggestions_request(current_user.id, payload)
        return AsyncTaskService(db).enqueue_ai_task(
            user_id=current_user.id,
            task_type="resume_suggestions",
            payload={"job_posting_id": payload.job_posting_id},
            idempotency_key=idempotency_key,
        )
    except AnalysisJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc


@router.get("/{analysis_id}", response_model=JobAnalysisResponse)
def get_analysis(
    analysis_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    try:
        return AnalysisService(db).get_analysis(current_user.id, analysis_id)
    except AnalysisNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.") from exc
