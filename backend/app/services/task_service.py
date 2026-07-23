from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.repositories.application_repository import ApplicationRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import CareerTaskCreate, CareerTaskListResponse, CareerTaskResponse, CareerTaskUpdate
from app.models.tracker import CareerTask


class TaskNotFoundError(Exception):
    pass


class TaskApplicationNotFoundError(Exception):
    pass


class TaskService:
    def __init__(self, db: Session) -> None:
        self.repository = TaskRepository(db)
        self.application_repository = ApplicationRepository(db)

    def list_tasks(
        self,
        user_id: str,
        *,
        include_completed: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> CareerTaskListResponse:
        tasks, total = self.repository.list_for_user(
            user_id,
            include_completed=include_completed,
            skip=skip,
            limit=limit,
        )
        return CareerTaskListResponse(items=[serialize_task(task) for task in tasks], total=total)

    def create_task(self, user_id: str, payload: CareerTaskCreate) -> CareerTaskResponse:
        self._ensure_application_belongs_to_user(user_id, payload.application_id)
        task = CareerTask(user_id=user_id, **payload.model_dump())
        if task.is_completed:
            task.completed_at = datetime.now(UTC)
        return serialize_task(self.repository.save(task))

    def update_task(self, user_id: str, task_id: str, payload: CareerTaskUpdate) -> CareerTaskResponse:
        task = self._get_owned_task(user_id, task_id)
        self._ensure_application_belongs_to_user(user_id, payload.application_id)
        was_completed = task.is_completed
        for key, value in payload.model_dump().items():
            setattr(task, key, value)
        if task.is_completed and not was_completed:
            task.completed_at = datetime.now(UTC)
        if not task.is_completed:
            task.completed_at = None
        return serialize_task(self.repository.save(task))

    def complete_task(self, user_id: str, task_id: str) -> CareerTaskResponse:
        task = self._get_owned_task(user_id, task_id)
        task.is_completed = True
        task.completed_at = datetime.now(UTC)
        return serialize_task(self.repository.save(task))

    def delete_task(self, user_id: str, task_id: str) -> None:
        task = self._get_owned_task(user_id, task_id)
        self.repository.delete(task)

    def _get_owned_task(self, user_id: str, task_id: str) -> CareerTask:
        task = self.repository.get_for_user(user_id, task_id)
        if task is None:
            raise TaskNotFoundError
        return task

    def _ensure_application_belongs_to_user(self, user_id: str, application_id: str | None) -> None:
        if application_id is None:
            return
        if self.application_repository.get_for_user(user_id, application_id) is None:
            raise TaskApplicationNotFoundError


def serialize_task(task: CareerTask) -> CareerTaskResponse:
    application_role = None
    application_company = None
    if task.application is not None:
        application_role = task.application.job_posting.title
        application_company = task.application.job_posting.company

    return CareerTaskResponse(
        id=task.id,
        application_id=task.application_id,
        title=task.title,
        explanation=task.explanation,
        priority=task.priority,
        estimated_effort=task.estimated_effort,
        related_skill=task.related_skill,
        suggested_deadline=task.suggested_deadline,
        is_completed=task.is_completed,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
        application_company=application_company,
        application_role=application_role,
    )
