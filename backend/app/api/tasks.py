from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.task import CareerTaskCreate, CareerTaskListResponse, CareerTaskResponse, CareerTaskUpdate
from app.services.task_service import TaskApplicationNotFoundError, TaskNotFoundError, TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=CareerTaskListResponse)
def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    include_completed: bool = True,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
) -> CareerTaskListResponse:
    return TaskService(db).list_tasks(
        current_user.id,
        include_completed=include_completed,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=CareerTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: CareerTaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CareerTaskResponse:
    try:
        return TaskService(db).create_task(current_user.id, payload)
    except TaskApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.") from exc


@router.put("/{task_id}", response_model=CareerTaskResponse)
def update_task(
    task_id: str,
    payload: CareerTaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CareerTaskResponse:
    try:
        return TaskService(db).update_task(current_user.id, task_id, payload)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.") from exc
    except TaskApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.") from exc


@router.patch("/{task_id}/complete", response_model=CareerTaskResponse)
def complete_task(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CareerTaskResponse:
    try:
        return TaskService(db).complete_task(current_user.id, task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.") from exc


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    try:
        TaskService(db).delete_task(current_user.id, task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.") from exc
