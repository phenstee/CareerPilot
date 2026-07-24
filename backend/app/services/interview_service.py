from sqlalchemy.orm import Session

from app.ai.provider_factory import get_ai_provider
from app.models.interview import InterviewAnswer, InterviewQuestion, InterviewSession
from app.repositories.application_repository import ApplicationRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.interview import (
    InterviewAnswerCreate,
    InterviewAnswerResponse,
    InterviewFeedbackOutput,
    InterviewGeneratedQuestion,
    InterviewSessionCreate,
    InterviewSessionListResponse,
    InterviewSessionResponse,
)


class InterviewApplicationNotFoundError(Exception):
    pass


class InterviewSessionNotFoundError(Exception):
    pass


class InterviewQuestionNotFoundError(Exception):
    pass


class InterviewService:
    def __init__(self, db: Session) -> None:
        self.repository = InterviewRepository(db)
        self.application_repository = ApplicationRepository(db)
        self.profile_repository = ProfileRepository(db)
        self.resume_repository = ResumeRepository(db)

    def list_sessions(
        self,
        user_id: str,
        application_id: str,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> InterviewSessionListResponse:
        if self.application_repository.get_for_user(user_id, application_id) is None:
            raise InterviewApplicationNotFoundError
        sessions, total = self.repository.list_for_application(user_id, application_id, skip=skip, limit=limit)
        return InterviewSessionListResponse(
            items=[serialize_session(session) for session in sessions],
            total=total,
        )

    def create_session(self, user_id: str, payload: InterviewSessionCreate) -> InterviewSessionResponse:
        application = self.application_repository.get_for_user(user_id, payload.application_id)
        if application is None:
            raise InterviewApplicationNotFoundError

        profile = self.profile_repository.get_by_user_id(user_id)
        resume = self.resume_repository.get_by_user_id(user_id)
        provider = get_ai_provider()
        output = provider.generate_interview_prep(
            application=application,
            job=application.job_posting,
            profile=profile,
            resume=resume,
        )
        session = InterviewSession(
            user_id=user_id,
            application_id=application.id,
            provider=provider.name,
            preparation_plan=output.preparation_plan,
            strong_topics=output.strong_topics,
            weak_areas=output.weak_areas,
            questions=[
                InterviewQuestion(
                    category=question.category,
                    question_text=question.question_text,
                    rationale=question.rationale,
                    display_order=index,
                )
                for index, question in enumerate(_flatten_questions(output), start=1)
            ],
        )
        return serialize_session(self.repository.save_session(session))

    def get_session(self, user_id: str, session_id: str) -> InterviewSessionResponse:
        return serialize_session(self._get_owned_session(user_id, session_id))

    def answer_question(
        self,
        user_id: str,
        session_id: str,
        question_id: str,
        payload: InterviewAnswerCreate,
    ) -> InterviewAnswerResponse:
        session = self._get_owned_session(user_id, session_id)
        question = next((item for item in session.questions if item.id == question_id), None)
        if question is None:
            raise InterviewQuestionNotFoundError

        profile = self.profile_repository.get_by_user_id(user_id)
        resume = self.resume_repository.get_by_user_id(user_id)
        provider = get_ai_provider()
        feedback = provider.evaluate_interview_answer(
            application=session.application,
            job=session.application.job_posting,
            profile=profile,
            resume=resume,
            question=question.question_text,
            answer=payload.answer_text,
        )
        answer = InterviewAnswer(
            question_id=question.id,
            user_id=user_id,
            answer_text=payload.answer_text,
            feedback=feedback.model_dump(),
            provider=provider.name,
        )
        return serialize_answer(self.repository.save_answer(answer))

    def _get_owned_session(self, user_id: str, session_id: str) -> InterviewSession:
        session = self.repository.get_for_user(user_id, session_id)
        if session is None:
            raise InterviewSessionNotFoundError
        return session


def _flatten_questions(output) -> list[InterviewGeneratedQuestion]:
    questions = [
        *output.behavioral_questions,
        *output.technical_questions,
        *output.job_description_questions,
        *output.projects_resume_questions,
    ]
    if questions:
        return questions
    return [
        InterviewGeneratedQuestion(
            category="behavioral",
            question_text="Tell me about a project or experience that prepared you for this role.",
            rationale="Fallback question used when the provider returned no generated questions.",
        )
    ]


def serialize_session(session: InterviewSession) -> InterviewSessionResponse:
    application = session.application
    job = application.job_posting
    return InterviewSessionResponse(
        id=session.id,
        application_id=session.application_id,
        job_title=job.title,
        company=job.company,
        provider=session.provider,
        preparation_plan=session.preparation_plan,
        strong_topics=session.strong_topics,
        weak_areas=session.weak_areas,
        questions=[serialize_question(question) for question in session.questions],
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def serialize_question(question: InterviewQuestion):
    return {
        "id": question.id,
        "category": question.category,
        "question_text": question.question_text,
        "rationale": question.rationale,
        "display_order": question.display_order,
        "answers": [serialize_answer(answer) for answer in question.answers],
        "created_at": question.created_at,
    }


def serialize_answer(answer: InterviewAnswer) -> InterviewAnswerResponse:
    return InterviewAnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        answer_text=answer.answer_text,
        feedback=InterviewFeedbackOutput.model_validate(answer.feedback),
        provider=answer.provider,
        created_at=answer.created_at,
    )
