from fastapi import APIRouter, Depends
from redis import Redis
from redis.exceptions import RedisError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.schemas.health import DependencyHealth, HealthResponse, ReadinessResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="careerpilot-api",
        environment=settings.environment,
        ai_provider=settings.ai_provider,
    )


@router.get("/health/ready", response_model=ReadinessResponse)
def readiness_check(db: Session = Depends(get_db)) -> ReadinessResponse:
    dependencies = {
        "postgres": _check_postgres(db),
        "redis": _check_redis(),
        "workers": _check_workers(),
    }
    overall = "ok" if all(item.status == "ok" for item in dependencies.values()) else "degraded"
    return ReadinessResponse(status=overall, dependencies=dependencies)


def _check_postgres(db: Session) -> DependencyHealth:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        return DependencyHealth(status="error", detail=exc.__class__.__name__)
    return DependencyHealth(status="ok")


def _check_redis() -> DependencyHealth:
    try:
        client = _redis_client()
        client.ping()
    except RedisError as exc:
        return DependencyHealth(status="error", detail=exc.__class__.__name__)
    return DependencyHealth(status="ok")


def _check_workers() -> DependencyHealth:
    try:
        client = _redis_client()
        count = sum(1 for _ in client.scan_iter("careerpilot:worker:*:heartbeat"))
    except RedisError as exc:
        return DependencyHealth(status="error", detail=exc.__class__.__name__)
    if count == 0:
        return DependencyHealth(status="error", detail="no_recent_worker_heartbeat")
    return DependencyHealth(status="ok", detail=f"{count} worker heartbeat(s)")


def _redis_client() -> Redis:
    return Redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=0.2,
        socket_timeout=0.2,
    )
