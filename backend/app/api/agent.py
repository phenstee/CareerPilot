from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.agent import (
    AgentActionProposalResponse,
    AgentConversationResponse,
    AgentMessageCreate,
    AgentProposalDecision,
    AgentRunResponse,
)
from app.services.agent_service import (
    AgentConversationNotFoundError,
    AgentProposalAlreadyResolvedError,
    AgentProposalExecutionError,
    AgentProposalNotFoundError,
    AgentService,
)

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/conversations", response_model=list[AgentConversationResponse])
def list_conversations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AgentConversationResponse]:
    return AgentService(db).list_conversations(current_user.id)


@router.get("/conversations/{conversation_id}", response_model=AgentConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AgentConversationResponse:
    try:
        return AgentService(db).get_conversation(current_user.id, conversation_id)
    except AgentConversationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent conversation not found.") from exc


@router.post("/messages", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: AgentMessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AgentRunResponse:
    try:
        return AgentService(db).run(current_user.id, payload)
    except AgentConversationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent conversation not found.") from exc


@router.post("/proposals/{proposal_id}/approve", response_model=AgentActionProposalResponse)
def approve_proposal(
    proposal_id: str,
    payload: AgentProposalDecision,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AgentActionProposalResponse:
    service = AgentService(db)
    try:
        return service.approve_proposal(current_user.id, proposal_id, note=payload.note)
    except AgentProposalNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent proposal not found.") from exc
    except AgentProposalAlreadyResolvedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent proposal is already resolved.") from exc
    except AgentProposalExecutionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/proposals/{proposal_id}/reject", response_model=AgentActionProposalResponse)
def reject_proposal(
    proposal_id: str,
    payload: AgentProposalDecision,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AgentActionProposalResponse:
    try:
        return AgentService(db).reject_proposal(current_user.id, proposal_id, note=payload.note)
    except AgentProposalNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent proposal not found.") from exc
    except AgentProposalAlreadyResolvedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent proposal is already resolved.") from exc
