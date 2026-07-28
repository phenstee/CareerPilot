from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, enforce_user_rate_limit
from app.models.user import User
from app.schemas.analysis import AnalysisCreateRequest, JobAnalysisResponse, PreparationPlanCreateRequest
from app.services.agent_service import AgentJobNotFoundError, AgentRoleAnalysisNotFoundError, AgentService, StaleRoleAnalysisError

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/application-draft", response_model=JobAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_application_draft(
    payload: AnalysisCreateRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "ai",
        RateLimitRule(settings.ai_rate_limit_count, settings.ai_rate_limit_window_seconds),
    )
    try:
        return AgentService(db).create_application_draft(current_user.id, payload)
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/role-analysis", response_model=JobAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_role_analysis(
    payload: AnalysisCreateRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "ai",
        RateLimitRule(settings.ai_rate_limit_count, settings.ai_rate_limit_window_seconds),
    )
    try:
        return AgentService(db).create_role_analysis(current_user.id, payload)
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/preparation-plan", response_model=JobAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_preparation_plan(
    payload: PreparationPlanCreateRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "ai",
        RateLimitRule(settings.ai_rate_limit_count, settings.ai_rate_limit_window_seconds),
    )
    try:
        return AgentService(db).create_preparation_plan(current_user.id, payload)
    except AgentJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AgentRoleAnalysisNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generate role analysis before creating a preparation plan.") from exc
    except StaleRoleAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The role analysis is outdated. Regenerate it before creating a preparation plan.",
        ) from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
