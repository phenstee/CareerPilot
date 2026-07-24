from sqlalchemy.orm import Session

from app.models.agent import AgentConversation
from app.models.analysis import JobAnalysis
from app.models.interview import InterviewSession
from app.models.job import JobPosting
from app.models.resume import Resume
from app.models.tracker import Application
from app.repositories.user_repository import UserRepository
from app.seed import DEMO_EMAIL, seed_demo_data


def test_seed_demo_data_creates_complete_demo_account(db_session: Session) -> None:
    user = seed_demo_data(db_session)

    assert user.email == DEMO_EMAIL
    assert UserRepository(db_session).get_by_email(DEMO_EMAIL) is not None
    assert db_session.query(JobPosting).filter_by(user_id=user.id).count() == 5
    assert db_session.query(Application).filter_by(user_id=user.id).count() == 4
    assert db_session.query(Resume).filter_by(user_id=user.id).one().filename.endswith(".pdf")
    assert db_session.query(JobAnalysis).filter_by(user_id=user.id).count() == 1
    assert db_session.query(InterviewSession).filter_by(user_id=user.id).count() == 1
    assert db_session.query(AgentConversation).filter_by(user_id=user.id).count() == 1


def test_seed_demo_data_is_idempotent_with_reset(db_session: Session) -> None:
    first = seed_demo_data(db_session)
    second = seed_demo_data(db_session)

    assert first.id != second.id
    assert db_session.query(JobPosting).filter_by(user_id=second.id).count() == 5
    assert db_session.query(JobPosting).count() == 5
