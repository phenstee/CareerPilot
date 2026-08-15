import random
import logging
from time import perf_counter

from celery.exceptions import MaxRetriesExceededError

from app.ai.base import AIProviderError
from app.database.session import SessionLocal
from app.repositories.async_task_repository import AsyncTaskRepository
from app.schemas.analysis import AnalysisCreateRequest, PreparationPlanCreateRequest
from app.schemas.interview import InterviewSessionCreate
from app.services.agent_service import (
    AgentJobNotFoundError,
    AgentRoleAnalysisNotFoundError,
    AgentService,
    StaleRoleAnalysisError,
)
from app.services.analysis_service import AnalysisJobNotFoundError, AnalysisService
from app.services.interview_service import InterviewApplicationNotFoundError, InterviewService
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.ai_tasks.run_ai_task")
def run_ai_task(self, async_task_id: str, payload: dict[str, str | None]) -> dict[str, str]:
    started_at = perf_counter()
    db = SessionLocal()
    repository = AsyncTaskRepository(db)
    task = repository.get(async_task_id)
    try:
        if task is None:
            return {"status": "FAILED", "error": "task_not_found"}
        if task.status == "SUCCEEDED" and task.result_resource_id:
            return {"status": task.status, "resource_id": task.result_resource_id}

        task = repository.mark_running(task)
        logger.info(
            "async_task_started",
            extra={"task_id": task.id, "task_type": task.task_type, "status": task.status, "attempt": task.attempt_count},
        )
        resource_type, resource_id = _run_task(db, task.user_id, task.task_type, async_task_id, payload)
        repository.mark_succeeded(task, resource_type=resource_type, resource_id=resource_id)
        logger.info(
            "async_task_completed",
            extra={
                "task_id": task.id,
                "task_type": task.task_type,
                "status": "SUCCEEDED",
                "attempt": task.attempt_count,
                "duration_ms": int((perf_counter() - started_at) * 1000),
            },
        )
        return {"status": "SUCCEEDED", "resource_id": resource_id}
    except AIProviderError as exc:
        if task is None:
            raise
        repository.mark_retrying(task, code="ai_provider_unavailable", message=str(exc))
        logger.warning(
            "async_task_retrying",
            extra={"task_id": task.id, "task_type": task.task_type, "status": "RETRYING", "attempt": task.attempt_count},
        )
        try:
            raise self.retry(exc=exc, countdown=_retry_delay(task.attempt_count), max_retries=task.max_attempts - 1)
        except MaxRetriesExceededError:
            repository.mark_failed(task, code="ai_provider_unavailable", message=str(exc))
            return {"status": "FAILED", "error": "ai_provider_unavailable"}
    except (
        AgentJobNotFoundError,
        AgentRoleAnalysisNotFoundError,
        AnalysisJobNotFoundError,
        InterviewApplicationNotFoundError,
        StaleRoleAnalysisError,
        ValueError,
    ) as exc:
        if task is not None:
            repository.mark_failed(task, code=exc.__class__.__name__, message=str(exc) or "Task input is no longer valid.")
            logger.info(
                "async_task_failed",
                extra={
                    "task_id": task.id,
                    "task_type": task.task_type,
                    "status": "FAILED",
                    "attempt": task.attempt_count,
                    "duration_ms": int((perf_counter() - started_at) * 1000),
                },
            )
        return {"status": "FAILED", "error": exc.__class__.__name__}
    except Exception as exc:
        if task is not None:
            repository.mark_retrying(task, code="unexpected_error", message=str(exc) or "Unexpected worker error.")
            logger.exception(
                "async_task_unexpected_error",
                extra={"task_id": task.id, "task_type": task.task_type, "status": "RETRYING", "attempt": task.attempt_count},
            )
            try:
                raise self.retry(exc=exc, countdown=_retry_delay(task.attempt_count), max_retries=task.max_attempts - 1)
            except MaxRetriesExceededError:
                repository.mark_failed(task, code="unexpected_error", message=str(exc) or "Unexpected worker error.")
                return {"status": "FAILED", "error": "unexpected_error"}
        raise
    finally:
        db.close()


def _run_task(db, user_id: str, task_type: str, async_task_id: str, payload: dict[str, str | None]) -> tuple[str, str]:
    if task_type == "resume_suggestions":
        result = AnalysisService(db).create_resume_suggestions(
            user_id,
            AnalysisCreateRequest(job_posting_id=_required(payload, "job_posting_id")),
            async_task_id=async_task_id,
        )
        return "job_analysis", result.id

    if task_type == "application_draft":
        result = AgentService(db).create_application_draft(
            user_id,
            AnalysisCreateRequest(job_posting_id=_required(payload, "job_posting_id")),
            async_task_id=async_task_id,
        )
        return "job_analysis", result.id

    if task_type == "role_analysis":
        result = AgentService(db).create_role_analysis(
            user_id,
            AnalysisCreateRequest(job_posting_id=_required(payload, "job_posting_id")),
            async_task_id=async_task_id,
        )
        return "job_analysis", result.id

    if task_type == "preparation_plan":
        result = AgentService(db).create_preparation_plan(
            user_id,
            PreparationPlanCreateRequest(
                job_posting_id=_required(payload, "job_posting_id"),
                role_analysis_id=payload.get("role_analysis_id"),
            ),
            async_task_id=async_task_id,
        )
        return "job_analysis", result.id

    if task_type == "interview_session":
        result = InterviewService(db).create_session(
            user_id,
            InterviewSessionCreate(application_id=_required(payload, "application_id")),
            async_task_id=async_task_id,
        )
        return "interview_session", result.id

    raise ValueError(f"Unsupported async task type: {task_type}")


def _required(payload: dict[str, str | None], key: str) -> str:
    value = payload.get(key)
    if not value:
        raise ValueError(f"Missing required task payload field: {key}")
    return value


def _retry_delay(attempt_count: int) -> int:
    return min(60, (2 ** max(attempt_count - 1, 0)) + random.randint(0, 3))
