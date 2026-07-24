from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.agent import (
    AgentActionAuditLog,
    AgentActionProposal,
    AgentConversation,
    AgentMessage,
)


class AgentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_conversation(self, user_id: str, *, title: str = "Career agent chat") -> AgentConversation:
        conversation = AgentConversation(user_id=user_id, title=title)
        self.db.add(conversation)
        self.db.flush()
        return conversation

    def get_conversation_for_user(self, user_id: str, conversation_id: str) -> AgentConversation | None:
        statement = (
            select(AgentConversation)
            .options(
                selectinload(AgentConversation.messages),
                selectinload(AgentConversation.proposals).selectinload(AgentActionProposal.audit_logs),
            )
            .where(AgentConversation.user_id == user_id, AgentConversation.id == conversation_id)
        )
        return self.db.scalar(statement)

    def list_conversations_for_user(self, user_id: str) -> list[AgentConversation]:
        statement = (
            select(AgentConversation)
            .options(
                selectinload(AgentConversation.messages),
                selectinload(AgentConversation.proposals).selectinload(AgentActionProposal.audit_logs),
            )
            .where(AgentConversation.user_id == user_id)
            .order_by(AgentConversation.updated_at.desc())
        )
        return list(self.db.scalars(statement))

    def add_message(self, conversation: AgentConversation, *, role: str, content: str) -> AgentMessage:
        message = AgentMessage(conversation=conversation, role=role, content=content)
        self.db.add(message)
        self.db.flush()
        return message

    def add_proposal(
        self,
        conversation: AgentConversation,
        *,
        user_id: str,
        action_type: str,
        title: str,
        explanation: str,
        arguments: dict,
    ) -> AgentActionProposal:
        proposal = AgentActionProposal(
            conversation=conversation,
            user_id=user_id,
            action_type=action_type,
            title=title,
            explanation=explanation,
            arguments=arguments,
        )
        self.db.add(proposal)
        self.db.flush()
        return proposal

    def get_proposal_for_user(self, user_id: str, proposal_id: str) -> AgentActionProposal | None:
        statement = (
            select(AgentActionProposal)
            .options(selectinload(AgentActionProposal.audit_logs))
            .where(AgentActionProposal.user_id == user_id, AgentActionProposal.id == proposal_id)
        )
        return self.db.scalar(statement)

    def add_audit_log(self, proposal: AgentActionProposal, *, user_id: str, event: str, note: str = "") -> None:
        self.db.add(
            AgentActionAuditLog(
                proposal=proposal,
                user_id=user_id,
                event=event,
                note=note,
            )
        )

    def save(self) -> None:
        self.db.commit()
