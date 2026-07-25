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

## AI Job Search

The `/jobs/new` page now acts as an AI-assisted job discovery surface. The backend owns search, normalization, deduplication, and ranking through `/api/v1/job-search/*`; frontend components never scrape directly.

The local default source is `MockJobSourceProvider`, and mock results are labeled in the UI. `GreenhouseJobSourceProvider` is an extension adapter for configured public Greenhouse board tokens through `GREENHOUSE_BOARDS`, but it is opt-in and uses HTTPS requests with timeouts. One provider failure is reported in the response without failing the whole search.

Discovered jobs are transient until the user clicks `Save job`, which maps the normalized result into the existing `JobPosting` table for the authenticated user.

## AI Boundary

AI calls are isolated behind provider classes. The application defaults to `AI_PROVIDER=mock` so development and tests can run without an API key. `OpenAIProvider` is available when `AI_PROVIDER=openai` and `OPENAI_API_KEY` is configured.

Prompts treat resumes and job descriptions as untrusted data and instruct the model not to invent skills, education, work experience, or resume achievements. Structured resume-suggestion outputs are validated with Pydantic before being stored as `JobAnalysis` rows. AI suggestions are stored as recommendations, not as user profile facts. Public-facing match ratings have been removed; job discovery can still order results internally, but it exposes evidence-based fit labels instead of numerical scores.

## AI Agents

The protected `/agents` workspace separates AI assistance into focused workflows:

- Job Finder Agent: profile or prompt-based job discovery using existing job-search providers.
- Job Application Agent: saved-job selection, profile review, generated application preview, and explicit user approval for manual use.
- Job Preparation Agent: saved-job preparation, role overview, strengths and gaps, resume recommendations, study topics, and links into the stored mock-interview workflow.

No agent submits an application automatically. External job content is treated as untrusted input, and authenticated users only operate on their own saved profile, jobs, applications, resume, and generated records.

## Interview Preparation

Interview preparation is application-scoped. A user can generate an `InterviewSession` for an owned application, which stores generated questions, a preparation plan, strong topics, and weak areas. Typed practice answers are stored as `InterviewAnswer` rows with structured feedback, so users can revisit previous attempts.

Feedback is coaching output only. It can suggest a stronger answer structure or improved outline, but it must not present fabricated accomplishments as if the user said or did them.

## Demo Data

`python -m app.seed` creates a resettable demo account for portfolio walkthroughs. It seeds one user, a Waterloo-style career profile, extracted resume text, saved technology jobs, tracked applications with deadlines, one resume-suggestion analysis, and one interview practice session. The task model from the original plan was intentionally removed, so demo planning data lives in application deadlines and next actions.
