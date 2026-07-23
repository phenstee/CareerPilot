from datetime import date

from sqlalchemy.orm import Session

from app.models.tracker import Application, ApplicationStageHistory
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.schemas.application import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationUpdate,
)


class ApplicationNotFoundError(Exception):
    pass


class ApplicationAlreadyExistsError(Exception):
    pass


class ApplicationJobNotFoundError(Exception):
    pass


class ApplicationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ApplicationRepository(db)
        self.job_repository = JobRepository(db)

    def list_applications(
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
    ) -> ApplicationListResponse:
        applications, total = self.repository.list_for_user(
            user_id,
            company=company,
            stage=stage,
            role=role,
            date_from=date_from,
            date_to=date_to,
            skip=skip,
            limit=limit,
        )
        return ApplicationListResponse(
            items=[serialize_application(application) for application in applications],
            total=total,
            counts_by_stage=self.repository.counts_by_stage(user_id),
        )

    def create_application(self, user_id: str, payload: ApplicationCreate) -> ApplicationResponse:
        job = self.job_repository.get_for_user(user_id, payload.job_posting_id)
        if job is None:
            raise ApplicationJobNotFoundError
        if self.repository.get_by_job_for_user(user_id, payload.job_posting_id) is not None:
            raise ApplicationAlreadyExistsError

        application = Application(user_id=user_id, **payload.model_dump())
        self.repository.add_stage_history(
            ApplicationStageHistory(application=application, from_stage=None, to_stage=application.stage)
        )
        saved = self.repository.save(application)
        return serialize_application(saved)

    def get_application(self, user_id: str, application_id: str) -> ApplicationResponse:
        return serialize_application(self._get_owned_application(user_id, application_id))

    def update_application(
        self,
        user_id: str,
        application_id: str,
        payload: ApplicationUpdate,
    ) -> ApplicationResponse:
        application = self._get_owned_application(user_id, application_id)
        previous_stage = application.stage
        values = payload.model_dump()
        for key, value in values.items():
            setattr(application, key, value)
        if values["stage"] != previous_stage:
            self.repository.add_stage_history(
                ApplicationStageHistory(
                    application=application,
                    from_stage=previous_stage,
                    to_stage=values["stage"],
                    note=values.get("next_action") or "",
                )
            )
        saved = self.repository.save(application)
        return serialize_application(saved)

    def delete_application(self, user_id: str, application_id: str) -> None:
        application = self._get_owned_application(user_id, application_id)
        self.repository.delete(application)

    def _get_owned_application(self, user_id: str, application_id: str) -> Application:
        application = self.repository.get_for_user(user_id, application_id)
        if application is None:
            raise ApplicationNotFoundError
        return application


def serialize_application(application: Application) -> ApplicationResponse:
    job = application.job_posting
    return ApplicationResponse(
        id=application.id,
        job_posting_id=application.job_posting_id,
        job_title=job.title,
        company=job.company,
        location=job.location,
        employment_type=job.employment_type,
        stage=application.stage,
        date_applied=application.date_applied,
        deadline=application.deadline,
        follow_up_date=application.follow_up_date,
        notes=application.notes,
        important_contacts=application.important_contacts,
        next_action=application.next_action,
        created_at=application.created_at,
        updated_at=application.updated_at,
        stage_history=application.stage_history,
    )
