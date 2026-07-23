from fastapi.testclient import TestClient


def test_register_user_sets_cookie_and_returns_user(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "Student@Example.com",
            "full_name": "Ada Student",
            "password": "correct horse battery",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "student@example.com"
    assert body["user"]["full_name"] == "Ada Student"
    assert "careerpilot_session" in response.cookies

    me_response = client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "student@example.com"


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@example.com",
            "full_name": "Ada Student",
            "password": "correct horse battery",
        },
    )
    client.post("/api/v1/auth/logout")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "wrong password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_unauthorized_current_user_request_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."


def test_logout_clears_session_cookie(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@example.com",
            "full_name": "Ada Student",
            "password": "correct horse battery",
        },
    )

    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401
