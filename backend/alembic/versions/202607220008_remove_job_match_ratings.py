"""remove job match ratings

Revision ID: 202607220008
Revises: 202607220007
Create Date: 2026-07-22 00:08:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220008"
down_revision: str | None = "202607220007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("DELETE FROM job_analyses WHERE analysis_type = 'job_match'")
    op.drop_constraint("ck_job_analyses_analysis_type", "job_analyses", type_="check")
    op.create_check_constraint(
        "ck_job_analyses_analysis_type",
        "job_analyses",
        "analysis_type IN ('resume_suggestions')",
    )
    op.drop_column("job_analyses", "match_score")


def downgrade() -> None:
    op.add_column("job_analyses", sa.Column("match_score", sa.Integer(), nullable=True))
    op.drop_constraint("ck_job_analyses_analysis_type", "job_analyses", type_="check")
    op.create_check_constraint(
        "ck_job_analyses_analysis_type",
        "job_analyses",
        "analysis_type IN ('job_match', 'resume_suggestions')",
    )
