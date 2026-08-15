import os
from uuid import uuid4

from locust import HttpUser, between, task


class CareerPilotAsyncTaskUser(HttpUser):
    wait_time = between(0.2, 1.0)

    def on_start(self) -> None:
        suffix = uuid4().hex
        email = f"load-{suffix}@example.com"
        password = "correct horse battery"
        register = self.client.post(
            "/api/v1/auth/register",
            json={"email": email, "full_name": "Load Test Student", "password": password},
            name="auth/register",
        )
        if register.status_code not in {201, 409}:
            register.failure("registration failed")
            return

        self.client.put(
            "/api/v1/profile",
            json={
                "full_name": "Load Test Student",
                "school": "University of Waterloo",
                "program": "Computer Science",
                "graduation_year": 2028,
                "target_roles": ["Software Engineer Intern"],
                "preferred_locations": ["Toronto, ON"],
                "technical_skills": ["Python", "FastAPI", "PostgreSQL"],
                "soft_skills": ["Communication"],
                "coursework": [],
                "career_goals": "",
                "projects": [],
                "experiences": [],
            },
            name="profile/update",
        )
        job = self.client.post(
            "/api/v1/jobs",
            json={
                "title": "Backend Intern",
                "company": "Load Test Co",
                "location": "Remote",
                "job_url": None,
                "employment_type": "Internship",
                "description": "Build FastAPI services with PostgreSQL.",
                "notes": "",
            },
            name="jobs/create",
        )
        self.job_id = job.json()["id"] if job.status_code == 201 else None

    @task
    def submit_role_analysis_task(self) -> None:
        if not self.job_id:
            return

        with self.client.post(
            "/api/v1/agents/role-analysis",
            json={"job_posting_id": self.job_id},
            headers={"Idempotency-Key": str(uuid4())},
            name="tasks/submit-role-analysis",
            catch_response=True,
        ) as response:
            if response.status_code != 202:
                response.failure(f"expected 202, got {response.status_code}")
                return

            task_id = response.json()["id"]

        poll_limit = int(os.getenv("LOAD_TEST_POLL_LIMIT", "20"))
        for _ in range(poll_limit):
            task_response = self.client.get(f"/api/v1/tasks/{task_id}", name="tasks/poll")
            if task_response.status_code != 200:
                return
            status = task_response.json()["status"]
            if status in {"SUCCEEDED", "FAILED"}:
                return
