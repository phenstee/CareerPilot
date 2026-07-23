from fastapi.testclient import TestClient


def _register(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Jobs Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _job_payload(title: str = "Software Engineering Intern") -> dict[str, str | None]:
    return {
        "title": title,
        "company": "Northstar Robotics",
        "location": "Toronto, ON",
        "job_url": "https://example.com/jobs/swe-intern",
        "employment_type": "Internship",
        "description": "Build TypeScript and Python services for robotics tooling.",
        "notes": "Strong fit for backend and full-stack projects.",
    }


def test_jobs_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/jobs")

    assert response.status_code == 401


def test_user_can_create_search_update_and_delete_job(client: TestClient) -> None:
    _register(client, "jobs@example.com")

    create = client.post("/api/v1/jobs", json=_job_payload())
    assert create.status_code == 201
    job = create.json()
    assert job["title"] == "Software Engineering Intern"

    listing = client.get("/api/v1/jobs", params={"search": "robotics"})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    update_payload = _job_payload("AI Engineering Intern")
    update_payload["notes"] = "Prepare ML systems examples."
    update = client.put(f"/api/v1/jobs/{job['id']}", json=update_payload)
    assert update.status_code == 200
    assert update.json()["title"] == "AI Engineering Intern"

    detail = client.get(f"/api/v1/jobs/{job['id']}")
    assert detail.status_code == 200
    assert detail.json()["notes"] == "Prepare ML systems examples."

    delete_response = client.delete(f"/api/v1/jobs/{job['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/v1/jobs/{job['id']}").status_code == 404


def test_jobs_are_isolated_by_user(client: TestClient) -> None:
    _register(client, "owner@example.com")
    create = client.post("/api/v1/jobs", json=_job_payload())
    job_id = create.json()["id"]
    client.post("/api/v1/auth/logout")

    _register(client, "other@example.com")

    assert client.get(f"/api/v1/jobs/{job_id}").status_code == 404
    assert client.get("/api/v1/jobs").json()["total"] == 0
