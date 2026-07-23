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


def _task_payload(application_id: str | None = None) -> dict[str, object]:
    return {
        "application_id": application_id,
        "title": "Practice behavioral stories",
        "explanation": "Prepare concise STAR examples.",
        "priority": "High",
        "estimated_effort": "45 min",
        "related_skill": "Interviewing",
        "suggested_deadline": "2026-08-02",
        "is_completed": False,
    }


def test_user_can_create_complete_update_and_delete_task(client: TestClient) -> None:
    _register(client, "tasks@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    application = client.post("/api/v1/applications", json=_application_payload(job["id"])).json()

    create = client.post("/api/v1/tasks", json=_task_payload(application["id"]))
    assert create.status_code == 201
    task = create.json()
    assert task["application_company"] == "Atlas Labs"
    assert task["priority"] == "High"

    complete = client.patch(f"/api/v1/tasks/{task['id']}/complete")
    assert complete.status_code == 200
    assert complete.json()["is_completed"] is True
    assert complete.json()["completed_at"] is not None

    update_payload = {**_task_payload(application["id"]), "is_completed": False, "priority": "Medium"}
    update = client.put(f"/api/v1/tasks/{task['id']}", json=update_payload)
    assert update.status_code == 200
    assert update.json()["is_completed"] is False
    assert update.json()["completed_at"] is None

    listing = client.get("/api/v1/tasks", params={"include_completed": "false"})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    delete = client.delete(f"/api/v1/tasks/{task['id']}")
    assert delete.status_code == 204
    assert client.get("/api/v1/tasks").json()["total"] == 0


def test_dashboard_summarizes_applications_jobs_and_tasks(client: TestClient) -> None:
    _register(client, "dashboard@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    application = client.post("/api/v1/applications", json=_application_payload(job["id"])).json()
    client.post("/api/v1/tasks", json=_task_payload(application["id"]))

    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert body["active_applications"] == 1
    assert body["saved_jobs"] == 1
    assert body["priority_tasks"] == 1
    assert body["counts_by_stage"]["Applied"] == 1
    assert body["upcoming_deadlines"][0]["id"] == application["id"]
    assert body["follow_ups_due"][0]["id"] == application["id"]
    assert body["recent_jobs"][0]["id"] == job["id"]
    assert body["recent_analyses"] == []
    assert body["priority_task_items"][0]["title"] == "Practice behavioral stories"
