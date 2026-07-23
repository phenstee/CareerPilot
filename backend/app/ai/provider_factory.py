from app.ai.base import AIProviderError, BaseAIProvider
from app.ai.mock_provider import MockAIProvider
from app.ai.openai_provider import OpenAIProvider
from app.core.config import settings


def get_ai_provider() -> BaseAIProvider:
    provider_name = settings.ai_provider.lower().strip()
    if provider_name == "mock":
        return MockAIProvider()
    if provider_name == "openai":
        return OpenAIProvider()
    raise AIProviderError(f"Unsupported AI provider: {settings.ai_provider}")
