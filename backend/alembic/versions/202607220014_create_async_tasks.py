"""create async tasks

Revision ID: 202607220014
Revises: 202607220013
Create Date: 2026-07-22 00:14:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "202607220014"
down_revision: str | None = "202607220013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "async_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("task_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("celery_task_id", sa.String(length=155), nullable=True),
        sa.Column("idempotency_key", sa.String(length=255), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_code", sa.String(length=80), nullable=True),
        sa.Column("last_error_message", sa.String(length=500), nullable=True),
        sa.Column("result_resource_type", sa.String(length=80), nullable=True),
        sa.Column("result_resource_id", sa.String(length=36), nullable=True),
        sa.CheckConstraint(
            "status IN ('QUEUED', 'RUNNING', 'RETRYING', 'SUCCEEDED', 'FAILED')",
            name="ck_async_tasks_status",
        ),
        sa.CheckConstraint(
            "task_type IN ('resume_suggestions', 'application_draft', 'role_analysis', 'preparation_plan', 'interview_session')",
            name="ck_async_tasks_task_type",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "task_type", "idempotency_key", name="uq_async_tasks_idempotency"),
    )
    op.create_index(op.f("ix_async_tasks_status"), "async_tasks", ["status"], unique=False)
    op.create_index(op.f("ix_async_tasks_user_id"), "async_tasks", ["user_id"], unique=False)
    op.create_index("ix_async_tasks_user_status_created", "async_tasks", ["user_id", "status", "created_at"], unique=False)

    op.add_column("job_analyses", sa.Column("async_task_id", sa.String(length=36), nullable=True))
    op.create_unique_constraint("uq_job_analyses_async_task_id", "job_analyses", ["async_task_id"])
    op.create_foreign_key(
        "fk_job_analyses_async_task_id_async_tasks",
        "job_analyses",
        "async_tasks",
        ["async_task_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("interview_sessions", sa.Column("async_task_id", sa.String(length=36), nullable=True))
    op.create_unique_constraint("uq_interview_sessions_async_task_id", "interview_sessions", ["async_task_id"])
    op.create_foreign_key(
        "fk_interview_sessions_async_task_id_async_tasks",
        "interview_sessions",
        "async_tasks",
        ["async_task_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_interview_sessions_async_task_id_async_tasks", "interview_sessions", type_="foreignkey")
    op.drop_constraint("uq_interview_sessions_async_task_id", "interview_sessions", type_="unique")
    op.drop_column("interview_sessions", "async_task_id")

    op.drop_constraint("fk_job_analyses_async_task_id_async_tasks", "job_analyses", type_="foreignkey")
    op.drop_constraint("uq_job_analyses_async_task_id", "job_analyses", type_="unique")
    op.drop_column("job_analyses", "async_task_id")

    op.drop_index("ix_async_tasks_user_status_created", table_name="async_tasks")
    op.drop_index(op.f("ix_async_tasks_user_id"), table_name="async_tasks")
    op.drop_index(op.f("ix_async_tasks_status"), table_name="async_tasks")
    op.drop_table("async_tasks")
