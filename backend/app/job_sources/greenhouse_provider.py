from datetime import UTC, datetime
from urllib.parse import urlparse

import httpx

from app.job_sources.base import BaseJobSourceProvider, JobSourceError
from app.schemas.job_search import JobSearchFilters, NormalizedJobResult


class GreenhouseJobSourceProvider(BaseJobSourceProvider):
    name = "greenhouse"

    def __init__(self, board_tokens: list[str]) -> None:
        self.board_tokens = board_tokens

    def search(self, filters: JobSearchFilters, keywords: list[str]) -> list[NormalizedJobResult]:
        if not self.board_tokens:
            return []

        results: list[NormalizedJobResult] = []
        with httpx.Client(timeout=8.0, follow_redirects=True) as client:
            for token in self.board_tokens[:5]:
                _validate_board_token(token)
                try:
                    response = client.get(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs")
                    response.raise_for_status()
                except httpx.HTTPError as exc:
                    raise JobSourceError(f"Greenhouse board {token} is unavailable.") from exc
                for item in response.json().get("jobs", [])[:25]:
                    title = str(item.get("title") or "")
                    location = str((item.get("location") or {}).get("name") or "")
                    source_url = str(item.get("absolute_url") or "")
                    if not title or not _is_safe_public_url(source_url):
                        continue
                    haystack = f"{title} {location}".lower()
                    if filters.preferred_role and filters.preferred_role.lower() not in haystack:
                        continue
                    if keywords and not any(keyword.lower() in haystack for keyword in keywords):
                        continue
                    results.append(
                        NormalizedJobResult(
                            external_id=f"greenhouse-{token}-{item.get('id')}",
                            title=title,
                            company=token,
                            location=location,
                            workplace_type=_infer_workplace(location),
                            employment_type="",
                            experience_level="",
                            source="Greenhouse public board",
                            source_url=source_url,
                            posted_at=None,
                            discovered_at=datetime.now(UTC),
                            short_description="Open role from a public Greenhouse board.",
                            description="Open role from a public Greenhouse board. Open the original posting for full details.",
                            requirements=[],
                            skills=[],
                            match_score=0,
                            match_reasons=[],
                            qualification_gaps=[],
                            is_mock=False,
                        )
                    )
        return results


def _validate_board_token(token: str) -> None:
    if not token.replace("-", "").replace("_", "").isalnum():
        raise JobSourceError("Invalid Greenhouse board token.")


def _is_safe_public_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and parsed.netloc.endswith("greenhouse.io")


def _infer_workplace(location: str) -> str:
    lowered = location.lower()
    if "remote" in lowered:
        return "Remote"
    if "hybrid" in lowered:
        return "Hybrid"
    return "Onsite"
