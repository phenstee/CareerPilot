"""drop agent tables

Revision ID: 202607220010
Revises: 202607220009
Create Date: 2026-07-22 00:10:00
"""
from collections.abc import Sequence

from alembic import op


revision: str = "202607220010"
down_revision: str | None = "202607220009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
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


def downgrade() -> None:
    raise NotImplementedError("Agent tables were removed from the MVP.")
