from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.ai_status import AIStatusResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatusResponse)
def get_ai_status(current_user: Annotated[User, Depends(get_current_user)]) -> AIStatusResponse:
    return AIStatusResponse(
        provider=settings.ai_provider.lower().strip(),
        model=settings.openai_model if settings.ai_provider.lower().strip() == "openai" else "mock-deterministic",
        api_key_configured=bool(settings.openai_api_key),
    )
