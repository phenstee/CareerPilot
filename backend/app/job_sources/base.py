from abc import ABC, abstractmethod

from app.schemas.job_search import JobSearchFilters, NormalizedJobResult


class JobSourceError(Exception):
    pass


class BaseJobSourceProvider(ABC):
    name: str

    @abstractmethod
    def search(self, filters: JobSearchFilters, keywords: list[str]) -> list[NormalizedJobResult]:
        pass
