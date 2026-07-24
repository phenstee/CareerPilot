"""create agent tables

Revision ID: 202607220009
Revises: 202607220008
Create Date: 2026-07-22 00:09:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202607220009"
down_revision: str | None = "202607220008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "agent_conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_conversations_user_id"), "agent_conversations", ["user_id"], unique=False)

    op.create_table(
        "agent_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('user', 'assistant', 'system')", name="ck_agent_messages_role"),
        sa.ForeignKeyConstraint(["conversation_id"], ["agent_conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_messages_conversation_id"), "agent_messages", ["conversation_id"], unique=False)

    op.create_table(
        "agent_action_proposals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("action_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("arguments", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "action_type IN ('update_application_stage', 'set_follow_up_date', 'set_application_next_action')",
            name="ck_agent_action_proposals_action_type",
        ),
        sa.CheckConstraint(
            "status IN ('proposed', 'approved', 'rejected', 'executed')",
            name="ck_agent_action_proposals_status",
        ),
        sa.ForeignKeyConstraint(["conversation_id"], ["agent_conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_action_proposals_conversation_id"), "agent_action_proposals", ["conversation_id"], unique=False)
    op.create_index(op.f("ix_agent_action_proposals_user_id"), "agent_action_proposals", ["user_id"], unique=False)

    op.create_table(
        "agent_action_audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("proposal_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("event", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "event IN ('proposed', 'approved', 'rejected', 'executed')",
            name="ck_agent_action_audit_logs_event",
        ),
        sa.ForeignKeyConstraint(["proposal_id"], ["agent_action_proposals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_action_audit_logs_proposal_id"), "agent_action_audit_logs", ["proposal_id"], unique=False)
    op.create_index(op.f("ix_agent_action_audit_logs_user_id"), "agent_action_audit_logs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_agent_action_audit_logs_user_id"), table_name="agent_action_audit_logs")
    op.drop_index(op.f("ix_agent_action_audit_logs_proposal_id"), table_name="agent_action_audit_logs")
    op.drop_table("agent_action_audit_logs")
    op.drop_index(op.f("ix_agent_action_proposals_user_id"), table_name="agent_action_proposals")
    op.drop_index(op.f("ix_agent_action_proposals_conversation_id"), table_name="agent_action_proposals")
    op.drop_table("agent_action_proposals")
    op.drop_index(op.f("ix_agent_messages_conversation_id"), table_name="agent_messages")
    op.drop_table("agent_messages")
    op.drop_index(op.f("ix_agent_conversations_user_id"), table_name="agent_conversations")
    op.drop_table("agent_conversations")
