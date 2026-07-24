from fastapi.testclient import TestClient


def _register(client: TestClient, email: str, full_name: str = "Agent Student") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def _job_payload(company: str = "Northstar Robotics") -> dict[str, str | None]:
    return {
        "title": "Backend Intern",
        "company": company,
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


def _create_application(client: TestClient, *, company: str = "Northstar Robotics") -> dict:
    job = client.post("/api/v1/jobs", json=_job_payload(company)).json()
    application = client.post("/api/v1/applications", json=_application_payload(job["id"])).json()
    return application


def test_agent_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/agent/messages", json={"message": "show my applications"})
    assert response.status_code == 401


def test_agent_read_only_deadlines_run_without_proposal(client: TestClient) -> None:
    _register(client, "agent-deadlines@example.com")
    _create_application(client)

    response = client.post("/api/v1/agent/messages", json={"message": "show my upcoming deadlines"})
    assert response.status_code == 201
    body = response.json()
    assert "Upcoming deadlines" in body["assistant_message"]["content"]
    assert body["proposals"] == []
    assert body["conversation"]["proposals"] == []


def test_agent_proposes_stage_update_before_mutating(client: TestClient) -> None:
    _register(client, "agent-propose@example.com")
    application = _create_application(client)

    response = client.post(
        "/api/v1/agent/messages",
        json={"message": "move my Northstar Robotics application to Applied"},
    )
    assert response.status_code == 201
    proposal = response.json()["proposals"][0]
    assert proposal["action_type"] == "update_application_stage"
    assert proposal["status"] == "proposed"
    assert proposal["audit_logs"][0]["event"] == "proposed"

    unchanged = client.get(f"/api/v1/applications/{application['id']}").json()
    assert unchanged["stage"] == "Preparing"


def test_agent_approval_executes_application_update_and_logs(client: TestClient) -> None:
    _register(client, "agent-approve@example.com")
    application = _create_application(client)
    proposal = client.post(
        "/api/v1/agent/messages",
        json={"message": "move my Northstar Robotics application to Applied"},
    ).json()["proposals"][0]

    approved = client.post(f"/api/v1/agent/proposals/{proposal['id']}/approve", json={"note": "Looks right"})
    assert approved.status_code == 200
    approved_body = approved.json()
    assert approved_body["status"] == "executed"
    assert [log["event"] for log in approved_body["audit_logs"]] == ["proposed", "approved", "executed"]

    updated = client.get(f"/api/v1/applications/{application['id']}").json()
    assert updated["stage"] == "Applied"
    assert updated["stage_history"][-1]["from_stage"] == "Preparing"
    assert updated["stage_history"][-1]["to_stage"] == "Applied"


def test_agent_rejection_does_not_execute_proposal(client: TestClient) -> None:
    _register(client, "agent-reject@example.com")
    application = _create_application(client)
    proposal = client.post(
        "/api/v1/agent/messages",
        json={"message": "move my Northstar Robotics application to Applied"},
    ).json()["proposals"][0]

    rejected = client.post(f"/api/v1/agent/proposals/{proposal['id']}/reject", json={"note": "Not yet"})
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"

    unchanged = client.get(f"/api/v1/applications/{application['id']}").json()
    assert unchanged["stage"] == "Preparing"


def test_agent_proposals_are_isolated_by_user(client: TestClient) -> None:
    _register(client, "agent-owner@example.com")
    _create_application(client)
    proposal = client.post(
        "/api/v1/agent/messages",
        json={"message": "move my Northstar Robotics application to Applied"},
    ).json()["proposals"][0]
    client.post("/api/v1/auth/logout")

    _register(client, "agent-other@example.com")
    response = client.post(f"/api/v1/agent/proposals/{proposal['id']}/approve", json={"note": ""})
    assert response.status_code == 404
