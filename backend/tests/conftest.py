from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.config import settings
from redis.exceptions import RedisError

from app.core.rate_limit import rate_limiter, redis_rate_limiter
from app.database.base import Base
from app.main import app
from app.models import User  # noqa: F401


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def _clear_rate_limits() -> None:
    # Limits live in Redis when it is reachable (as in CI), and fall back to
    # the in-process limiter otherwise. Reset both so every test starts with
    # empty buckets; without this, registrations from earlier tests exhaust
    # the per-IP limit and later tests get 429s.
    rate_limiter.clear()
    try:
        redis_rate_limiter.clear()
    except RedisError:
        pass


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    original_ai_provider = settings.ai_provider
    original_openai_api_key = settings.openai_api_key
    original_beta_access_code = settings.beta_access_code
    settings.ai_provider = "mock"
    settings.openai_api_key = None
    settings.beta_access_code = None
    _clear_rate_limits()

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    _clear_rate_limits()
    settings.ai_provider = original_ai_provider
    settings.openai_api_key = original_openai_api_key
    settings.beta_access_code = original_beta_access_code
