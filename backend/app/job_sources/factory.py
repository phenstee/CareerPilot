from app.core.config import settings
from app.job_sources.base import BaseJobSourceProvider
from app.job_sources.greenhouse_provider import GreenhouseJobSourceProvider
from app.job_sources.mock_provider import MockJobSourceProvider


def get_job_source_providers() -> list[BaseJobSourceProvider]:
    providers: list[BaseJobSourceProvider] = [MockJobSourceProvider()]
    if settings.greenhouse_board_tokens:
        providers.append(GreenhouseJobSourceProvider(settings.greenhouse_board_tokens))
    return providers
