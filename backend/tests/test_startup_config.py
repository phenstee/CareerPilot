import pytest
from pydantic import ValidationError

from app.core.config import DEVELOPMENT_JWT_SECRET, Settings


def test_application_imports_successfully() -> None:
    from app.main import app

    assert app is not None


def test_expected_routers_are_registered() -> None:
    from app.main import app

    paths = {route.path for route in app.routes}

    assert "/api/v1/health" in paths
    assert "/api/v1/ai/status" in paths
    assert "/api/v1/agents/application-draft" in paths
    assert "/api/v1/agents/role-analysis" in paths
    assert "/api/v1/agents/preparation-plan" in paths
    assert "/api/v1/interviews/sessions" in paths


def test_mock_mode_does_not_require_openai_key() -> None:
    settings = Settings(
        _env_file=None,
        ai_provider="mock",
        openai_api_key=None,
    )

    assert settings.ai_provider == "mock"
    assert settings.openai_api_key is None


def test_openai_mode_requires_openai_key() -> None:
    with pytest.raises(ValidationError, match="AI_PROVIDER=openai requires OPENAI_API_KEY"):
        Settings(
            _env_file=None,
            ai_provider="openai",
            openai_api_key=None,
        )


def test_production_rejects_development_jwt_secret() -> None:
    with pytest.raises(ValidationError, match="Production JWT_SECRET"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg://user:pass@db:5432/careerpilot",
            jwt_secret=DEVELOPMENT_JWT_SECRET,
            auth_cookie_secure=True,
            app_url="https://careerpilot.example",
            CORS_ORIGINS="https://careerpilot.example",
            ai_provider="mock",
        )


def test_production_rejects_insecure_cookies() -> None:
    with pytest.raises(ValidationError, match="AUTH_COOKIE_SECURE=true"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg://user:pass@db:5432/careerpilot",
            jwt_secret="a-secure-production-secret-value-123",
            auth_cookie_secure=False,
            app_url="https://careerpilot.example",
            CORS_ORIGINS="https://careerpilot.example",
            ai_provider="mock",
        )


def test_production_rejects_wildcard_cors_with_credentials() -> None:
    with pytest.raises(ValidationError, match="Wildcard CORS origins"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg://user:pass@db:5432/careerpilot",
            jwt_secret="a-secure-production-secret-value-123",
            auth_cookie_secure=True,
            app_url="https://careerpilot.example",
            CORS_ORIGINS="*",
            ai_provider="mock",
        )


def test_production_accepts_safe_mock_configuration() -> None:
    settings = Settings(
        _env_file=None,
        environment="production",
        database_url="postgresql+psycopg://user:pass@db:5432/careerpilot",
            jwt_secret="a-secure-production-secret-value-123",
            auth_cookie_secure=True,
            auth_cookie_samesite="lax",
            app_url="https://careerpilot.example",
            CORS_ORIGINS="https://careerpilot.example",
            ai_provider="mock",
    )

    assert settings.is_production
    assert settings.cors_origins == ["https://careerpilot.example"]
