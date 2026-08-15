from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, enforce_user_rate_limit
from app.models.user import User
from app.schemas.analysis import AnalysisCreateRequest, PreparationPlanCreateRequest
from app.schemas.task import AsyncTaskResponse
from app.services.agent_service import AgentJobNotFoundError, AgentRoleAnalysisNotFoundError, AgentService, StaleRoleAnalysisError
from app.services.async_task_service import AsyncTaskService

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/application-draft", response_model=AsyncTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def create_application_draft(
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
        AgentService(db).validate_application_draft_request(current_user.id, payload)
        return AsyncTaskService(db).enqueue_ai_task(
            user_id=current_user.id,
            task_type="application_draft",
            payload={"job_posting_id": payload.job_posting_id},
            idempotency_key=idempotency_key,
        )
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc


@router.post("/role-analysis", response_model=AsyncTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def create_role_analysis(
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
        AgentService(db).validate_role_analysis_request(current_user.id, payload)
        return AsyncTaskService(db).enqueue_ai_task(
            user_id=current_user.id,
            task_type="role_analysis",
            payload={"job_posting_id": payload.job_posting_id},
            idempotency_key=idempotency_key,
        )
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc


@router.post("/preparation-plan", response_model=AsyncTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def create_preparation_plan(
    payload: PreparationPlanCreateRequest,
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
        AgentService(db).validate_preparation_plan_request(current_user.id, payload)
        return AsyncTaskService(db).enqueue_ai_task(
            user_id=current_user.id,
            task_type="preparation_plan",
            payload={
                "job_posting_id": payload.job_posting_id,
                "role_analysis_id": payload.role_analysis_id,
            },
            idempotency_key=idempotency_key,
        )
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AgentRoleAnalysisNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generate role analysis before creating a preparation plan.") from exc
    except StaleRoleAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The role analysis is outdated. Regenerate it before creating a preparation plan.",
        ) from exc
