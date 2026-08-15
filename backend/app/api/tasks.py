import asyncio
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.repositories.async_task_repository import AsyncTaskRepository
from app.schemas.task import AsyncTaskListResponse, AsyncTaskResponse, TaskStatus
from app.services.async_task_service import AsyncTaskNotFoundError, AsyncTaskService, serialize_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=AsyncTaskListResponse)
def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> AsyncTaskListResponse:
    return AsyncTaskService(db).list_tasks(current_user.id, status=status_filter, skip=skip, limit=limit)


@router.get("/{task_id}", response_model=AsyncTaskResponse)
def get_task(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AsyncTaskResponse:
    try:
        return AsyncTaskService(db).get_task(current_user.id, task_id)
    except AsyncTaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.") from exc


@router.get("/{task_id}/events")
async def stream_task_events(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StreamingResponse:
    if AsyncTaskRepository(db).get_for_user(current_user.id, task_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    async def event_generator():
        terminal_statuses = {"SUCCEEDED", "FAILED"}
        while True:
            db.expire_all()
            task = AsyncTaskRepository(db).get_for_user(current_user.id, task_id)
            if task is None:
                yield _sse_payload("failed", {"status": "FAILED", "last_error_message": "Task not found."})
                break

            response = serialize_task(task)
            yield _sse_payload("status", response.model_dump(mode="json"))
            if response.status in terminal_statuses:
                break
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def _sse_payload(event: str, data: dict[str, object]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
