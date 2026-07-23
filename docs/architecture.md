# CareerPilot Architecture

CareerPilot is a monorepo with a Next.js frontend, FastAPI backend, and PostgreSQL database.

## Runtime Services

- `frontend`: Next.js App Router application served on port `3000`
- `backend`: FastAPI application served on port `8000`
- `db`: PostgreSQL database served on port `5432`

## Backend Boundaries

- `api`: HTTP routes and request/response concerns
- `schemas`: Pydantic models for validation and serialization
- `services`: business workflows
- `repositories`: database access
- `models`: SQLAlchemy ORM models
- `database`: engine, sessions, and migrations
- `ai`: mock and OpenAI provider implementations
- `core`: configuration and shared infrastructure

Routes should stay thin. Business logic belongs in services, and direct database queries belong in repositories.

## Authentication

Phase 2 uses a first-party account system. Passwords are hashed with PBKDF2-HMAC-SHA256 and a per-password random salt. Successful registration or login sets an HttpOnly JWT session cookie named `careerpilot_session`. Protected API routes should use `get_current_user`, then enforce ownership checks in normal backend code.

## Career Profile

Each user has at most one `CareerProfile`. Projects, experiences, and skills are separate relational rows owned through that profile. Simple repeatable profile fields such as target roles, preferred locations, and coursework are stored as JSON arrays to keep the first schema approachable while avoiding comma-separated strings.

## Resume And Jobs

Each user has at most one uploaded resume record. The first version stores resume metadata and extracted text, not the original PDF bytes. Job postings are user-owned rows with manual CRUD only; web scraping is intentionally excluded from the MVP.

## AI Boundary

AI calls are isolated behind provider classes. The application defaults to `AI_PROVIDER=mock` so development and tests can run without an API key. `OpenAIProvider` is available when `AI_PROVIDER=openai` and `OPENAI_API_KEY` is configured.

Prompts treat resumes and job descriptions as untrusted data and instruct the model not to invent skills, education, work experience, or resume achievements. Structured outputs are validated with Pydantic before being stored as `JobAnalysis` rows. AI suggestions are stored as recommendations, not as user profile facts.
