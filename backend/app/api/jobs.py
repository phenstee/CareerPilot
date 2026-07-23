from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.job import JobPostingCreate, JobPostingListResponse, JobPostingResponse, JobPostingUpdate
from app.services.job_service import JobNotFoundError, JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobPostingListResponse)
def list_jobs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    company: str | None = None,
    employment_type: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> JobPostingListResponse:
    return JobService(db).list_jobs(
        current_user.id,
        search=search,
        company=company,
        employment_type=employment_type,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobPostingCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingResponse:
    return JobService(db).create_job(current_user.id, payload)


@router.get("/{job_id}", response_model=JobPostingResponse)
def get_job(
    job_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingResponse:
    try:
        return JobService(db).get_job(current_user.id, job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc


@router.put("/{job_id}", response_model=JobPostingResponse)
def update_job(
    job_id: str,
    payload: JobPostingUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingResponse:
    try:
        return JobService(db).update_job(current_user.id, job_id, payload)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    try:
        JobService(db).delete_job(current_user.id, job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.") from exc
