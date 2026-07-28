from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import RateLimitRule, enforce_user_rate_limit
from app.models.user import User
from app.schemas.job_search import (
    JobSearchResponse,
    ProfileJobSearchRequest,
    PromptJobSearchRequest,
    SaveDiscoveredJobRequest,
    SaveDiscoveredJobResponse,
)
from app.services.job_search_service import JobSearchService, UnsafeSourceUrlError

router = APIRouter(prefix="/job-search", tags=["job-search"])


@router.post("/profile", response_model=JobSearchResponse)
def search_by_profile(
    payload: ProfileJobSearchRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobSearchResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "job-search",
        RateLimitRule(settings.job_search_rate_limit_count, settings.job_search_rate_limit_window_seconds),
    )
    return JobSearchService(db).search_by_profile(current_user.id, payload)


@router.post("/prompt", response_model=JobSearchResponse)
def search_by_prompt(
    payload: PromptJobSearchRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobSearchResponse:
    del request
    enforce_user_rate_limit(
        current_user.id,
        "job-search",
        RateLimitRule(settings.job_search_rate_limit_count, settings.job_search_rate_limit_window_seconds),
    )
    return JobSearchService(db).search_by_prompt(current_user.id, payload)


@router.post("/save", response_model=SaveDiscoveredJobResponse, status_code=status.HTTP_201_CREATED)
def save_discovered_job(
    payload: SaveDiscoveredJobRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SaveDiscoveredJobResponse:
    try:
        return JobSearchService(db).save_discovered_job(current_user.id, payload)
    except UnsafeSourceUrlError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source URL must be a safe HTTPS URL.") from exc
