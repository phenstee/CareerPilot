from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.agent import AGENT_ACTION_TYPES
from app.models.tracker import APPLICATION_STAGES


class AgentMessageCreate(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        return value.strip()


class AgentProposalDecision(BaseModel):
    note: str = Field(default="", max_length=500)

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str) -> str:
        return value.strip()


class UpdateApplicationStageArgs(BaseModel):
    application_id: str
    stage: str

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in APPLICATION_STAGES:
            raise ValueError("Choose a valid application stage.")
        return cleaned


class SetFollowUpDateArgs(BaseModel):
    application_id: str
    follow_up_date: str | None


class SetApplicationNextActionArgs(BaseModel):
    application_id: str
    next_action: str = Field(min_length=1, max_length=500)

    @field_validator("next_action")
    @classmethod
    def clean_next_action(cls, value: str) -> str:
        return value.strip()


class AgentAuditLogResponse(BaseModel):
    id: str
    proposal_id: str
    event: Literal["proposed", "approved", "rejected", "executed"]
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentActionProposalResponse(BaseModel):
    id: str
    conversation_id: str
    action_type: Literal[
        "update_application_stage",
        "set_follow_up_date",
        "set_application_next_action",
    ]
    title: str
    explanation: str
    arguments: dict
    status: Literal["proposed", "approved", "rejected", "executed"]
    created_at: datetime
    updated_at: datetime
    executed_at: datetime | None
    audit_logs: list[AgentAuditLogResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AgentMessageResponse(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[AgentMessageResponse]
    proposals: list[AgentActionProposalResponse]

    model_config = {"from_attributes": True}


class AgentRunResponse(BaseModel):
    conversation: AgentConversationResponse
    assistant_message: AgentMessageResponse
    proposals: list[AgentActionProposalResponse] = Field(default_factory=list)
    allowed_tools: list[str] = Field(default_factory=lambda: list(AGENT_ACTION_TYPES))
