from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.analysis import AnalysisCreateRequest, JobAnalysisListResponse, JobAnalysisResponse
from app.services.analysis_service import AnalysisJobNotFoundError, AnalysisNotFoundError, AnalysisService

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=JobAnalysisListResponse)
def list_analyses(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    job_posting_id: str | None = None,
    analysis_type: Literal["job_match", "resume_suggestions"] | None = None,
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


@router.post("/job-match", response_model=JobAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_job_match_analysis(
    payload: AnalysisCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    try:
        return AnalysisService(db).create_job_match_analysis(current_user.id, payload)
    except AnalysisJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/resume-suggestions", response_model=JobAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_resume_suggestions(
    payload: AnalysisCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobAnalysisResponse:
    try:
        return AnalysisService(db).create_resume_suggestions(current_user.id, payload)
    except AnalysisJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


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
