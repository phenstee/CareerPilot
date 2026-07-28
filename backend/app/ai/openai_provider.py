import logging
from typing import TypeVar

from openai import OpenAI, OpenAIError
from pydantic import BaseModel

from app.ai.base import AIProviderError, BaseAIProvider
from app.ai.prompts import (
    build_application_draft_prompt,
    build_interview_answer_feedback_prompt,
    build_interview_prep_prompt,
    build_preparation_plan_prompt,
    build_resume_suggestions_prompt,
    build_role_analysis_prompt,
)
from app.core.config import settings
from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application
from app.schemas.analysis import ApplicationDraftOutput, PreparationPlanOutput, ResumeSuggestionsOutput, RoleAnalysisOutput
from app.schemas.interview import InterviewFeedbackOutput, InterviewPrepOutput

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class OpenAIProvider(BaseAIProvider):
    name = "openai"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise AIProviderError("OpenAI is not configured. Set OPENAI_API_KEY or use AI_PROVIDER=mock.")
        self.model_name = settings.openai_model
        self.client = OpenAI(
            api_key=settings.openai_api_key,
            timeout=settings.openai_timeout_seconds,
            max_retries=settings.openai_max_retries,
        )

    def generate_application_draft(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        application: Application | None,
    ) -> ApplicationDraftOutput:
        prompt = build_application_draft_prompt(job, profile, resume, application)
        return self._complete_structured(
            instructions="Return truthful job-application assistance as structured data.",
            prompt=prompt,
            schema=ApplicationDraftOutput,
        )

    def analyze_role(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> RoleAnalysisOutput:
        prompt = build_role_analysis_prompt(job, profile, resume)
        return self._complete_structured(
            instructions="Return a grounded role analysis as structured data.",
            prompt=prompt,
            schema=RoleAnalysisOutput,
        )

    def create_preparation_plan(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        role_analysis: RoleAnalysisOutput,
        application: Application | None,
    ) -> PreparationPlanOutput:
        prompt = build_preparation_plan_prompt(job, profile, resume, role_analysis, application)
        return self._complete_structured(
            instructions="Return a practical job-preparation plan as structured data.",
            prompt=prompt,
            schema=PreparationPlanOutput,
        )

    def suggest_resume_tailoring(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> ResumeSuggestionsOutput:
        prompt = build_resume_suggestions_prompt(job, profile, resume)
        return self._complete_structured(
            instructions="Return grounded resume-tailoring recommendations as structured data.",
            prompt=prompt,
            schema=ResumeSuggestionsOutput,
        )

    def generate_interview_prep(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> InterviewPrepOutput:
        prompt = build_interview_prep_prompt(application, job, profile, resume)
        return self._complete_structured(
            instructions="Return grounded interview-preparation content as structured data.",
            prompt=prompt,
            schema=InterviewPrepOutput,
        )

    def evaluate_interview_answer(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        question: str,
        answer: str,
    ) -> InterviewFeedbackOutput:
        prompt = build_interview_answer_feedback_prompt(application, job, profile, resume, question, answer)
        return self._complete_structured(
            instructions="Return constructive interview-answer feedback as structured data.",
            prompt=prompt,
            schema=InterviewFeedbackOutput,
        )

    def _complete_structured(self, *, instructions: str, prompt: str, schema: type[T]) -> T:
        try:
            completion = self.client.beta.chat.completions.parse(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": instructions,
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=schema,
            )
            parsed = completion.choices[0].message.parsed
            if parsed is None:
                raise AIProviderError("The AI response could not be validated.")
            return parsed
        except AIProviderError:
            raise
        except OpenAIError as exc:
            logger.warning("openai_request_failed provider=openai model=%s error_type=%s", settings.openai_model, type(exc).__name__)
            raise AIProviderError("AI analysis is temporarily unavailable.") from exc
        except Exception as exc:
            logger.warning("openai_response_validation_failed provider=openai model=%s error_type=%s", settings.openai_model, type(exc).__name__)
            raise AIProviderError("The AI response could not be validated.") from exc
