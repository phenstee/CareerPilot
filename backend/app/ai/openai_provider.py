import json
from typing import TypeVar

from openai import OpenAI
from pydantic import BaseModel, ValidationError

from app.ai.base import AIProviderError, BaseAIProvider
from app.ai.prompts import (
    build_interview_answer_feedback_prompt,
    build_interview_prep_prompt,
    build_resume_suggestions_prompt,
)
from app.core.config import settings
from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application
from app.schemas.analysis import ResumeSuggestionsOutput
from app.schemas.interview import InterviewFeedbackOutput, InterviewPrepOutput

T = TypeVar("T", bound=BaseModel)


class OpenAIProvider(BaseAIProvider):
    name = "openai"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise AIProviderError("OpenAI is not configured. Set OPENAI_API_KEY or use AI_PROVIDER=mock.")
        self.client = OpenAI(api_key=settings.openai_api_key, timeout=20.0, max_retries=2)

    def suggest_resume_tailoring(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> ResumeSuggestionsOutput:
        prompt = build_resume_suggestions_prompt(job, profile, resume)
        return self._complete_structured(prompt, ResumeSuggestionsOutput)

    def generate_interview_prep(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> InterviewPrepOutput:
        prompt = build_interview_prep_prompt(application, job, profile, resume)
        return self._complete_structured(prompt, InterviewPrepOutput)

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
        return self._complete_structured(prompt, InterviewFeedbackOutput)

    def _complete_structured(self, prompt: str, schema: type[T]) -> T:
        try:
            completion = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Return only JSON that conforms to the requested schema.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema.__name__,
                        "schema": schema.model_json_schema(),
                        "strict": True,
                    },
                },
            )
            content = completion.choices[0].message.content or "{}"
            return schema.model_validate(json.loads(content))
        except (json.JSONDecodeError, ValidationError) as exc:
            raise AIProviderError("The AI response could not be validated.") from exc
        except Exception as exc:
            raise AIProviderError("AI analysis is temporarily unavailable.") from exc
