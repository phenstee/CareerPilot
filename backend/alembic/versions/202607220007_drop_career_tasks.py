"""drop career tasks

Revision ID: 202607220007
Revises: 202607220006
Create Date: 2026-07-22 00:07:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220007"
down_revision: str | None = "202607220006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_career_tasks_user_id", table_name="career_tasks")
    op.drop_index("ix_career_tasks_application_id", table_name="career_tasks")
    op.drop_table("career_tasks")


def downgrade() -> None:
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
