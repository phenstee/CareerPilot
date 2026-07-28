"""expand ai workflows

Revision ID: 202607220011
Revises: 202607220010
Create Date: 2026-07-22 00:11:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220011"
down_revision: str | None = "202607220010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("job_analyses") as batch_op:
        batch_op.add_column(sa.Column("provider_model", sa.String(length=120), nullable=True))
        batch_op.drop_constraint("ck_job_analyses_analysis_type", type_="check")
        batch_op.create_check_constraint(
            "ck_job_analyses_analysis_type",
            "analysis_type IN ('resume_suggestions', 'application_draft', 'role_analysis', 'preparation_plan')",
        )

    with op.batch_alter_table("interview_sessions") as batch_op:
        batch_op.add_column(sa.Column("provider_model", sa.String(length=120), nullable=True))

    with op.batch_alter_table("interview_answers") as batch_op:
        batch_op.add_column(sa.Column("provider_model", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.execute("DELETE FROM job_analyses WHERE analysis_type IN ('application_draft', 'role_analysis', 'preparation_plan')")

    with op.batch_alter_table("interview_answers") as batch_op:
        batch_op.drop_column("provider_model")

    with op.batch_alter_table("interview_sessions") as batch_op:
        batch_op.drop_column("provider_model")

    with op.batch_alter_table("job_analyses") as batch_op:
        batch_op.drop_constraint("ck_job_analyses_analysis_type", type_="check")
        batch_op.create_check_constraint(
            "ck_job_analyses_analysis_type",
            "analysis_type IN ('resume_suggestions')",
        )
        batch_op.drop_column("provider_model")
