from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.ai.base import AIProviderError
from app.models.analysis import JobAnalysis


def _register(client: TestClient, email: str = "analysis@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Analysis Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _profile_payload() -> dict[str, object]:
    return {
        "full_name": "Analysis Student",
        "school": "University of Waterloo",
        "program": "Computer Science",
        "graduation_year": 2028,
        "target_roles": ["Software Engineer Intern"],
        "preferred_locations": ["Toronto, ON"],
        "technical_skills": ["Python", "React", "FastAPI"],
        "soft_skills": ["Communication"],
        "coursework": ["Data Structures"],
        "career_goals": "",
        "projects": [
            {
                "name": "Career Tracker",
                "description": "Built React and FastAPI features.",
                "technologies": ["React", "FastAPI"],
                "link": None,
                "start_date": None,
                "end_date": None,
            }
        ],
        "experiences": [],
    }


def _job_payload() -> dict[str, str | None]:
    return {
        "title": "Full Stack Intern",
        "company": "Atlas Labs",
        "location": "Toronto, ON",
        "job_url": None,
        "employment_type": "Internship",
        "description": "Build React, FastAPI, SQL, and Docker services.",
        "notes": "",
    }


def test_mock_resume_suggestions_are_stored(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr("app.services.resume_service.extract_pdf_text", lambda contents: "Python\nReact\nFastAPI project")
    _register(client)
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    client.post(
        "/api/v1/resume",
        files={"file": ("resume.pdf", b"%PDF fake bytes", "application/pdf")},
    )
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    suggestions = client.post("/api/v1/analyses/resume-suggestions", json={"job_posting_id": job["id"]})
    assert suggestions.status_code == 201
    assert suggestions.json()["analysis_type"] == "resume_suggestions"
    assert suggestions.json()["is_stale"] is False
    assert "match_score" not in suggestions.json()
    assert "React" in suggestions.json()["result"]["keywords"]
    assert suggestions.json()["result"]["suggested_additions"]
    assert suggestions.json()["result"]["less_important_items"]

    listing = client.get("/api/v1/analyses", params={"job_posting_id": job["id"]})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["is_stale"] is False


def test_analysis_requires_owned_job(client: TestClient) -> None:
    _register(client, "analysis-owner@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    client.post("/api/v1/auth/logout")

    _register(client, "analysis-other@example.com")
    response = client.post("/api/v1/analyses/resume-suggestions", json={"job_posting_id": job["id"]})
    assert response.status_code == 404


def test_application_draft_role_analysis_and_preparation_plan_are_stored(client: TestClient) -> None:
    _register(client, "agents@example.com")
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    draft = client.post("/api/v1/agents/application-draft", json={"job_posting_id": job["id"]})
    assert draft.status_code == 201
    assert draft.json()["analysis_type"] == "application_draft"
    assert draft.json()["provider"] == "mock"
    assert draft.json()["provider_model"] == "mock-deterministic"
    assert draft.json()["result"]["cover_letter"]
    assert draft.json()["result"]["autofill_preview"]
    assert "Career Tracker" in draft.json()["result"]["emphasis"][0]["evidence"]

    role = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]})
    assert role.status_code == 201
    role_json = role.json()
    assert role_json["analysis_type"] == "role_analysis"
    assert role_json["result"]["role_summary"]
    assert role_json["result"]["preparation_priorities"]

    plan = client.post(
        "/api/v1/agents/preparation-plan",
        json={"job_posting_id": job["id"], "role_analysis_id": role_json["id"]},
    )
    assert plan.status_code == 201
    assert plan.json()["analysis_type"] == "preparation_plan"
    assert plan.json()["is_stale"] is False
    assert plan.json()["source_role_analysis_id"] == role_json["id"]
    assert plan.json()["result"]["completion_checklist"]

    listing = client.get("/api/v1/analyses", params={"job_posting_id": job["id"]})
    assert listing.status_code == 200
    assert listing.json()["total"] == 3


