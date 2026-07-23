from fastapi.testclient import TestClient


def _register(client: TestClient, email: str, full_name: str = "Tracker Student") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _job_payload(title: str = "Backend Intern") -> dict[str, str | None]:
    return {
        "title": title,
        "company": "Northstar Robotics",
        "location": "Toronto, ON",
        "job_url": "https://example.com/jobs/backend",
        "employment_type": "Internship",
        "description": "Build Python APIs for hiring workflows.",
        "notes": "Follow up with alumni contact.",
    }


def _application_payload(job_id: str, stage: str = "Preparing") -> dict[str, object]:
    return {
        "job_posting_id": job_id,
        "stage": stage,
        "date_applied": None,
        "deadline": "2026-08-15",
        "follow_up_date": "2026-08-01",
        "notes": "Tailor resume to backend projects.",
        "important_contacts": ["Mina Patel"],
        "next_action": "Draft cover letter",
    }


def test_user_can_create_filter_update_and_delete_application(client: TestClient) -> None:
    _register(client, "applications@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    create = client.post("/api/v1/applications", json=_application_payload(job["id"]))
    assert create.status_code == 201
    application = create.json()
    assert application["company"] == "Northstar Robotics"
    assert application["stage"] == "Preparing"
    assert application["stage_history"][0]["from_stage"] is None
    assert application["stage_history"][0]["to_stage"] == "Preparing"

    listing = client.get("/api/v1/applications", params={"company": "northstar", "role": "backend"})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["counts_by_stage"]["Preparing"] == 1

    update_payload = {**_application_payload(job["id"], "Applied"), "date_applied": "2026-07-30"}
    update = client.put(f"/api/v1/applications/{application['id']}", json=update_payload)
    assert update.status_code == 200
    updated = update.json()
    assert updated["stage"] == "Applied"
    assert len(updated["stage_history"]) == 2
    assert updated["stage_history"][1]["from_stage"] == "Preparing"
    assert updated["stage_history"][1]["to_stage"] == "Applied"

    duplicate = client.post("/api/v1/applications", json=_application_payload(job["id"]))
    assert duplicate.status_code == 409

    delete = client.delete(f"/api/v1/applications/{application['id']}")
    assert delete.status_code == 204
    assert client.get(f"/api/v1/applications/{application['id']}").status_code == 404


def test_applications_are_isolated_by_user(client: TestClient) -> None:
    _register(client, "application-owner@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    application = client.post("/api/v1/applications", json=_application_payload(job["id"])).json()
    client.post("/api/v1/auth/logout")

    _register(client, "application-other@example.com")
    assert client.get(f"/api/v1/applications/{application['id']}").status_code == 404
    assert client.post("/api/v1/applications", json=_application_payload(job["id"])).status_code == 404
