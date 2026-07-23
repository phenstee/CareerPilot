"""create job analyses

Revision ID: 202607220005
Revises: 202607220004
Create Date: 2026-07-22 00:05:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220005"
down_revision: str | None = "202607220004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "job_analyses",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("job_posting_id", sa.String(length=36), nullable=False),
        sa.Column("analysis_type", sa.String(length=40), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("match_score", sa.Integer(), nullable=True),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "analysis_type IN ('job_match', 'resume_suggestions')",
            name="ck_job_analyses_analysis_type",
        ),
        sa.ForeignKeyConstraint(["job_posting_id"], ["job_postings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_job_analyses_job_posting_id", "job_analyses", ["job_posting_id"])
    op.create_index("ix_job_analyses_user_id", "job_analyses", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_job_analyses_user_id", table_name="job_analyses")
    op.drop_index("ix_job_analyses_job_posting_id", table_name="job_analyses")
    op.drop_table("job_analyses")
