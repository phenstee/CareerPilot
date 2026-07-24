from datetime import datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

AGENT_MESSAGE_ROLES = ("user", "assistant", "system")
AGENT_ACTION_PROPOSAL_STATUSES = ("proposed", "approved", "rejected", "executed")
AGENT_ACTION_TYPES = (
    "update_application_stage",
    "set_follow_up_date",
    "set_application_next_action",
)
AGENT_AUDIT_EVENTS = ("proposed", "approved", "rejected", "executed")


class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), default="Career agent chat", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="agent_conversations")
    messages: Mapped[list["AgentMessage"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AgentMessage.created_at",
    )
    proposals: Mapped[list["AgentActionProposal"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AgentActionProposal.created_at",
    )


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agent_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    conversation: Mapped[AgentConversation] = relationship(back_populates="messages")

    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_agent_messages_role",
        ),
    )


class AgentActionProposal(Base):
    __tablename__ = "agent_action_proposals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agent_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="", nullable=False)
    arguments: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="proposed", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    conversation: Mapped[AgentConversation] = relationship(back_populates="proposals")
    user: Mapped["User"] = relationship(back_populates="agent_action_proposals")
    audit_logs: Mapped[list["AgentActionAuditLog"]] = relationship(
        back_populates="proposal",
        cascade="all, delete-orphan",
        order_by="AgentActionAuditLog.created_at",
    )

    __table_args__ = (
        CheckConstraint(
            "action_type IN ('update_application_stage', 'set_follow_up_date', 'set_application_next_action')",
            name="ck_agent_action_proposals_action_type",
        ),
        CheckConstraint(
            "status IN ('proposed', 'approved', 'rejected', 'executed')",
            name="ck_agent_action_proposals_status",
        ),
    )


class AgentActionAuditLog(Base):
    __tablename__ = "agent_action_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    proposal_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agent_action_proposals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    proposal: Mapped[AgentActionProposal] = relationship(back_populates="audit_logs")
    user: Mapped["User"] = relationship(back_populates="agent_action_audit_logs")

    __table_args__ = (
        CheckConstraint(
            "event IN ('proposed', 'approved', 'rejected', 'executed')",
            name="ck_agent_action_audit_logs_event",
        ),
    )
