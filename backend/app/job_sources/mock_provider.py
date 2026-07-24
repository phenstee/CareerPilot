from datetime import UTC, datetime, timedelta

from app.job_sources.base import BaseJobSourceProvider
from app.schemas.job_search import JobSearchFilters, NormalizedJobResult


class MockJobSourceProvider(BaseJobSourceProvider):
    name = "mock"

    def search(self, filters: JobSearchFilters, keywords: list[str]) -> list[NormalizedJobResult]:
        now = datetime.now(UTC)
        jobs = [
            _job(
                "mock-ai-agent-intern",
                "AI Agent Engineering Intern",
                "Northstar AI",
                "Toronto, ON",
                "Hybrid",
                "Internship",
                "Internship",
                "Build Python, FastAPI, React, and LLM workflow tools for student users.",
                ["Python", "FastAPI", "React", "LLM APIs"],
                now - timedelta(days=2),
            ),
            _job(
                "mock-python-backend",
                "Remote Python Backend Intern",
                "Atlas Cloud",
                "Remote",
                "Remote",
                "Internship",
                "Internship",
                "Ship API integrations, PostgreSQL services, Docker workflows, and test coverage.",
                ["Python", "PostgreSQL", "Docker", "REST APIs"],
                now - timedelta(days=5),
            ),
            _job(
                "mock-full-stack-canada",
                "Full Stack AI Product Intern",
                "Signal Labs",
                "Waterloo, ON",
                "Hybrid",
                "Internship",
                "Internship",
                "Develop TypeScript, Next.js, React, and backend features for AI-powered products.",
                ["TypeScript", "Next.js", "React", "AI Products"],
                now - timedelta(days=8),
            ),
            _job(
                "mock-ml-coop",
                "Machine Learning Co-op",
                "VectorWorks",
                "Vancouver, BC",
                "Onsite",
                "Co-op",
                "Internship",
                "Support data pipelines, model evaluation, Python notebooks, and ML experiments.",
                ["Python", "Machine Learning", "Data Science", "SQL"],
                now - timedelta(days=14),
            ),
            _job(
                "mock-frontend-entry",
                "Junior Frontend Developer",
                "BrightDesk",
                "New York, NY",
                "Onsite",
                "Full-time",
                "Junior",
                "Create accessible React interfaces and collaborate with designers on product features.",
                ["React", "JavaScript", "Accessibility", "CSS"],
                now - timedelta(days=22),
            ),
        ]

        if filters.location:
            location = filters.location.lower()
            jobs = [
                job
                for job in jobs
                if location in job.location.lower()
                or (location in {"canada", "ca"} and any(region in job.location for region in ("ON", "BC")))
                or (location in {"united states", "usa", "us"} and any(region in job.location for region in ("NY", "CA", "WA")))
                or job.workplace_type == "Remote"
            ]
        if filters.workplace_types:
            jobs = [job for job in jobs if job.workplace_type in filters.workplace_types]
        if filters.employment_types:
            wanted = {value.lower() for value in filters.employment_types}
            jobs = [job for job in jobs if job.employment_type.lower() in wanted]
        if filters.experience_levels:
            jobs = [job for job in jobs if job.experience_level in filters.experience_levels]
        if filters.preferred_role:
            role = filters.preferred_role.lower()
            jobs = [job for job in jobs if role in job.title.lower() or any(part in job.title.lower() for part in role.split())]
        if keywords:
            keyword_set = {keyword.lower() for keyword in keywords}
            jobs = [
                job
                for job in jobs
                if keyword_set.intersection(skill.lower() for skill in job.skills)
                or any(keyword in job.description.lower() for keyword in keyword_set)
            ] or jobs

        return jobs


def _job(
    external_id: str,
    title: str,
    company: str,
    location: str,
    workplace_type: str,
    employment_type: str,
    experience_level: str,
    description: str,
    skills: list[str],
    posted_at: datetime,
) -> NormalizedJobResult:
    return NormalizedJobResult(
        external_id=external_id,
        title=title,
        company=company,
        location=location,
        workplace_type=workplace_type,
        employment_type=employment_type,
        experience_level=experience_level,
        source="Mock job source",
        source_url=f"https://example.com/mock-jobs/{external_id}",
        posted_at=posted_at,
        discovered_at=datetime.now(UTC),
        short_description=description[:220],
        description=description,
        requirements=skills,
        skills=skills,
        fit_label="Possible fit",
        profile_evidence=[],
        qualification_gaps=[],
        is_mock=True,
    )
