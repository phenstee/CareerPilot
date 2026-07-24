from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
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
    career_profile: Mapped["CareerProfile | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    resume: Mapped["Resume | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    job_postings: Mapped[list["JobPosting"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    applications: Mapped[list["Application"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    job_analyses: Mapped[list["JobAnalysis"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    interview_sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    agent_conversations: Mapped[list["AgentConversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    agent_action_proposals: Mapped[list["AgentActionProposal"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    agent_action_audit_logs: Mapped[list["AgentActionAuditLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
