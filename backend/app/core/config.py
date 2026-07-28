from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://careerpilot:careerpilot@db:5432/careerpilot"
    jwt_secret: str = "change-me-in-development"
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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
