from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.tracker import Application, CareerTask


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(
        self,
        user_id: str,
        *,
        include_completed: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[CareerTask], int]:
        filters = [CareerTask.user_id == user_id]
        if not include_completed:
            filters.append(CareerTask.is_completed.is_(False))

        total = self.db.scalar(select(func.count()).select_from(CareerTask).where(*filters)) or 0
        statement = (
            select(CareerTask)
            .options(joinedload(CareerTask.application).joinedload(Application.job_posting))
            .where(*filters)
            .order_by(CareerTask.is_completed.asc(), CareerTask.suggested_deadline.asc(), CareerTask.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def get_for_user(self, user_id: str, task_id: str) -> CareerTask | None:
        statement = (
            select(CareerTask)
            .options(joinedload(CareerTask.application).joinedload(Application.job_posting))
            .where(CareerTask.user_id == user_id, CareerTask.id == task_id)
        )
        return self.db.scalar(statement)

    def count_priority_open(self, user_id: str) -> int:
        statement = select(func.count()).select_from(CareerTask).where(
            CareerTask.user_id == user_id,
            CareerTask.priority == "High",
            CareerTask.is_completed.is_(False),
        )
        return self.db.scalar(statement) or 0

    def priority_open(self, user_id: str, today: date, *, limit: int = 5) -> list[CareerTask]:
        statement = (
            select(CareerTask)
            .options(joinedload(CareerTask.application).joinedload(Application.job_posting))
            .where(
                CareerTask.user_id == user_id,
                CareerTask.priority == "High",
                CareerTask.is_completed.is_(False),
            )
            .order_by(CareerTask.suggested_deadline.is_(None), CareerTask.suggested_deadline.asc(), CareerTask.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(statement))

    def save(self, task: CareerTask) -> CareerTask:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: CareerTask) -> None:
        self.db.delete(task)
        self.db.commit()
