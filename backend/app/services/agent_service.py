from datetime import UTC, date, datetime
import re

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.agent import AgentActionProposal, AgentConversation
from app.models.tracker import APPLICATION_STAGES, Application
from app.repositories.agent_repository import AgentRepository
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.agent import (
    AgentActionProposalResponse,
    AgentConversationResponse,
    AgentMessageCreate,
    AgentRunResponse,
    SetApplicationNextActionArgs,
    SetFollowUpDateArgs,
    UpdateApplicationStageArgs,
)
from app.schemas.application import ApplicationUpdate
from app.services.application_service import ApplicationNotFoundError, ApplicationService


class AgentConversationNotFoundError(Exception):
    pass


class AgentProposalNotFoundError(Exception):
    pass


class AgentProposalAlreadyResolvedError(Exception):
    pass


class AgentProposalExecutionError(Exception):
    pass


class AgentService:
    READ_ONLY_TOOLS = (
        "get_user_profile",
        "list_saved_jobs",
        "list_applications",
        "get_upcoming_deadlines",
        "get_previous_resume_suggestions",
    )
    MUTATION_TOOLS = (
        "propose_update_application_stage",
        "propose_set_follow_up_date",
        "propose_set_application_next_action",
    )

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AgentRepository(db)
        self.profile_repository = ProfileRepository(db)
        self.job_repository = JobRepository(db)
        self.application_repository = ApplicationRepository(db)
        self.analysis_repository = AnalysisRepository(db)

    def list_conversations(self, user_id: str) -> list[AgentConversationResponse]:
        return [serialize_conversation(conversation) for conversation in self.repository.list_conversations_for_user(user_id)]

    def get_conversation(self, user_id: str, conversation_id: str) -> AgentConversationResponse:
        conversation = self.repository.get_conversation_for_user(user_id, conversation_id)
        if conversation is None:
            raise AgentConversationNotFoundError
        return serialize_conversation(conversation)

    def run(self, user_id: str, payload: AgentMessageCreate) -> AgentRunResponse:
        conversation = self._get_or_create_conversation(user_id, payload.conversation_id, payload.message)
        self.repository.add_message(conversation, role="user", content=payload.message)

        content, proposal_specs = self._plan_response(user_id, payload.message)
        assistant_message = self.repository.add_message(conversation, role="assistant", content=content)
        proposals = []
        for proposal_spec in proposal_specs:
            proposal = self.repository.add_proposal(conversation, user_id=user_id, **proposal_spec)
            self.repository.add_audit_log(proposal, user_id=user_id, event="proposed", note="Agent proposed an action.")
            proposals.append(proposal)

        self.repository.save()
        saved_conversation = self.repository.get_conversation_for_user(user_id, conversation.id)
        if saved_conversation is None:
            raise AgentConversationNotFoundError
        return AgentRunResponse(
            conversation=serialize_conversation(saved_conversation),
            assistant_message=assistant_message,
            proposals=[serialize_proposal(proposal) for proposal in proposals],
            allowed_tools=[*self.READ_ONLY_TOOLS, *self.MUTATION_TOOLS],
        )

    def approve_proposal(self, user_id: str, proposal_id: str, *, note: str = "") -> AgentActionProposalResponse:
        proposal = self._get_pending_proposal(user_id, proposal_id)
        proposal.status = "approved"
        self.repository.add_audit_log(proposal, user_id=user_id, event="approved", note=note)
        self._execute_proposal(user_id, proposal)
        proposal.status = "executed"
        proposal.executed_at = datetime.now(UTC)
        self.repository.add_audit_log(proposal, user_id=user_id, event="executed", note="Approved action executed.")
        self.repository.save()

        refreshed = self.repository.get_proposal_for_user(user_id, proposal_id)
        if refreshed is None:
            raise AgentProposalNotFoundError
        return serialize_proposal(refreshed)

    def reject_proposal(self, user_id: str, proposal_id: str, *, note: str = "") -> AgentActionProposalResponse:
        proposal = self._get_pending_proposal(user_id, proposal_id)
        proposal.status = "rejected"
        self.repository.add_audit_log(proposal, user_id=user_id, event="rejected", note=note)
        self.repository.save()

        refreshed = self.repository.get_proposal_for_user(user_id, proposal_id)
        if refreshed is None:
            raise AgentProposalNotFoundError
        return serialize_proposal(refreshed)

    def _get_or_create_conversation(
        self,
        user_id: str,
        conversation_id: str | None,
        first_message: str,
    ) -> AgentConversation:
        if conversation_id:
            conversation = self.repository.get_conversation_for_user(user_id, conversation_id)
            if conversation is None:
                raise AgentConversationNotFoundError
            return conversation

        title = first_message[:60] or "Career agent chat"
        return self.repository.create_conversation(user_id, title=title)

    def _plan_response(self, user_id: str, message: str) -> tuple[str, list[dict]]:
        lowered = message.lower()
        applications, _ = self.application_repository.list_for_user(user_id, limit=50)

        proposal = self._maybe_plan_application_mutation(lowered, applications)
        if proposal:
            return (
                "I found a safe application update. I created a proposal for you to review before anything changes.",
                [proposal],
            )

        if "deadline" in lowered or "due" in lowered:
            deadlines = self.application_repository.upcoming_deadlines(user_id, date.today(), limit=5)
            return self._summarize_deadlines(deadlines), []

        if "application" in lowered or "stage" in lowered:
            return self._summarize_applications(applications), []

        if "saved job" in lowered or "jobs" in lowered or "job list" in lowered:
            jobs, total = self.job_repository.list_for_user(user_id, limit=5)
            return self._summarize_jobs(jobs, total), []

        if "profile" in lowered or "skill" in lowered:
            profile = self.profile_repository.get_by_user_id(user_id)
            return self._summarize_profile(profile), []

        if "analysis" in lowered or "resume suggestion" in lowered:
            analyses, total = self.analysis_repository.list_for_user(
                user_id,
                analysis_type="resume_suggestions",
                limit=5,
            )
            return self._summarize_analyses(analyses, total), []

        return (
            "I can check your profile, saved jobs, applications, upcoming deadlines, and resume suggestions. "
            "For changes, ask me to update an application stage, set a follow-up date, or set a next action, and I will make a proposal first.",
            [],
        )

    def _maybe_plan_application_mutation(self, lowered: str, applications: list[Application]) -> dict | None:
        application = self._match_application(lowered, applications)
        if application is None:
            return None

        stage = self._extract_stage(lowered)
        if stage:
            args = UpdateApplicationStageArgs(application_id=application.id, stage=stage)
            return {
                "action_type": "update_application_stage",
                "title": f"Move {application.job_posting.company} to {stage}",
                "explanation": (
                    f"This will update the tracked stage for {application.job_posting.title} at "
                    f"{application.job_posting.company}."
                ),
                "arguments": args.model_dump(),
            }

        if "follow" in lowered:
            parsed_date = self._extract_iso_date(lowered)
            if parsed_date is None:
                return None
            args = SetFollowUpDateArgs(application_id=application.id, follow_up_date=parsed_date.isoformat())
            return {
                "action_type": "set_follow_up_date",
                "title": f"Set follow-up for {application.job_posting.company}",
                "explanation": (
                    f"This will set the follow-up date for {application.job_posting.title} at "
                    f"{application.job_posting.company} to {parsed_date.isoformat()}."
                ),
                "arguments": args.model_dump(),
            }

        if "next action" in lowered or "next step" in lowered:
            next_action = self._extract_next_action(lowered)
            if not next_action:
                return None
            args = SetApplicationNextActionArgs(application_id=application.id, next_action=next_action)
            return {
                "action_type": "set_application_next_action",
                "title": f"Set next action for {application.job_posting.company}",
                "explanation": (
                    f"This will update the next action for {application.job_posting.title} at "
                    f"{application.job_posting.company}."
                ),
                "arguments": args.model_dump(),
            }

        return None

    def _execute_proposal(self, user_id: str, proposal: AgentActionProposal) -> None:
        try:
            if proposal.action_type == "update_application_stage":
                args = UpdateApplicationStageArgs.model_validate(proposal.arguments)
                application = self.application_repository.get_for_user(user_id, args.application_id)
                if application is None:
                    raise ApplicationNotFoundError
                ApplicationService(self.db).update_application(
                    user_id,
                    args.application_id,
                    ApplicationUpdate(
                        job_posting_id=application.job_posting_id,
                        stage=args.stage,
                        date_applied=application.date_applied,
                        deadline=application.deadline,
                        follow_up_date=application.follow_up_date,
                        notes=application.notes,
                        important_contacts=application.important_contacts,
                        next_action=application.next_action,
                    ),
                )
                return

            if proposal.action_type == "set_follow_up_date":
                args = SetFollowUpDateArgs.model_validate(proposal.arguments)
                application = self.application_repository.get_for_user(user_id, args.application_id)
                if application is None:
                    raise ApplicationNotFoundError
                ApplicationService(self.db).update_application(
                    user_id,
                    args.application_id,
                    ApplicationUpdate(
                        job_posting_id=application.job_posting_id,
                        stage=application.stage,
                        date_applied=application.date_applied,
                        deadline=application.deadline,
                        follow_up_date=date.fromisoformat(args.follow_up_date) if args.follow_up_date else None,
                        notes=application.notes,
                        important_contacts=application.important_contacts,
                        next_action=application.next_action,
                    ),
                )
                return

            if proposal.action_type == "set_application_next_action":
                args = SetApplicationNextActionArgs.model_validate(proposal.arguments)
                application = self.application_repository.get_for_user(user_id, args.application_id)
                if application is None:
                    raise ApplicationNotFoundError
                ApplicationService(self.db).update_application(
                    user_id,
                    args.application_id,
                    ApplicationUpdate(
                        job_posting_id=application.job_posting_id,
                        stage=application.stage,
                        date_applied=application.date_applied,
                        deadline=application.deadline,
                        follow_up_date=application.follow_up_date,
                        notes=application.notes,
                        important_contacts=application.important_contacts,
                        next_action=args.next_action,
                    ),
                )
                return
        except (ApplicationNotFoundError, ValidationError, ValueError) as exc:
            raise AgentProposalExecutionError("Unable to execute the approved proposal.") from exc

        raise AgentProposalExecutionError("Unsupported agent action.")

    def _get_pending_proposal(self, user_id: str, proposal_id: str) -> AgentActionProposal:
        proposal = self.repository.get_proposal_for_user(user_id, proposal_id)
        if proposal is None:
            raise AgentProposalNotFoundError
        if proposal.status != "proposed":
            raise AgentProposalAlreadyResolvedError
        return proposal

    def _match_application(self, lowered: str, applications: list[Application]) -> Application | None:
        for application in applications:
            company = application.job_posting.company.lower()
            title = application.job_posting.title.lower()
            if company and company in lowered:
                return application
            if title and title in lowered:
                return application
        return applications[0] if len(applications) == 1 else None

    def _extract_stage(self, lowered: str) -> str | None:
        for stage in APPLICATION_STAGES:
            if stage.lower() in lowered:
                return stage
        return None

    def _extract_iso_date(self, lowered: str) -> date | None:
        match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", lowered)
        if not match:
            return None
        try:
            return date.fromisoformat(match.group(0))
        except ValueError:
            return None

    def _extract_next_action(self, lowered: str) -> str:
        match = re.search(r"(?:next action|next step)\s*(?:to|as|is|:)?\s*(?P<action>.+)", lowered)
        if match:
            return match.group("action").strip(" .")
        return ""

    def _summarize_deadlines(self, deadlines: list[Application]) -> str:
        if not deadlines:
            return "You do not have any upcoming application deadlines saved."
        lines = [
            f"{application.deadline}: {application.job_posting.title} at {application.job_posting.company}"
            for application in deadlines
        ]
        return "Upcoming deadlines:\n" + "\n".join(lines)

    def _summarize_applications(self, applications: list[Application]) -> str:
        if not applications:
            return "You do not have any tracked applications yet."
        lines = [
            f"{application.job_posting.title} at {application.job_posting.company} is currently {application.stage}."
            for application in applications[:8]
        ]
        return "Tracked applications:\n" + "\n".join(lines)

    def _summarize_jobs(self, jobs: list, total: int) -> str:
        if not jobs:
            return "You do not have any saved jobs yet."
        lines = [f"{job.title} at {job.company} in {job.location or 'location not set'}." for job in jobs]
        suffix = f"\nShowing 5 of {total} saved jobs." if total > 5 else ""
        return "Saved jobs:\n" + "\n".join(lines) + suffix

    def _summarize_profile(self, profile) -> str:
        if profile is None:
            return "Your profile is empty. Add school, target roles, locations, skills, projects, and experience on the profile page."
        skills = [skill.name for skill in profile.skills[:8]]
        roles = ", ".join(profile.target_roles[:5]) or "no target roles saved"
        return (
            f"Your profile is for {profile.full_name or 'you'}, with target roles: {roles}. "
            f"Top saved skills: {', '.join(skills) if skills else 'none saved'}."
        )

    def _summarize_analyses(self, analyses: list, total: int) -> str:
        if not analyses:
            return "You do not have any resume suggestions saved yet."
        lines = [f"{analysis.job_posting.title} at {analysis.job_posting.company}" for analysis in analyses]
        suffix = f"\nShowing 5 of {total} analyses." if total > 5 else ""
        return "Resume suggestion analyses:\n" + "\n".join(lines) + suffix


def serialize_conversation(conversation: AgentConversation) -> AgentConversationResponse:
    return AgentConversationResponse.model_validate(conversation)


def serialize_proposal(proposal: AgentActionProposal) -> AgentActionProposalResponse:
    return AgentActionProposalResponse.model_validate(proposal)
