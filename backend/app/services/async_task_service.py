from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.core.config import settings
from app.models.async_task import AsyncTask
from app.repositories.async_task_repository import AsyncTaskRepository
from app.schemas.task import AsyncTaskListResponse, AsyncTaskResponse
from app.tasks.ai_tasks import _run_task, run_ai_task


class AsyncTaskNotFoundError(Exception):
    pass


class AsyncTaskService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AsyncTaskRepository(db)

    def enqueue_ai_task(
        self,
        *,
        user_id: str,
        task_type: str,
        payload: dict[str, str | None],
        idempotency_key: str | None,
        max_attempts: int = 3,
    ) -> AsyncTaskResponse:
        if idempotency_key:
            existing = self.repository.get_by_idempotency_key(user_id, task_type, idempotency_key)
            if existing is not None:
                return serialize_task(existing)

        task = self.repository.create(
            AsyncTask(
                user_id=user_id,
                task_type=task_type,
                status="QUEUED",
                idempotency_key=idempotency_key,
                max_attempts=max_attempts,
                queued_at=datetime.now(UTC),
            )
        )
        if settings.celery_task_always_eager or settings.environment == "test" or _uses_sqlite(self.db):
            return self._run_eager(task, payload)

        result = run_ai_task.delay(task.id, payload)
        self.repository.set_celery_task_id(task.id, getattr(result, "id", None))
        return serialize_task(self.repository.get(task.id) or task)

    def get_task(self, user_id: str, task_id: str) -> AsyncTaskResponse:
        task = self.repository.get_for_user(user_id, task_id)
        if task is None:
            raise AsyncTaskNotFoundError
        return serialize_task(task)

    def list_tasks(
        self,
        user_id: str,
        *,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> AsyncTaskListResponse:
        tasks, total = self.repository.list_for_user(user_id, status=status, skip=skip, limit=limit)
        return AsyncTaskListResponse(items=[serialize_task(task) for task in tasks], total=total)

    def _run_eager(self, task: AsyncTask, payload: dict[str, str | None]) -> AsyncTaskResponse:
        task = self.repository.mark_running(task)
        try:
            resource_type, resource_id = _run_task(self.db, task.user_id, task.task_type, task.id, payload)
        except AIProviderError as exc:
            task = self.repository.mark_failed(task, code="ai_provider_unavailable", message=str(exc))
        except Exception as exc:
            task = self.repository.mark_failed(
                task,
                code=exc.__class__.__name__,
                message=str(exc) or "Task failed.",
            )
        else:
            task = self.repository.mark_succeeded(task, resource_type=resource_type, resource_id=resource_id)
        return serialize_task(task)


def serialize_task(task: AsyncTask) -> AsyncTaskResponse:
    return AsyncTaskResponse(
        id=task.id,
        task_type=task.task_type,
        status=task.status,
        attempt_count=task.attempt_count,
        max_attempts=task.max_attempts,
        created_at=task.created_at,
        queued_at=task.queued_at,
        started_at=task.started_at,
        finished_at=task.finished_at,
        last_error_code=task.last_error_code,
        last_error_message=task.last_error_message,
        result_resource_type=task.result_resource_type,
        result_resource_id=task.result_resource_id,
    )


def _uses_sqlite(db: Session) -> bool:
    bind = db.get_bind()
    return bind.dialect.name == "sqlite"
