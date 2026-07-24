from fastapi.testclient import TestClient


def _register(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Dashboard Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _job_payload() -> dict[str, str | None]:
    return {
        "title": "Full Stack Intern",
        "company": "Atlas Labs",
        "location": "Waterloo, ON",
        "job_url": None,
        "employment_type": "Internship",
        "description": "Ship product features with React and FastAPI.",
        "notes": "",
    }


def _application_payload(job_id: str) -> dict[str, object]:
    return {
        "job_posting_id": job_id,
        "stage": "Applied",
        "date_applied": "2026-07-20",
        "deadline": "2026-08-10",
        "follow_up_date": "2026-07-01",
        "notes": "Submitted through portal.",
        "important_contacts": [],
        "next_action": "Send follow-up",
    }


def test_dashboard_summarizes_applications_jobs_and_ai_activity(client: TestClient) -> None:
    _register(client, "dashboard@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    application = client.post("/api/v1/applications", json=_application_payload(job["id"])).json()

    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert body["active_applications"] == 1
    assert body["saved_jobs"] == 1
    assert "priority_tasks" not in body
    assert "priority_task_items" not in body
    assert "follow_ups_due" not in body
    assert body["counts_by_stage"]["Applied"] == 1
    assert body["upcoming_deadlines"][0]["id"] == application["id"]
    assert body["recent_jobs"][0]["id"] == job["id"]
    assert "recent_analyses" not in body
