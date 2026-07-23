from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.analysis import JobAnalysis


class AnalysisRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(
        self,
        user_id: str,
        *,
        job_posting_id: str | None = None,
        analysis_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[JobAnalysis], int]:
        filters = [JobAnalysis.user_id == user_id]
        if job_posting_id:
            filters.append(JobAnalysis.job_posting_id == job_posting_id)
        if analysis_type:
            filters.append(JobAnalysis.analysis_type == analysis_type)
        total = self.db.scalar(select(func.count()).select_from(JobAnalysis).where(*filters)) or 0
        statement = (
            select(JobAnalysis)
            .options(joinedload(JobAnalysis.job_posting))
            .where(*filters)
            .order_by(JobAnalysis.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def get_for_user(self, user_id: str, analysis_id: str) -> JobAnalysis | None:
        statement = (
            select(JobAnalysis)
            .options(joinedload(JobAnalysis.job_posting))
            .where(JobAnalysis.user_id == user_id, JobAnalysis.id == analysis_id)
        )
        return self.db.scalar(statement)

    def save(self, analysis: JobAnalysis) -> JobAnalysis:
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return self.get_for_user(analysis.user_id, analysis.id) or analysis
