"""add analysis fingerprints

Revision ID: 202607220013
Revises: 202607220012
Create Date: 2026-07-22 00:13:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "202607220013"
down_revision: str | None = "202607220012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("job_analyses", sa.Column("source_fingerprint", sa.String(length=128), nullable=True))
    op.add_column("job_analyses", sa.Column("source_role_analysis_id", sa.String(length=36), nullable=True))


def downgrade() -> None:
    op.drop_column("job_analyses", "source_role_analysis_id")
    op.drop_column("job_analyses", "source_fingerprint")
