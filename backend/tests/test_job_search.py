from fastapi.testclient import TestClient

from app.schemas.job_search import JobSearchFilters, NormalizedJobResult
from app.services.job_search_service import dedupe_results, interpret_prompt, rank_and_filter_results


def _register(client: TestClient, email: str = "job-search@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Search Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _profile_payload() -> dict[str, object]:
    return {
        "full_name": "Search Student",
        "school": "University of Waterloo",
        "program": "Computer Science",
        "graduation_year": 2028,
        "target_roles": ["Software Engineer Intern"],
        "preferred_locations": ["Toronto, ON"],
        "technical_skills": ["Python", "React", "FastAPI"],
        "soft_skills": ["Communication"],
        "coursework": [],
        "career_goals": "",
        "projects": [],
        "experiences": [],
    }


def test_job_search_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/job-search/profile", json={})

    assert response.status_code == 401


def test_profile_based_search_ranks_results(client: TestClient) -> None:
    _register(client)
    client.put("/api/v1/profile", json=_profile_payload())

    response = client.post(
        "/api/v1/job-search/profile",
        json={
            "location": "Toronto",
            "workplace_types": ["Hybrid"],
            "employment_types": ["Internship"],
            "experience_levels": ["Internship"],
            "preferred_role": "AI",
            "date_posted": "Any time",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "profile"
    assert body["results"]
    assert body["results"][0]["fit_label"] in {"Strong fit", "Possible fit", "Stretch opportunity"}
    assert "match_score" not in body["results"][0]
    assert body["results"][0]["is_mock"] is True


def test_prompt_search_interprets_structured_filters(client: TestClient) -> None:
    _register(client)

    response = client.post(
        "/api/v1/job-search/prompt",
        json={
            "prompt": "Find remote Python backend internships in Canada that use FastAPI.",
            "use_profile_context": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["workplace_types"] == ["Remote"]
    assert "Internship" in body["filters"]["employment_types"]
    assert body["results"]


def test_job_search_limit_is_shared_across_search_modes(client: TestClient, monkeypatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "job_search_rate_limit_count", 1)
    monkeypatch.setattr(settings, "job_search_rate_limit_window_seconds", 3600)

    _register(client, "search-limit@example.com")
    first = client.post(
        "/api/v1/job-search/profile",
        json={
            "location": "Toronto",
            "workplace_types": ["Hybrid"],
            "employment_types": ["Internship"],
            "experience_levels": ["Internship"],
            "preferred_role": "AI",
            "date_posted": "Any time",
        },
    )
    second = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"] == "Too many requests. Please wait before trying again."
    assert "job-search" not in second.text


def test_ai_and_job_search_limits_are_independent(client: TestClient, monkeypatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "job_search_rate_limit_count", 1)
    monkeypatch.setattr(settings, "job_search_rate_limit_window_seconds", 3600)
    monkeypatch.setattr(settings, "ai_rate_limit_count", 1)
    monkeypatch.setattr(settings, "ai_rate_limit_window_seconds", 3600)

    _register(client, "search-ai-independent@example.com")
    job_search = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    )
    job = client.post(
        "/api/v1/jobs",
        json={
            "title": "Full Stack Intern",
            "company": "Atlas Labs",
            "location": "Toronto, ON",
            "job_url": None,
            "employment_type": "Internship",
            "description": "Build React, FastAPI, SQL, and Docker services.",
            "notes": "",
        },
    ).json()
    role = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]})
    second_search = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    )
    second_ai = client.post("/api/v1/agents/application-draft", json={"job_posting_id": job["id"]})

    assert job_search.status_code == 200
    assert role.status_code == 201
    assert second_search.status_code == 429
    assert second_ai.status_code == 429


def test_save_discovered_job_and_prevent_duplicates(client: TestClient) -> None:
    _register(client)
    search = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    )
    result = search.json()["results"][0]

    first = client.post("/api/v1/job-search/save", json={"result": result})
    assert first.status_code == 201
    assert first.json()["already_saved"] is False

    second = client.post("/api/v1/job-search/save", json={"result": result})
    assert second.status_code == 201
    assert second.json()["already_saved"] is True

    jobs = client.get("/api/v1/jobs")
    assert jobs.json()["total"] == 1


def test_saved_discovered_jobs_are_isolated_by_user(client: TestClient) -> None:
    _register(client, "search-owner@example.com")
    result = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    ).json()["results"][0]
    client.post("/api/v1/job-search/save", json={"result": result})
    client.post("/api/v1/auth/logout")

    _register(client, "search-other@example.com")
    assert client.get("/api/v1/jobs").json()["total"] == 0


def test_invalid_source_url_is_rejected(client: TestClient) -> None:
    _register(client)
    result = client.post(
        "/api/v1/job-search/prompt",
        json={"prompt": "Remote Python backend internships", "use_profile_context": False},
    ).json()["results"][0]
    result["source_url"] = "javascript:alert(1)"

    response = client.post("/api/v1/job-search/save", json={"result": result})
    assert response.status_code == 400


def test_prompt_conversion_ranking_and_deduping_helpers() -> None:
    filters, keywords = interpret_prompt("Remote Python backend internships in Canada")
    assert filters.workplace_types == ["Remote"]
    assert filters.location == "Canada"
    assert "Python" in keywords

    now = "2026-07-23T00:00:00Z"
    first = NormalizedJobResult(
        external_id="a",
        title="Python Backend Intern",
        company="Acme",
        location="Remote",
        workplace_type="Remote",
        employment_type="Internship",
        experience_level="Internship",
        source="Mock",
        source_url="https://example.com/a",
        posted_at=now,
        discovered_at=now,
        short_description="Python APIs",
        description="Python APIs",
        requirements=["Python"],
        skills=["Python"],
        fit_label="Possible fit",
        profile_evidence=[],
        qualification_gaps=[],
    )
    duplicate = first.model_copy(update={"external_id": "b"})
    deduped = dedupe_results([first, duplicate])
    assert len(deduped) == 1
    ranked = rank_and_filter_results(deduped, filters, ["Python"], None)
    assert ranked[0].fit_label in {"Strong fit", "Possible fit", "Stretch opportunity"}
    assert ranked[0].profile_evidence
