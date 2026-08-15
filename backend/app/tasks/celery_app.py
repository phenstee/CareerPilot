import json
import logging

from celery import Celery
from celery.signals import heartbeat_sent, worker_ready, worker_shutdown
from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "careerpilot",
    broker=settings.effective_celery_broker_url,
    backend=settings.effective_celery_result_backend,
    include=["app.tasks.ai_tasks"],
)


def _heartbeat_key(hostname: str) -> str:
    return f"careerpilot:worker:{hostname}:heartbeat"


def _redis_client() -> Redis:
    return Redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=0.2,
        socket_timeout=0.2,
    )


def _write_heartbeat(hostname: str) -> None:
    try:
        _redis_client().setex(
            _heartbeat_key(hostname),
            settings.worker_heartbeat_ttl_seconds,
            json.dumps({"hostname": hostname, "status": "ok"}),
        )
    except RedisError as exc:
        logger.warning("worker_heartbeat_write_failed", extra={"error": exc.__class__.__name__})


@worker_ready.connect
def _on_worker_ready(sender=None, **_kwargs) -> None:
    hostname = getattr(sender, "hostname", "unknown")
    _write_heartbeat(hostname)
    logger.info("worker_ready", extra={"worker": hostname})


@heartbeat_sent.connect
def _on_worker_heartbeat(sender=None, **_kwargs) -> None:
    hostname = getattr(sender, "hostname", "unknown")
    _write_heartbeat(hostname)


@worker_shutdown.connect
def _on_worker_shutdown(sender=None, **_kwargs) -> None:
    hostname = getattr(sender, "hostname", "unknown")
    try:
        _redis_client().delete(_heartbeat_key(hostname))
    except RedisError:
        pass
    logger.info("worker_shutdown", extra={"worker": hostname})

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=False,
    task_time_limit=settings.celery_task_time_limit,
    task_soft_time_limit=settings.celery_task_soft_time_limit,
    task_always_eager=settings.celery_task_always_eager or settings.environment == "test",
    task_eager_propagates=True,
    worker_prefetch_multiplier=settings.celery_worker_prefetch_multiplier,
    broker_transport_options={"visibility_timeout": settings.redis_visibility_timeout_seconds},
)
