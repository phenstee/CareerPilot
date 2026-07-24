from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.job_sources.base import JobSourceError
from app.job_sources.factory import get_job_source_providers
from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.repositories.job_repository import JobRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.job import JobPostingCreate
from app.schemas.job_search import (
    JobSearchFilters,
    JobSearchResponse,
    NormalizedJobResult,
    ProfileJobSearchRequest,
    PromptJobSearchRequest,
    SaveDiscoveredJobRequest,
    SaveDiscoveredJobResponse,
)


class UnsafeSourceUrlError(Exception):
    pass


class JobSearchService:
    def __init__(self, db: Session) -> None:
        self.profile_repository = ProfileRepository(db)
        self.job_repository = JobRepository(db)

    def search_by_profile(self, user_id: str, payload: ProfileJobSearchRequest) -> JobSearchResponse:
        profile = self.profile_repository.get_by_user_id(user_id)
        profile_keywords = _profile_keywords(profile)
        filters = JobSearchFilters(**payload.model_dump())
        if not filters.preferred_role and profile and profile.target_roles:
            filters.preferred_role = profile.target_roles[0]
        if not filters.location and profile and profile.preferred_locations:
            filters.location = profile.preferred_locations[0]

        results, failures = self._search_sources(filters, profile_keywords)
        ranked = rank_and_filter_results(results, filters, profile_keywords, profile)
        profile_incomplete = _is_profile_incomplete(profile)
        warnings = []
        if profile_incomplete:
            warnings.append("Your profile is missing useful search details. Add skills, roles, projects, or locations for better matches.")
        return JobSearchResponse(
            mode="profile",
            filters=filters,
            strategy=_profile_strategy(profile, filters, profile_keywords),
            results=ranked,
            warnings=warnings,
            provider_failures=failures,
            profile_incomplete=profile_incomplete,
        )

    def search_by_prompt(self, user_id: str, payload: PromptJobSearchRequest) -> JobSearchResponse:
        profile = self.profile_repository.get_by_user_id(user_id) if payload.use_profile_context else None
        filters, prompt_keywords = interpret_prompt(payload.prompt)
        profile_keywords = _profile_keywords(profile)
        keywords = _dedupe(prompt_keywords + (profile_keywords[:8] if payload.use_profile_context else []))
        results, failures = self._search_sources(filters, keywords)
        ranked = rank_and_filter_results(results, filters, keywords, profile)
        return JobSearchResponse(
            mode="prompt",
            filters=filters,
            strategy=f"Converted the prompt into keywords: {', '.join(prompt_keywords) or 'general technology roles'}.",
            results=ranked,
            warnings=[],
            provider_failures=failures,
            profile_incomplete=False,
        )

    def save_discovered_job(self, user_id: str, payload: SaveDiscoveredJobRequest) -> SaveDiscoveredJobResponse:
        result = payload.result
        if not _is_safe_source_url(result.source_url):
            raise UnsafeSourceUrlError
        existing_jobs, _ = self.job_repository.list_for_user(user_id, limit=100)
        for job in existing_jobs:
            if _same_job(job, result):
                return SaveDiscoveredJobResponse(id=job.id, already_saved=True)

        notes = "\n".join(
            [
                f"Discovered via {result.source}.",
                f"Fit label: {result.fit_label}",
                "Relevant profile evidence:",
                *[f"- {reason}" for reason in result.profile_evidence],
                "Possible gaps:",
                *[f"- {gap}" for gap in result.qualification_gaps],
            ]
        )
        job = JobPosting(
            user_id=user_id,
            **JobPostingCreate(
                title=result.title,
                company=result.company,
                location=result.location,
                job_url=result.source_url,
                employment_type=result.employment_type,
                description=result.description,
                notes=notes,
            ).model_dump(),
        )
        saved = self.job_repository.create(job)
        return SaveDiscoveredJobResponse(id=saved.id, already_saved=False)

    def _search_sources(
        self, filters: JobSearchFilters, keywords: list[str]
    ) -> tuple[list[NormalizedJobResult], list[str]]:
        results: list[NormalizedJobResult] = []
        failures: list[str] = []
        for provider in get_job_source_providers():
            try:
                results.extend(provider.search(filters, keywords))
            except JobSourceError as exc:
                failures.append(str(exc))
        return dedupe_results(results), failures


