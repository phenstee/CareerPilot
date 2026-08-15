from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.async_task import AsyncTask


class AsyncTaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, task: AsyncTask) -> AsyncTask:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_for_user(self, user_id: str, task_id: str) -> AsyncTask | None:
        return self.db.scalar(select(AsyncTask).where(AsyncTask.user_id == user_id, AsyncTask.id == task_id))

    def get(self, task_id: str) -> AsyncTask | None:
        return self.db.get(AsyncTask, task_id)

    def get_by_idempotency_key(self, user_id: str, task_type: str, idempotency_key: str) -> AsyncTask | None:
        return self.db.scalar(
            select(AsyncTask).where(
                AsyncTask.user_id == user_id,
                AsyncTask.task_type == task_type,
                AsyncTask.idempotency_key == idempotency_key,
            )
        )

    def list_for_user(
        self,
        user_id: str,
        *,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[AsyncTask], int]:
        filters = [AsyncTask.user_id == user_id]
        if status:
            filters.append(AsyncTask.status == status)
        total = self.db.scalar(select(func.count()).select_from(AsyncTask).where(*filters)) or 0
        statement = (
            select(AsyncTask)
            .where(*filters)
            .order_by(AsyncTask.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def set_celery_task_id(self, task_id: str, celery_task_id: str | None) -> None:
        task = self.get(task_id)
        if task is None:
            return
        task.celery_task_id = celery_task_id
        self.db.add(task)
        self.db.commit()

    def mark_running(self, task: AsyncTask) -> AsyncTask:
        task.status = "RUNNING"
        task.attempt_count += 1
        task.started_at = datetime.now(UTC)
        task.last_error_code = None
        task.last_error_message = None
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def mark_retrying(self, task: AsyncTask, *, code: str, message: str) -> AsyncTask:
        task.status = "RETRYING"
        task.last_error_code = code
        task.last_error_message = message[:500]
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def mark_succeeded(self, task: AsyncTask, *, resource_type: str, resource_id: str) -> AsyncTask:
        task.status = "SUCCEEDED"
        task.finished_at = datetime.now(UTC)
        task.last_error_code = None
        task.last_error_message = None
        task.result_resource_type = resource_type
        task.result_resource_id = resource_id
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def mark_failed(self, task: AsyncTask, *, code: str, message: str) -> AsyncTask:
        task.status = "FAILED"
        task.finished_at = datetime.now(UTC)
        task.last_error_code = code
        task.last_error_message = message[:500]
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
