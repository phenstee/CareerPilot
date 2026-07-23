from fastapi.testclient import TestClient


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


def test_mock_job_match_and_resume_suggestions_are_stored(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr("app.services.resume_service.extract_pdf_text", lambda contents: "Python\nReact\nFastAPI project")
    _register(client)
    assert client.put("/api/v1/profile", json=_profile_payload()).status_code == 200
    client.post(
        "/api/v1/resume",
        files={"file": ("resume.pdf", b"%PDF fake bytes", "application/pdf")},
    )
    job = client.post("/api/v1/jobs", json=_job_payload()).json()

    match = client.post("/api/v1/analyses/job-match", json={"job_posting_id": job["id"]})
    assert match.status_code == 201
    match_body = match.json()
    assert match_body["analysis_type"] == "job_match"
    assert match_body["provider"] == "mock"
    assert 0 <= match_body["result"]["overall_match_score"] <= 100
    assert "React" in match_body["result"]["matching_skills"]

    suggestions = client.post("/api/v1/analyses/resume-suggestions", json={"job_posting_id": job["id"]})
    assert suggestions.status_code == 201
    assert suggestions.json()["analysis_type"] == "resume_suggestions"
    assert "React" in suggestions.json()["result"]["keywords"]

    listing = client.get("/api/v1/analyses", params={"job_posting_id": job["id"]})
    assert listing.status_code == 200
    assert listing.json()["total"] == 2


def test_analysis_requires_owned_job(client: TestClient) -> None:
    _register(client, "analysis-owner@example.com")
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    client.post("/api/v1/auth/logout")

    _register(client, "analysis-other@example.com")
    response = client.post("/api/v1/analyses/job-match", json={"job_posting_id": job["id"]})
    assert response.status_code == 404