def interpret_prompt(prompt: str) -> tuple[JobSearchFilters, list[str]]:
    lowered = prompt.lower()
    workplace_types = []
    if "remote" in lowered:
        workplace_types.append("Remote")
    if "hybrid" in lowered:
        workplace_types.append("Hybrid")
    if "onsite" in lowered or "on-site" in lowered:
        workplace_types.append("Onsite")

    employment_types = []
    if "intern" in lowered or "internship" in lowered:
        employment_types.append("Internship")
    if "co-op" in lowered or "coop" in lowered:
        employment_types.append("Co-op")
    if "full-time" in lowered or "full time" in lowered:
        employment_types.append("Full-time")

    experience_levels = []
    if "entry" in lowered or "new grad" in lowered:
        experience_levels.append("Entry-level")
    if "intern" in lowered or "co-op" in lowered or "student" in lowered:
        experience_levels.append("Internship")
    if "junior" in lowered:
        experience_levels.append("Junior")

    location = ""
    for candidate in ("Canada", "United States", "Toronto", "Waterloo", "Vancouver", "New York", "San Francisco", "Remote"):
        if candidate.lower() in lowered:
            location = candidate
            break

    role = ""
    for candidate in ("AI engineering", "full-stack", "backend", "frontend", "machine learning", "software engineering"):
        if candidate in lowered:
            role = candidate.title()
            break

    keywords = [
        keyword
        for keyword in (
            "Python",
            "FastAPI",
            "React",
            "LLM APIs",
            "Machine Learning",
            "TypeScript",
            "Backend",
            "Frontend",
            "AI",
            "SQL",
        )
        if keyword.lower() in lowered
    ]
    return (
        JobSearchFilters(
            location=location,
            workplace_types=workplace_types,
            employment_types=employment_types,
            experience_levels=experience_levels,
            preferred_role=role,
            date_posted="Any time",
        ),
        keywords,
    )


def rank_and_filter_results(
    results: list[NormalizedJobResult],
    filters: JobSearchFilters,
    keywords: list[str],
    profile: CareerProfile | None,
) -> list[NormalizedJobResult]:
    profile_keywords = set(_profile_keywords(profile))
    search_keywords = {keyword.lower() for keyword in keywords}
    ranked: list[tuple[int, NormalizedJobResult]] = []
    for result in results:
        score = 35
        reasons: list[str] = []
        gaps: list[str] = []
        title_text = result.title.lower()
        skill_set = {skill.lower() for skill in result.skills}

        overlap = skill_set.intersection(profile_keywords).union(skill_set.intersection(search_keywords))
        if overlap:
            score += min(30, len(overlap) * 8)
            reasons.append(f"Skill overlap: {', '.join(sorted(overlap))}.")
        else:
            gaps.append("No strong skill overlap was detected from your profile or prompt.")

        if filters.preferred_role and any(part in title_text for part in filters.preferred_role.lower().split()):
            score += 15
            reasons.append("The title aligns with the requested role category.")
        if filters.location and (
            filters.location.lower() in result.location.lower() or result.workplace_type == "Remote"
        ):
            score += 10
            reasons.append("The location or remote status matches your search.")
        if filters.employment_types and result.employment_type in filters.employment_types:
            score += 8
            reasons.append("The employment type matches your filter.")
        if filters.workplace_types and result.workplace_type in filters.workplace_types:
            score += 8
            reasons.append("The workplace type matches your filter.")
        if filters.experience_levels and result.experience_level in filters.experience_levels:
            score += 8
            reasons.append("The experience level matches your filter.")
        if result.posted_at and result.posted_at >= datetime.now(UTC) - timedelta(days=7):
            score += 5
            reasons.append("The role was posted recently.")

        missing = [skill for skill in result.skills if skill.lower() not in profile_keywords]
        gaps.extend([f"Profile does not clearly show {skill}." for skill in missing[:4]])
        score = min(100, score)
        if score >= 75:
            result.fit_label = "Strong fit"
        elif score >= 52:
            result.fit_label = "Possible fit"
        else:
            result.fit_label = "Stretch opportunity"
        result.profile_evidence = reasons or ["The role matched the broad search criteria."]
        result.qualification_gaps = gaps[:5]
        ranked.append((score, result))
    return [result for _, result in sorted(ranked, key=lambda item: item[0], reverse=True)]


def dedupe_results(results: list[NormalizedJobResult]) -> list[NormalizedJobResult]:
    seen: set[str] = set()
    deduped: list[NormalizedJobResult] = []
    for result in results:
        key = (result.source_url or f"{result.company}:{result.title}:{result.location}").lower()
        if key not in seen:
            deduped.append(result)
            seen.add(key)
    return deduped


def _profile_keywords(profile: CareerProfile | None) -> list[str]:
    if profile is None:
        return []
    values = [skill.name for skill in profile.skills]
    values.extend(profile.target_roles)
    for project in profile.projects:
        values.extend(project.technologies)
        values.extend(project.name.split())
    return [value.lower() for value in _dedupe(values) if value]


def _profile_strategy(profile: CareerProfile | None, filters: JobSearchFilters, keywords: list[str]) -> str:
    if profile is None:
        return "No saved profile was available, so CareerPilot used only the selected filters."
    return (
        "Searched for roles using saved target roles, preferred locations, and skills. "
        f"Key signals: {', '.join(keywords[:8]) or 'no profile keywords saved'}. "
        f"Primary role filter: {filters.preferred_role or 'not set'}."
    )


def _is_profile_incomplete(profile: CareerProfile | None) -> bool:
    if profile is None:
        return True
    return not profile.target_roles or not profile.preferred_locations or not profile.skills


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = value.strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            result.append(cleaned)
            seen.add(key)
    return result


def _is_safe_source_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def _same_job(job: JobPosting, result: NormalizedJobResult) -> bool:
    if job.job_url and job.job_url == result.source_url:
        return True
    return (
        job.title.lower() == result.title.lower()
        and job.company.lower() == result.company.lower()
        and job.location.lower() == result.location.lower()
    )
