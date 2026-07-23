from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.applications import router as applications_router
from app.api.analyses import router as analyses_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.tasks import router as tasks_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="CareerPilot API",
        version="0.1.0",
        description="Backend API for CareerPilot, an AI-assisted career tracker.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(profile_router, prefix=settings.api_v1_prefix)
    app.include_router(resume_router, prefix=settings.api_v1_prefix)
    app.include_router(jobs_router, prefix=settings.api_v1_prefix)
    app.include_router(applications_router, prefix=settings.api_v1_prefix)
    app.include_router(analyses_router, prefix=settings.api_v1_prefix)
    app.include_router(tasks_router, prefix=settings.api_v1_prefix)
    app.include_router(dashboard_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
