from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.tracker import Application
from app.models.interview import InterviewAnswer, InterviewQuestion, InterviewSession


class InterviewRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_application(
        self,
        user_id: str,
        application_id: str,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[InterviewSession], int]:
        filters = [
            InterviewSession.user_id == user_id,
            InterviewSession.application_id == application_id,
        ]
        total = self.db.scalar(select(func.count()).select_from(InterviewSession).where(*filters)) or 0
        statement = (
            select(InterviewSession)
            .options(
                joinedload(InterviewSession.application).joinedload(Application.job_posting),
                selectinload(InterviewSession.questions).selectinload(InterviewQuestion.answers),
            )
            .where(*filters)
            .order_by(InterviewSession.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement)), total

    def get_for_user(self, user_id: str, session_id: str) -> InterviewSession | None:
        statement = (
            select(InterviewSession)
            .options(
                joinedload(InterviewSession.application).joinedload(Application.job_posting),
                selectinload(InterviewSession.questions).selectinload(InterviewQuestion.answers),
            )
            .where(InterviewSession.user_id == user_id, InterviewSession.id == session_id)
        )
        return self.db.scalar(statement)

    def save_session(self, session: InterviewSession) -> InterviewSession:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def save_answer(self, answer: InterviewAnswer) -> InterviewAnswer:
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)
        return answer
