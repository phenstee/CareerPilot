from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

APPLICATION_STAGES = (
    "Saved",
    "Preparing",
    "Applied",
    "Online Assessment",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_posting_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage: Mapped[str] = mapped_column(String(40), default="Saved", nullable=False)
    date_applied: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    important_contacts: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    next_action: Mapped[str] = mapped_column(String(500), default="", nullable=False)
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

    user: Mapped["User"] = relationship(back_populates="applications")
    job_posting: Mapped["JobPosting"] = relationship(back_populates="application")
    stage_history: Mapped[list["ApplicationStageHistory"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationStageHistory.changed_at",
    )
    interview_sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("job_posting_id", name="uq_applications_job_posting_id"),
        CheckConstraint(
            "stage IN ('Saved', 'Preparing', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn')",
            name="ck_applications_stage",
        ),
    )


class ApplicationStageHistory(Base):
    __tablename__ = "application_stage_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    application_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_stage: Mapped[str | None] = mapped_column(String(40), nullable=True)
    to_stage: Mapped[str] = mapped_column(String(40), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)

    application: Mapped[Application] = relationship(back_populates="stage_history")

    __table_args__ = (
        CheckConstraint(
            "to_stage IN ('Saved', 'Preparing', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn')",
            name="ck_application_stage_history_to_stage",
        ),
    )
