from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "student@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Ada Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _profile_payload() -> dict[str, object]:
    return {
        "full_name": "Ada Student",
        "school": "University of Waterloo",
        "program": "Computer Science",
        "graduation_year": 2027,
        "target_roles": ["Software Engineering Intern", "AI Engineering Intern"],
        "preferred_locations": ["Toronto", "Remote"],
        "technical_skills": ["Python", "TypeScript", "Python"],
        "soft_skills": ["Communication", "Teamwork"],
        "coursework": ["Algorithms", "Databases"],
        "career_goals": "Build reliable AI products for students.",
        "projects": [
            {
                "name": "Course Planner",
                "description": "A planning tool for course schedules.",
                "technologies": ["React", "FastAPI"],
                "link": "https://example.com/course-planner",
                "start_date": "2026-01-01",
                "end_date": "2026-04-30",
            }
        ],
        "experiences": [
            {
                "organization": "Campus AI Club",
                "position": "Project Lead",
                "description": "Led a small team building demo ML apps.",
                "start_date": "2025-09-01",
                "end_date": None,
            }
        ],
    }


def test_profile_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/profile")

    assert response.status_code == 401


def test_empty_profile_is_returned_for_new_user(client: TestClient) -> None:
    _register(client)

    response = client.get("/api/v1/profile")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] is None
    assert body["projects"] == []
    assert body["technical_skills"] == []


def test_user_can_create_and_replace_profile(client: TestClient) -> None:
    _register(client)

    create_response = client.put("/api/v1/profile", json=_profile_payload())

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["school"] == "University of Waterloo"
    assert created["technical_skills"] == ["Python", "TypeScript"]
    assert created["projects"][0]["name"] == "Course Planner"
    assert created["experiences"][0]["organization"] == "Campus AI Club"

    replacement = _profile_payload()
    replacement["technical_skills"] = ["Go"]
    replacement["projects"] = []
    update_response = client.put("/api/v1/profile", json=replacement)

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == created["id"]
    assert updated["technical_skills"] == ["Go"]
    assert updated["projects"] == []


def test_profiles_are_isolated_by_user(client: TestClient) -> None:
    _register(client, "one@example.com")
    client.put("/api/v1/profile", json=_profile_payload())
    first_profile = client.get("/api/v1/profile").json()
    client.post("/api/v1/auth/logout")

    _register(client, "two@example.com")
    second_profile = client.get("/api/v1/profile").json()

    assert first_profile["id"] is not None
    assert second_profile["id"] is None
    assert second_profile["school"] == ""
