from pydantic import BaseModel


class AIStatusResponse(BaseModel):
    provider: str
    model: str | None
    api_key_configured: bool
