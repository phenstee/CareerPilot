from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "task@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Task Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _profile_payload() -> dict[str, object]:
    return {
        "full_name": "Task Student",
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


def _job_payload() -> dict[str, str | None]:
    return {
        "title": "Backend Intern",
        "company": "Atlas Labs",
        "location": "Toronto, ON",
        "job_url": None,
        "employment_type": "Internship",
        "description": "Build Python APIs with FastAPI and PostgreSQL.",
        "notes": "",
    }


def _create_job(client: TestClient) -> dict[str, object]:
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    return client.post("/api/v1/jobs", json=_job_payload()).json()


def test_task_creation_and_status_lookup(client: TestClient) -> None:
    _register(client)
    job = _create_job(client)

    response = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]})

    assert response.status_code == 202
    task = response.json()
    assert task["task_type"] == "role_analysis"
    assert task["status"] == "SUCCEEDED"
    assert task["result_resource_type"] == "job_analysis"

    lookup = client.get(f"/api/v1/tasks/{task['id']}")
    assert lookup.status_code == 200
    assert lookup.json()["id"] == task["id"]


def test_task_lookup_enforces_user_ownership(client: TestClient) -> None:
    _register(client, "task-owner@example.com")
    job = _create_job(client)
    task_id = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]}).json()["id"]
    client.post("/api/v1/auth/logout")

    _register(client, "task-other@example.com")

    assert client.get(f"/api/v1/tasks/{task_id}").status_code == 404
    assert client.get(f"/api/v1/tasks/{task_id}/events").status_code == 404


def test_idempotency_key_reuses_existing_task(client: TestClient) -> None:
    _register(client)
    job = _create_job(client)
    headers = {"Idempotency-Key": "same-click-1"}

    first = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]}, headers=headers)
    second = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]}, headers=headers)

    assert first.status_code == 202
    assert second.status_code == 202
    assert first.json()["id"] == second.json()["id"]


def test_failed_task_lifecycle_is_persisted(client: TestClient, monkeypatch) -> None:
    from app.ai.base import AIProviderError

    def raise_provider_error():
        raise AIProviderError("AI analysis is temporarily unavailable.")

    monkeypatch.setattr("app.services.agent_service.get_ai_provider", raise_provider_error)
    _register(client)
    job = _create_job(client)

    response = client.post("/api/v1/agents/application-draft", json={"job_posting_id": job["id"]})

    assert response.status_code == 202
    task = response.json()
    assert task["status"] == "FAILED"
    assert task["last_error_code"] == "ai_provider_unavailable"
    assert task["last_error_message"] == "AI analysis is temporarily unavailable."


def test_task_events_emit_current_status(client: TestClient) -> None:
    _register(client)
    job = _create_job(client)
    task = client.post("/api/v1/agents/role-analysis", json={"job_posting_id": job["id"]}).json()

    with client.stream("GET", f"/api/v1/tasks/{task['id']}/events") as response:
        assert response.status_code == 200
        body = "".join(response.iter_text())

    assert "event: status" in body
    assert '"status": "SUCCEEDED"' in body
