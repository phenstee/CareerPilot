from datetime import date

from sqlalchemy.orm import Session

from app.core.security import hash_password, normalize_email
from app.database.session import SessionLocal
from app.models.agent import AgentConversation, AgentMessage
from app.models.analysis import JobAnalysis
from app.models.interview import InterviewAnswer, InterviewQuestion, InterviewSession
from app.models.job import JobPosting
from app.models.profile import CareerProfile, Experience, Project, Skill
from app.models.resume import Resume
from app.models.tracker import Application, ApplicationStageHistory
from app.models.user import User
from app.repositories.user_repository import UserRepository

DEMO_EMAIL = "demo@careerpilot.dev"
DEMO_PASSWORD = "demo-password"


def seed_demo_data(db: Session, *, reset: bool = True) -> User:
    existing = UserRepository(db).get_by_email(DEMO_EMAIL)
    if existing and reset:
        db.delete(existing)
        db.commit()
        existing = None
    if existing:
        return existing

    user = User(
        email=normalize_email(DEMO_EMAIL),
        full_name="Stephen Chen",
        password_hash=hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.flush()

    profile = CareerProfile(
        user_id=user.id,
        full_name="Stephen Chen",
        school="University of Waterloo",
        program="Honours Mathematics",
        graduation_year=2028,
        target_roles=["Software Engineering Intern", "Full-stack Intern", "AI Engineering Intern"],
        preferred_locations=["Toronto, ON", "Waterloo, ON", "New York, NY", "San Francisco, CA"],
        coursework=["Data Structures", "Algorithms", "Linear Algebra", "Probability", "Statistics"],
        career_goals="Build reliable AI-assisted products for students and early-career candidates.",
    )
    db.add(profile)
    db.flush()

    profile.skills = [
        Skill(name="Python", category="technical"),
        Skill(name="FastAPI", category="technical"),
        Skill(name="React", category="technical"),
        Skill(name="TypeScript", category="technical"),
        Skill(name="PostgreSQL", category="technical"),
        Skill(name="OpenAI API", category="technical"),
        Skill(name="Communication", category="soft"),
        Skill(name="Ownership", category="soft"),
        Skill(name="Collaboration", category="soft"),
    ]
    profile.projects = [
        Project(
            name="CareerPilot",
            description="Full-stack career tracker with grounded AI resume suggestions and interview practice.",
            technologies=["Next.js", "FastAPI", "PostgreSQL", "OpenAI"],
            link="https://github.com/ph enstee/careerpilot".replace(" ", ""),
            start_date=date(2026, 7, 1),
            end_date=None,
        ),
        Project(
            name="Campus Study Planner",
            description="Scheduling app that groups coursework, deadlines, and study sessions.",
            technologies=["React", "TypeScript", "SQLite"],
            link=None,
            start_date=date(2025, 9, 1),
            end_date=date(2025, 12, 15),
        ),
        Project(
            name="Resume Parser Lab",
            description="Prototype that extracts structured sections from text-readable PDF resumes.",
            technologies=["Python", "Pydantic", "pytest"],
            link=None,
            start_date=date(2026, 1, 10),
            end_date=date(2026, 4, 20),
        ),
    ]
    profile.experiences = [
        Experience(
            organization="Neo Developer League",
            position="Marketing Executive",
            description="Organized league check-ins, workshops, and member communications.",
            start_date=date(2024, 8, 1),
            end_date=date(2024, 11, 30),
        ),
        Experience(
            organization="Waterloo Math Society",
            position="Technical Volunteer",
            description="Helped maintain student-facing resources and troubleshoot event tooling.",
            start_date=date(2025, 1, 1),
            end_date=None,
        ),
    ]

    resume = Resume(
        user_id=user.id,
        filename="Stephen_Chen_Demo_Resume.pdf",
        content_type="application/pdf",
        size_bytes=92_000,
        extracted_text=DEMO_RESUME_TEXT,
    )
    db.add(resume)

    jobs = _create_jobs(user.id)
    db.add_all(jobs)
    db.flush()

    applications = [
        Application(
            user_id=user.id,
            job_posting_id=jobs[0].id,
            stage="Preparing",
            deadline=date(2026, 8, 12),
            follow_up_date=date(2026, 8, 4),
            notes="Tailor resume toward FastAPI and database ownership.",
            important_contacts=["Mina Patel"],
            next_action="Draft backend-focused cover letter",
        ),
        Application(
            user_id=user.id,
            job_posting_id=jobs[1].id,
            stage="Applied",
            date_applied=date(2026, 7, 18),
            deadline=date(2026, 8, 1),
            follow_up_date=date(2026, 7, 29),
            notes="Submitted through company portal.",
            important_contacts=[],
            next_action="Prepare React project walkthrough",
        ),
        Application(
            user_id=user.id,
            job_posting_id=jobs[2].id,
            stage="Interview",
            date_applied=date(2026, 7, 10),
            deadline=date(2026, 7, 30),
            follow_up_date=date(2026, 7, 26),
            notes="Recruiter screen completed.",
            important_contacts=["Alex Morgan"],
            next_action="Practice behavioral and ML fundamentals",
        ),
        Application(
            user_id=user.id,
            job_posting_id=jobs[3].id,
            stage="Saved",
            deadline=date(2026, 8, 20),
            follow_up_date=None,
            notes="Decide whether this product area is a fit.",
            important_contacts=[],
            next_action="Compare posting against profile",
        ),
    ]
    db.add_all(applications)
    db.flush()
    for application in applications:
        db.add(
            ApplicationStageHistory(
                application_id=application.id,
                from_stage=None,
                to_stage=application.stage,
                note=application.next_action,
            )
        )

    analysis = JobAnalysis(
        user_id=user.id,
        job_posting_id=jobs[0].id,
        analysis_type="resume_suggestions",
        provider="mock",
        result={
            "keywords": ["FastAPI", "PostgreSQL", "React", "AI workflows", "testing"],
            "relevant_existing_resume_content": [
                "CareerPilot full-stack career tracker",
                "Resume Parser Lab using Python, Pydantic, and pytest",
            ],
            "suggested_additions": [
                "Add one bullet showing backend ownership for API design and tests.",
                "Mention the approval workflow for safe AI-assisted updates.",
            ],
            "less_important_items": [
                "Shorten older non-technical event logistics details for this backend-heavy role."
            ],
            "suggested_rewrites": [
                {
                    "original_text": "Built a career tracker app.",
                    "suggested_text": "Built a full-stack career tracker with FastAPI, Next.js, PostgreSQL, and mock/OpenAI provider boundaries.",
                    "rationale": "Keeps the fact intact while naming the relevant stack.",
                }
            ],
            "missing_information_questions": [
                "Can you quantify how many routes, tests, or workflows you implemented?"
            ],
            "application_checklist": [
                "Tailor resume bullets",
                "Review job requirements",
                "Prepare project walkthrough",
            ],
            "uncertainties": ["No production internship impact metrics were provided."],
        },
    )
    db.add(analysis)

    interview = InterviewSession(
        user_id=user.id,
        application_id=applications[2].id,
        provider="mock",
        preparation_plan=[
            "Review the job description and saved notes.",
            "Prepare one project story about CareerPilot.",
            "Practice explaining technical tradeoffs clearly.",
        ],
        strong_topics=["FastAPI", "React", "structured AI outputs"],
        weak_areas=["ML system design", "quantified impact"],
    )
    db.add(interview)
    db.flush()
    question = InterviewQuestion(
        session_id=interview.id,
        category="projects_resume",
        question_text="Walk me through CareerPilot and the backend design decisions you made.",
        rationale="The saved resume and profile both highlight this project.",
        display_order=1,
    )
    db.add(question)
    db.flush()
    db.add(
        InterviewAnswer(
            question_id=question.id,
            user_id=user.id,
            answer_text="I built a full-stack app with FastAPI, Next.js, and PostgreSQL.",
            provider="mock",
            feedback={
                "strong_points": ["Clear technology stack"],
                "unclear_points": ["Needs more detail about personal ownership"],
                "missing_points": ["No measurable result or tradeoff"],
                "stronger_answer_structure": ["Context", "Decision", "Tradeoff", "Result"],
                "improved_outline": [
                    "Briefly state the product goal.",
                    "Explain the API and database boundary.",
                    "Describe one testing or safety decision.",
                ],
                "overall_feedback": "Good start. Add a concrete technical decision and result.",
            },
        )
    )

    conversation = AgentConversation(user_id=user.id, title="Demo career check-in")
    db.add(conversation)
    db.flush()
    db.add_all(
        [
            AgentMessage(
                conversation_id=conversation.id,
                role="user",
                content="Show my upcoming deadlines",
            ),
            AgentMessage(
                conversation_id=conversation.id,
                role="assistant",
                content="Upcoming deadlines:\n2026-07-30: AI Engineering Intern at Boreal AI Labs\n2026-08-01: Frontend Platform Intern at Northwind Commerce",
            ),
        ]
    )

    db.commit()
    db.refresh(user)
    return user


def _create_jobs(user_id: str) -> list[JobPosting]:
    return [
        JobPosting(
            user_id=user_id,
            title="Backend Engineering Intern",
            company="Northstar Robotics",
            location="Toronto, ON",
            job_url="https://example.com/northstar/backend-intern",
            employment_type="Internship",
            description=(
                "Build Python and FastAPI services, design PostgreSQL-backed workflows, write tests, "
                "and collaborate with frontend engineers on AI-assisted robotics tools."
            ),
            notes="Strong fit for FastAPI and Postgres experience.",
        ),
        JobPosting(
            user_id=user_id,
            title="Frontend Platform Intern",
            company="Northwind Commerce",
            location="Waterloo, ON",
            job_url="https://example.com/northwind/frontend-platform",
            employment_type="Internship",
            description=(
                "Work on React, TypeScript, accessibility, design systems, and reusable commerce dashboard components."
            ),
            notes="Prepare polished React examples.",
        ),
        JobPosting(
            user_id=user_id,
            title="AI Engineering Intern",
            company="Boreal AI Labs",
            location="Montreal, QC",
            job_url="https://example.com/boreal/ai-engineering",
            employment_type="Internship",
            description=(
                "Prototype LLM-backed workflows, evaluate model outputs, build structured Pydantic validators, "
                "and communicate uncertainty clearly."
            ),
            notes="Review prompt-injection and structured output examples.",
        ),
        JobPosting(
            user_id=user_id,
            title="Full-stack Product Intern",
            company="Maple Health",
            location="Remote Canada",
            job_url="https://example.com/maple/full-stack-product",
            employment_type="Internship",
            description=(
                "Ship product features using Next.js, API routes, SQL data models, user research, and careful privacy practices."
            ),
            notes="Healthcare privacy angle could be interesting.",
        ),
        JobPosting(
            user_id=user_id,
            title="Machine Learning Tools Intern",
            company="VectorWorks Studio",
            location="New York, NY",
            job_url="https://example.com/vectorworks/ml-tools",
            employment_type="Internship",
            description=(
                "Build internal ML tooling, data validation dashboards, experiment tracking helpers, and Python services."
            ),
            notes="Stretch role; identify missing ML tooling evidence.",
        ),
    ]


DEMO_RESUME_TEXT = """
Stephen Chen
University of Waterloo, Honours Mathematics

Projects
CareerPilot - Built a full-stack career tracker with Next.js, FastAPI, PostgreSQL, and AI provider boundaries.
Resume Parser Lab - Extracted structured content from text-readable PDF resumes with Python, Pydantic, and pytest.
Campus Study Planner - Created a React scheduling app for coursework and deadlines.

Experience
Neo Developer League, Marketing Executive - Organized workshops, check-ins, and member communications.
Waterloo Math Society, Technical Volunteer - Helped maintain student-facing resources and troubleshoot event tooling.

Skills
Python, FastAPI, React, TypeScript, PostgreSQL, OpenAI API, communication, collaboration.
""".strip()


def main() -> None:
    db = SessionLocal()
    try:
        user = seed_demo_data(db)
    finally:
        db.close()

    print("Seeded CareerPilot demo data.")
    print(f"Email: {user.email}")
    print(f"Password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