def test_analysis_is_stale_after_job_changes(client: TestClient) -> None:
    _register(client, "stale-job@example.com")
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    response = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]})
    assert response.status_code == 201
    assert response.json()["is_stale"] is False

    updated_job = {**_job_payload(), "description": "Build Go services and Kubernetes infrastructure."}
    assert client.put(f"/api/v1/jobs/{job['id']}", json=updated_job).status_code == 200

    listing = client.get(
        "/api/v1/analyses",
        params={"job_posting_id": job["id"], "analysis_type": "role_analysis"},
    )

    assert listing.status_code == 200
    assert listing.json()["items"][0]["is_stale"] is True


def test_preparation_plan_is_stale_after_new_role_analysis(client: TestClient, db_session: Session) -> None:
    _register(client, "stale-plan@example.com")
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    first_role = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]}).json()
    plan = client.post(
        "/api/v1/agents/preparation-plan",
        json={"job_posting_id": job["id"], "role_analysis_id": first_role["id"]},
    ).json()

    second_role = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]})
    assert second_role.status_code == 201
    second_analysis = db_session.get(JobAnalysis, second_role.json()["id"])
    assert second_analysis is not None
    second_analysis.created_at = datetime.now(timezone.utc) + timedelta(seconds=5)
    db_session.commit()

    listing = client.get(
        "/api/v1/analyses",
        params={"job_posting_id": job["id"], "analysis_type": "preparation_plan"},
    )

    assert listing.status_code == 200
    assert listing.json()["items"][0]["id"] == plan["id"]
    assert listing.json()["items"][0]["is_stale"] is True


def test_ai_rate_limit_is_scoped_per_user(client: TestClient, monkeypatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "ai_rate_limit_count", 1)
    monkeypatch.setattr(settings, "ai_rate_limit_window_seconds", 3600)

    _register(client, "rate-one@example.com")
    job_one = client.post("/api/v1/jobs", json=_job_payload()).json()
    assert client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job_one["id"]}).status_code == 201
    assert client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job_one["id"]}).status_code == 429

    client.post("/api/v1/auth/logout")
    _register(client, "rate-two@example.com")
    job_two = client.post("/api/v1/jobs", json=_job_payload()).json()
    assert client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job_two["id"]}).status_code == 201


def test_preparation_plan_requires_role_analysis(client: TestClient) -> None:
    _register(client, "plan-missing@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    response = client.post("/api/v1/agents/preparation-plan", json={"job_posting_id": job["id"]})
    assert response.status_code == 400
    assert response.json()["detail"] == "Generate role analysis before creating a preparation plan."


def test_agent_workflows_require_owned_job(client: TestClient) -> None:
    _register(client, "agent-owner@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    client.post("/api/v1/auth/logout")

    _register(client, "agent-other@example.com")
    response = client.post("/api/v1/agents/application-draft", json={"job_posting_id": job["id"]})
    assert response.status_code == 404


def test_ai_status_never_exposes_key(client: TestClient, monkeypatch) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "ai_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "sk-secret-value")
    monkeypatch.setattr(settings, "openai_model", "gpt-test-model")

    _register(client, "status@example.com")
    response = client.get("/api/v1/ai/status")

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "provider": "openai",
        "model": "gpt-test-model",
        "api_key_configured": True,
    }
    assert "sk-secret-value" not in response.text


def test_application_draft_provider_failure_returns_503(client: TestClient, monkeypatch) -> None:
    def raise_provider_error():
        raise AIProviderError("AI analysis is temporarily unavailable.")

    monkeypatch.setattr("app.services.agent_service.get_ai_provider", raise_provider_error)
    _register(client, "agent-failure@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    response = client.post("/api/v1/agents/application-draft", json={"job_posting_id": job["id"]})

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis is temporarily unavailable."


def test_resume_suggestions_provider_failure_returns_503(client: TestClient, monkeypatch) -> None:
    def raise_provider_error():
        raise AIProviderError("AI analysis is temporarily unavailable.")

    monkeypatch.setattr("app.services.analysis_service.get_ai_provider", raise_provider_error)
    _register(client, "resume-failure@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    response = client.post("/api/v1/analyses/resume-suggestions", json={"job_posting_id": job["id"]})

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis is temporarily unavailable."
