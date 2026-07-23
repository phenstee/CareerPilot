from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.job import JobPosting


class JobRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(
        self,
        user_id: str,
        *,
        search: str | None = None,
        company: str | None = None,
        employment_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[JobPosting], int]:
        filters = [JobPosting.user_id == user_id]
        if search:
            pattern = f"%{search.lower()}%"
            filters.append(
                or_(
                    func.lower(JobPosting.title).like(pattern),
                    func.lower(JobPosting.company).like(pattern),
                    func.lower(JobPosting.description).like(pattern),
                )
            )
        if company:
            filters.append(func.lower(JobPosting.company).like(f"%{company.lower()}%"))
        if employment_type:
            filters.append(func.lower(JobPosting.employment_type) == employment_type.lower())

        total = self.db.scalar(select(func.count()).select_from(JobPosting).where(*filters)) or 0
        statement = (
            select(JobPosting)
            .where(*filters)
            .order_by(JobPosting.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def get_for_user(self, user_id: str, job_id: str) -> JobPosting | None:
        statement = select(JobPosting).where(JobPosting.user_id == user_id, JobPosting.id == job_id)
        return self.db.scalar(statement)

    def create(self, job: JobPosting) -> JobPosting:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def save(self, job: JobPosting) -> JobPosting:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def delete(self, job: JobPosting) -> None:
        self.db.delete(job)
        self.db.commit()
