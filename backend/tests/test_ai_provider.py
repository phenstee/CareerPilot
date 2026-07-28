from types import SimpleNamespace

import pytest

from app.ai.base import AIProviderError
from app.ai.mock_provider import MockAIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.provider_factory import get_ai_provider
from app.core.config import settings
from app.schemas.analysis import ApplicationDraftOutput


def test_provider_factory_returns_mock(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ai_provider", "mock")

    provider = get_ai_provider()

    assert isinstance(provider, MockAIProvider)


def test_provider_factory_returns_openai(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ai_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "sk-test")

    provider = get_ai_provider()

    assert isinstance(provider, OpenAIProvider)
    assert provider.name == "openai"


def test_openai_provider_requires_key(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ai_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", None)

    with pytest.raises(AIProviderError, match="OpenAI is not configured"):
        get_ai_provider()


def test_openai_structured_parse_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", "sk-test")
    parsed = ApplicationDraftOutput(application_summary="Summary")

    provider = OpenAIProvider()
    provider.client = _client_with_parsed(parsed)

    result = provider._complete_structured(
        instructions="Return structured data.",
        prompt="Prompt",
        schema=ApplicationDraftOutput,
    )

    assert result.application_summary == "Summary"


def test_openai_missing_parsed_output_raises_provider_error(monkeypatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", "sk-test")
    provider = OpenAIProvider()
    provider.client = _client_with_parsed(None)

    with pytest.raises(AIProviderError, match="could not be validated"):
        provider._complete_structured(
            instructions="Return structured data.",
            prompt="Prompt",
            schema=ApplicationDraftOutput,
        )


def test_openai_sdk_failure_raises_safe_provider_error(monkeypatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", "sk-test-secret")
    provider = OpenAIProvider()
    provider.client = _failing_client(RuntimeError("sk-test-secret leaked"))

    with pytest.raises(AIProviderError) as error:
        provider._complete_structured(
            instructions="Return structured data.",
            prompt="Prompt",
            schema=ApplicationDraftOutput,
        )

    assert "sk-test-secret" not in str(error.value)


def _client_with_parsed(parsed):
    message = SimpleNamespace(parsed=parsed)
    choice = SimpleNamespace(message=message)
    completion = SimpleNamespace(choices=[choice])
    parser = SimpleNamespace(parse=lambda **_kwargs: completion)
    return SimpleNamespace(beta=SimpleNamespace(chat=SimpleNamespace(completions=parser)))


def _failing_client(error: Exception):
    def raise_error(**_kwargs):
        raise error

    parser = SimpleNamespace(parse=raise_error)
    return SimpleNamespace(beta=SimpleNamespace(chat=SimpleNamespace(completions=parser)))
