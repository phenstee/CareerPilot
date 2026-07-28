from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEVELOPMENT_JWT_SECRET = "change-me-in-development"
SUPPORTED_AI_PROVIDERS = {"mock", "openai"}
SUPPORTED_SAMESITE_VALUES = {"lax", "strict", "none"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://careerpilot:careerpilot@db:5432/careerpilot"
    jwt_secret: str = DEVELOPMENT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    auth_cookie_name: str = "careerpilot_session"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    openai_api_key: str | None = None
    ai_provider: str = "mock"
    openai_model: str = "gpt-4o-mini"
    openai_timeout_seconds: float = Field(default=20.0, ge=1.0, le=120.0)
    openai_max_retries: int = Field(default=1, ge=0, le=3)
    greenhouse_boards_raw: str = Field(default="", alias="GREENHOUSE_BOARDS")
    frontend_origin: str = "http://localhost:3000"
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def greenhouse_board_tokens(self) -> list[str]:
        return [token.strip() for token in self.greenhouse_boards_raw.split(",") if token.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in {"production", "prod"}

    @model_validator(mode="after")
    def validate_runtime_configuration(self) -> "Settings":
        provider_name = self.ai_provider.strip().lower()
        if provider_name not in SUPPORTED_AI_PROVIDERS:
            raise ValueError(f"Unsupported AI_PROVIDER '{self.ai_provider}'. Use one of: mock, openai.")
        self.ai_provider = provider_name

        if provider_name == "openai" and not self.openai_api_key:
            raise ValueError("AI_PROVIDER=openai requires OPENAI_API_KEY.")

        samesite = self.auth_cookie_samesite.strip().lower()
        if samesite not in SUPPORTED_SAMESITE_VALUES:
            raise ValueError("AUTH_COOKIE_SAMESITE must be one of: lax, strict, none.")
        self.auth_cookie_samesite = samesite
        if samesite == "none" and not self.auth_cookie_secure:
            raise ValueError("AUTH_COOKIE_SAMESITE=none requires AUTH_COOKIE_SECURE=true.")

        if "*" in self.cors_origins:
            raise ValueError("Wildcard CORS origins are not allowed while credentials are enabled.")

        if self.is_production:
            if not self.database_url.strip():
                raise ValueError("DATABASE_URL is required in production.")
            if self.jwt_secret == DEVELOPMENT_JWT_SECRET or len(self.jwt_secret) < 32:
                raise ValueError("Production JWT_SECRET must be a strong secret and cannot use the development default.")
            if not self.auth_cookie_secure:
                raise ValueError("AUTH_COOKIE_SECURE=true is required in production.")
            if not self.cors_origins:
                raise ValueError("CORS_ORIGINS must list the deployed frontend origin in production.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
