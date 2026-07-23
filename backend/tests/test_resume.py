from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "resume@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Resume Student",
            "password": "correct horse battery",
        },
    )
    assert response.status_code == 201


def test_resume_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/resume")

    assert response.status_code == 401


def test_resume_upload_replace_and_delete(client: TestClient, monkeypatch) -> None:
    _register(client)
    monkeypatch.setattr(
        "app.services.resume_service.extract_pdf_text",
        lambda contents: "Python, FastAPI, and React resume text.",
    )

    upload = client.post(
        "/api/v1/resume",
        files={"file": ("resume.pdf", b"%PDF fake bytes", "application/pdf")},
    )

    assert upload.status_code == 200
    body = upload.json()
    assert body["filename"] == "resume.pdf"
    assert body["extracted_text_length"] > 0

    replacement = client.post(
        "/api/v1/resume",
        files={"file": ("updated.pdf", b"%PDF updated bytes", "application/pdf")},
    )
    assert replacement.status_code == 200
    assert replacement.json()["id"] == body["id"]
    assert replacement.json()["filename"] == "updated.pdf"

    text = client.get("/api/v1/resume/text")
    assert text.status_code == 200
    assert "FastAPI" in text.json()["extracted_text"]

    delete_response = client.delete("/api/v1/resume")
    assert delete_response.status_code == 204
    assert client.get("/api/v1/resume").json() is None


def test_resume_upload_rejects_non_pdf(client: TestClient) -> None:
    _register(client)

    response = client.post(
        "/api/v1/resume",
        files={"file": ("resume.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Upload a PDF resume."
