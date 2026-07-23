"""create applications and tasks

Revision ID: 202607220004
Revises: 202607220003
Create Date: 2026-07-22 00:04:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220004"
down_revision: str | None = "202607220003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

STAGE_CHECK = (
    "stage IN ('Saved', 'Preparing', 'Applied', 'Online Assessment', "
    "'Interview', 'Offer', 'Rejected', 'Withdrawn')"
)
TO_STAGE_CHECK = (
    "to_stage IN ('Saved', 'Preparing', 'Applied', 'Online Assessment', "
    "'Interview', 'Offer', 'Rejected', 'Withdrawn')"
)


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("job_posting_id", sa.String(length=36), nullable=False),
        sa.Column("stage", sa.String(length=40), nullable=False),
        sa.Column("date_applied", sa.Date(), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("important_contacts", sa.JSON(), nullable=False),
        sa.Column("next_action", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(STAGE_CHECK, name="ck_applications_stage"),
        sa.ForeignKeyConstraint(["job_posting_id"], ["job_postings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_posting_id", name="uq_applications_job_posting_id"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_job_posting_id", "applications", ["job_posting_id"])

    op.create_table(
        "application_stage_history",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("application_id", sa.String(length=36), nullable=False),
        sa.Column("from_stage", sa.String(length=40), nullable=True),
        sa.Column("to_stage", sa.String(length=40), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.CheckConstraint(TO_STAGE_CHECK, name="ck_application_stage_history_to_stage"),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_application_stage_history_application_id",
        "application_stage_history",
        ["application_id"],
    )

    op.create_table(
        "career_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("application_id", sa.String(length=36), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("estimated_effort", sa.String(length=100), nullable=False),
        sa.Column("related_skill", sa.String(length=120), nullable=False),
        sa.Column("suggested_deadline", sa.Date(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("priority IN ('Low', 'Medium', 'High')", name="ck_career_tasks_priority"),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_career_tasks_application_id", "career_tasks", ["application_id"])
    op.create_index("ix_career_tasks_user_id", "career_tasks", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_career_tasks_user_id", table_name="career_tasks")
    op.drop_index("ix_career_tasks_application_id", table_name="career_tasks")
    op.drop_table("career_tasks")
    op.drop_index("ix_application_stage_history_application_id", table_name="application_stage_history")
    op.drop_table("application_stage_history")
    op.drop_index("ix_applications_job_posting_id", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")
