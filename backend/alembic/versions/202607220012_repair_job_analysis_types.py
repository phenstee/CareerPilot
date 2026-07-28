"""repair job analysis type constraint

Revision ID: 202607220012
Revises: 202607220011
Create Date: 2026-07-22 00:12:00
"""

from collections.abc import Sequence

from alembic import op


revision: str = "202607220012"
down_revision: str | None = "202607220011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_job_analyses_analysis_type", "job_analyses", type_="check")
    op.create_check_constraint(
        "ck_job_analyses_analysis_type",
        "job_analyses",
        "analysis_type IN ('resume_suggestions', 'application_draft', 'role_analysis', 'preparation_plan')",
    )


def downgrade() -> None:
    op.execute("DELETE FROM job_analyses WHERE analysis_type IN ('application_draft', 'role_analysis', 'preparation_plan')")
    op.drop_constraint("ck_job_analyses_analysis_type", "job_analyses", type_="check")
    op.create_check_constraint(
        "ck_job_analyses_analysis_type",
        "job_analyses",
        "analysis_type IN ('resume_suggestions')",
    )
