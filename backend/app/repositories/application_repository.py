from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.job import JobPosting
from app.models.tracker import APPLICATION_STAGES, Application, ApplicationStageHistory


class ApplicationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(
        self,
        user_id: str,
        *,
        company: str | None = None,
        stage: str | None = None,
        role: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Application], int]:
        filters = [Application.user_id == user_id]
        if company:
            filters.append(func.lower(JobPosting.company).like(f"%{company.lower()}%"))
        if role:
            filters.append(func.lower(JobPosting.title).like(f"%{role.lower()}%"))
        if stage:
            filters.append(Application.stage == stage)
        if date_from:
            filters.append(or_(Application.date_applied >= date_from, Application.date_applied.is_(None)))
        if date_to:
            filters.append(or_(Application.date_applied <= date_to, Application.date_applied.is_(None)))

        total_statement = select(func.count()).select_from(Application).join(Application.job_posting).where(*filters)
        total = self.db.scalar(total_statement) or 0
        statement = (
            select(Application)
            .join(Application.job_posting)
            .options(joinedload(Application.job_posting), selectinload(Application.stage_history))
            .where(*filters)
            .order_by(Application.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def get_for_user(self, user_id: str, application_id: str) -> Application | None:
        statement = (
            select(Application)
            .options(joinedload(Application.job_posting), selectinload(Application.stage_history))
            .where(Application.user_id == user_id, Application.id == application_id)
        )
        return self.db.scalar(statement)

    def get_by_job_for_user(self, user_id: str, job_posting_id: str) -> Application | None:
        statement = (
            select(Application)
            .options(joinedload(Application.job_posting), selectinload(Application.stage_history))
            .where(Application.user_id == user_id, Application.job_posting_id == job_posting_id)
        )
        return self.db.scalar(statement)

    def counts_by_stage(self, user_id: str) -> dict[str, int]:
        statement = (
            select(Application.stage, func.count(Application.id))
            .where(Application.user_id == user_id)
            .group_by(Application.stage)
        )
        counts = {stage: 0 for stage in APPLICATION_STAGES}
        counts.update({stage: count for stage, count in self.db.execute(statement)})
        return counts

    def count_active(self, user_id: str) -> int:
        inactive_stages = ("Rejected", "Withdrawn")
        statement = select(func.count()).select_from(Application).where(
            Application.user_id == user_id,
            Application.stage.not_in(inactive_stages),
        )
        return self.db.scalar(statement) or 0

    def upcoming_deadlines(self, user_id: str, today: date, *, limit: int = 5) -> list[Application]:
        statement = (
            select(Application)
            .options(joinedload(Application.job_posting), selectinload(Application.stage_history))
            .where(
                Application.user_id == user_id,
                Application.deadline.is_not(None),
                Application.deadline >= today,
                Application.stage.not_in(("Rejected", "Withdrawn")),
            )
            .order_by(Application.deadline.asc())
            .limit(limit)
        )
        return list(self.db.scalars(statement))

    def follow_ups_due(self, user_id: str, today: date, *, limit: int = 5) -> list[Application]:
        statement = (
            select(Application)
            .options(joinedload(Application.job_posting), selectinload(Application.stage_history))
            .where(
                Application.user_id == user_id,
                Application.follow_up_date.is_not(None),
                Application.follow_up_date <= today,
                Application.stage.not_in(("Rejected", "Withdrawn")),
            )
            .order_by(Application.follow_up_date.asc())
            .limit(limit)
        )
        return list(self.db.scalars(statement))

    def save(self, application: Application) -> Application:
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application

    def add_stage_history(self, history: ApplicationStageHistory) -> None:
        self.db.add(history)

    def delete(self, application: Application) -> None:
        self.db.delete(application)
        self.db.commit()
