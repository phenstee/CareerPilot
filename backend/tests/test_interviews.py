from fastapi.testclient import TestClient

from app.ai.base import AIProviderError


def _register(client: TestClient, email: str = "interview@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Interview Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _profile_payload() -> dict[str, object]:
    return {
        "full_name": "Interview Student",
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
        "job_url": "https://example.com/jobs/full-stack",
        "employment_type": "Internship",
        "description": "Build React, FastAPI, SQL, and Docker services with a collaborative team.",
        "notes": "",
    }


def _application_payload(job_id: str) -> dict[str, object]:
    return {
        "job_posting_id": job_id,
        "stage": "Interview",
        "date_applied": "2026-07-30",
        "deadline": "2026-08-15",
        "follow_up_date": "2026-08-01",
        "notes": "Prepare project stories.",
        "important_contacts": [],
        "next_action": "Practice interview",
    }


def _create_application(client: TestClient) -> dict[str, object]:
    client.put("/api/v1/profile", json=_profile_payload())
    job = client.post("/api/v1/jobs", json=_job_payload()).json()
    return client.post("/api/v1/applications", json=_application_payload(job["id"])).json()


def test_user_can_generate_interview_session_and_answer_question(client: TestClient) -> None:
    _register(client)
    application = _create_application(client)

    create = client.post("/api/v1/interviews/sessions", json={"application_id": application["id"]})
    assert create.status_code == 201
    session = create.json()
    assert session["application_id"] == application["id"]
    assert session["provider"] == "mock"
    assert session["preparation_plan"]
    assert session["strong_topics"]
    assert len(session["questions"]) >= 4

    question = session["questions"][0]
    answer = client.post(
        f"/api/v1/interviews/sessions/{session['id']}/questions/{question['id']}/answers",
        json={
            "answer_text": (
                "I built a React and FastAPI project where I owned the API integration, "
                "debugged data flow issues, and improved the user workflow after testing."
            )
        },
    )
    assert answer.status_code == 201
    feedback = answer.json()["feedback"]
    assert feedback["strong_points"]
    assert feedback["stronger_answer_structure"]
    assert "perfect answer" in feedback["overall_feedback"]

    listing = client.get("/api/v1/interviews", params={"application_id": application["id"]})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    saved_question = listing.json()["items"][0]["questions"][0]
    assert len(saved_question["answers"]) == 1


def test_interview_sessions_require_owned_application(client: TestClient) -> None:
    _register(client, "interview-owner@example.com")
    application = _create_application(client)
    session = client.post("/api/v1/interviews/sessions", json={"application_id": application["id"]}).json()
    client.post("/api/v1/auth/logout")

    _register(client, "interview-other@example.com")
    assert client.get("/api/v1/interviews", params={"application_id": application["id"]}).status_code == 404
    assert client.post("/api/v1/interviews/sessions", json={"application_id": application["id"]}).status_code == 404
    assert client.get(f"/api/v1/interviews/sessions/{session['id']}").status_code == 404


def test_interview_provider_failures_return_503(client: TestClient, monkeypatch) -> None:
    def raise_provider_error():
        raise AIProviderError("AI analysis is temporarily unavailable.")

    monkeypatch.setattr("app.services.interview_service.get_ai_provider", raise_provider_error)
    _register(client, "interview-failure@example.com")
    application = _create_application(client)

    response = client.post("/api/v1/interviews/sessions", json={"application_id": application["id"]})

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis is temporarily unavailable."


def test_interview_answer_provider_failures_return_503(client: TestClient, monkeypatch) -> None:
    _register(client, "answer-failure@example.com")
    application = _create_application(client)
    session = client.post("/api/v1/interviews/sessions", json={"application_id": application["id"]}).json()
    question = session["questions"][0]

    def raise_provider_error():
        raise AIProviderError("AI analysis is temporarily unavailable.")

    monkeypatch.setattr("app.services.interview_service.get_ai_provider", raise_provider_error)
    response = client.post(
        f"/api/v1/interviews/sessions/{session['id']}/questions/{question['id']}/answers",
        json={"answer_text": "I built a React and FastAPI project and explained the tradeoffs clearly."},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis is temporarily unavailable."
