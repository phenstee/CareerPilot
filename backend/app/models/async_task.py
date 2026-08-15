from datetime import datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

ASYNC_TASK_STATUSES = ("QUEUED", "RUNNING", "RETRYING", "SUCCEEDED", "FAILED")
ASYNC_TASK_TYPES = (
    "resume_suggestions",
    "application_draft",
    "role_analysis",
    "preparation_plan",
    "interview_session",
)


class AsyncTask(Base):
    __tablename__ = "async_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_type: Mapped[str] = mapped_column(String(60), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="QUEUED", nullable=False, index=True)
    celery_task_id: Mapped[str | None] = mapped_column(String(155), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attempt_count: Mapped[int] = mapped_column(default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(default=3, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    queued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    result_resource_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    result_resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    user: Mapped["User"] = relationship(back_populates="async_tasks")

    __table_args__ = (
        CheckConstraint(
            "status IN ('QUEUED', 'RUNNING', 'RETRYING', 'SUCCEEDED', 'FAILED')",
            name="ck_async_tasks_status",
        ),
        CheckConstraint(
            "task_type IN ('resume_suggestions', 'application_draft', 'role_analysis', 'preparation_plan', 'interview_session')",
            name="ck_async_tasks_task_type",
        ),
        UniqueConstraint("user_id", "task_type", "idempotency_key", name="uq_async_tasks_idempotency"),
        Index("ix_async_tasks_user_status_created", "user_id", "status", "created_at"),
    )
