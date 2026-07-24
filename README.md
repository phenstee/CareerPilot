# CareerPilot

CareerPilot is an AI-assisted job application and interview workspace for university students and early-career technology candidates. The core tracker is designed to work without AI, while later AI features will use a mock provider by default and require explicit user action before sending profile, resume, or job data to a model.

## Project Status

This repository contains the complete CareerPilot MVP foundation:

- FastAPI backend with `/api/v1/health`
- Next.js App Router frontend starter
- PostgreSQL, backend, and frontend Docker Compose services
- Environment variable template
- Initial architecture and API documentation
- SQLAlchemy database setup and Alembic user migration
- Registration, login, logout, and current-user API endpoints
- HttpOnly JWT session cookie authentication
- Protected frontend route middleware/proxy
- Career profile API and frontend editor
- Skills, projects, and experiences stored as user-owned profile data
- Resume PDF upload, replacement, text extraction, metadata view, and deletion
- Saved job posting CRUD with search and filters
- Application tracking with stages, stage history, filters, and dashboard counts
- Mock/OpenAI AI provider boundary
- AI Agents workspace for job finding, application preparation, and job preparation
- Controlled career agent with approval-gated application updates and audit logs
- Stored resume-tailoring suggestions for saved jobs
- AI-assisted job discovery with profile search, prompt search, mock source results, ranking, and save-to-jobs flow
- Interview preparation sessions with generated questions, typed practice answers, structured feedback, and stored attempts
- Development seed data for a demo account and portfolio walkthrough

## Screenshots

Screenshots can be added from these representative local pages:

- `/dashboard`
- `/profile`
- `/agents/job-finder`
- `/agent`
- `/applications/{id}/interview`

## Technology Stack

- Frontend: Next.js, TypeScript, React, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Backend: FastAPI, Pydantic, SQLAlchemy 2, Alembic, PostgreSQL
- AI: OpenAI Python SDK behind provider interfaces, with `AI_PROVIDER=mock` for local development
- Infrastructure: Docker and Docker Compose
- Testing: Pytest and Vitest

## Folder Structure

```text
backend/   FastAPI application, tests, Dockerfile, Python dependencies
frontend/  Next.js application, Tailwind setup, Dockerfile, frontend dependencies
docs/      Architecture and API notes
```

## Local Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Start the development stack:

```bash
docker compose up --build
```

3. In another terminal, apply migrations and seed the demo data:

```bash
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python -m app.seed
```

4. Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/api/v1/health
- API docs: http://localhost:8000/docs

Demo login:

- Email: `demo@careerpilot.dev`
- Password: `demo-password`

Browser auth calls are proxied through the frontend at `/api/v1/*` so the HttpOnly session cookie belongs to the same host as the app.

## Backend Only

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload
```

## Frontend Only

```bash
cd frontend
npm install
npm run dev
```

If the frontend runs outside Docker while the backend runs on the host, keep `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Environment Variables

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: local Postgres settings.
- `DATABASE_URL`: SQLAlchemy database URL used by FastAPI and Alembic.
- `JWT_SECRET`: signing secret for HttpOnly session cookies.
- `AI_PROVIDER`: `mock` by default, or `openai` for real AI calls.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: OpenAI settings used only when `AI_PROVIDER=openai`.
- `GREENHOUSE_BOARDS`: optional comma-separated public Greenhouse board tokens.
- `NEXT_PUBLIC_API_URL`: browser-visible backend URL.
- `BACKEND_INTERNAL_URL`: backend URL used by Next.js server-side calls.
- `CORS_ORIGINS`: allowed frontend origins for browser API requests.

## Database Migrations

```bash
cd backend
.venv\Scripts\python -m alembic upgrade head
```

With Docker:

```bash
docker compose run --rm backend alembic upgrade head
```

## Seed Data

The seed command creates a demo user, Waterloo-style profile, extracted resume text, five saved jobs, tracked applications with deadlines, one stored resume-suggestion analysis, one interview practice session, and a starter controlled-agent conversation.

```bash
cd backend
.venv\Scripts\python -m app.seed
```

With Docker:

```bash
docker compose run --rm backend python -m app.seed
```

The seed is idempotent for the demo account: rerunning it replaces `demo@careerpilot.dev` demo data.

## Running Tests

```bash
cd backend
.venv\Scripts\python -m pytest
```

```bash
cd frontend
npm run lint
npm run format:check
npm run test
npm run build
```

## Manual Phase 2 Test

1. Start PostgreSQL and the backend.
2. Run `alembic upgrade head` from `backend/`.
3. Open `http://localhost:3000/register`.
4. Create an account and confirm you are redirected to `/dashboard`.
5. Click `Log out` and confirm `/dashboard` redirects back to `/login`.

## Manual Phase 3 Test

1. Sign in and open `http://localhost:3000/profile`.
2. Fill in school, program, target roles, skills, coursework, one project, and one experience.
3. Save the profile.
4. Refresh the page and confirm the saved data reloads.
5. Sign out, create a second account, and confirm the second account starts with an empty profile.

## Manual Phase 4 Test

1. Open `http://localhost:3000/resume`.
2. Upload a text-readable PDF resume, confirm filename and extracted text metadata appear, then replace or delete it.
3. Open `http://localhost:3000/jobs`.
4. Create a job posting from `/jobs/new`.
5. Search the saved job list, open the job detail page, edit it, and delete it.

## Manual Phase 5 Test

1. Open a saved job detail page.
2. Click `Track application`.
3. Open `/applications`, switch between board and table views, and filter by stage/company/role/date.
4. Open the application detail page and change its stage.
5. Open `/dashboard` and confirm application counts, upcoming deadlines, and recent jobs are summarized.

## Manual AI Agents Test

1. Keep `AI_PROVIDER=mock` for local development.
2. Create a profile, upload a resume, and save a job posting.
3. Open `/agents` and confirm Controlled Career, Job Finder, Job Application, and Job Preparation agents are listed.
4. Open `/agents/job-finder`, search with your profile or a prompt, and confirm results use fit labels rather than numerical scores.
5. Save a result, then use `Prepare application` or `Prepare for this job`.
6. In Job Preparation, generate resume advice and confirm recommendations stay grounded in saved profile/resume evidence.

## Manual AI Job Search Test

1. Sign in and open `http://localhost:3000/agents/job-finder`.
2. Choose `Use my profile`, adjust filters, and click `Find jobs for me`.
3. Switch to `Describe what you want`, click an example prompt, and click `Search with AI`.
4. Confirm mock results are labeled, ranked, and explain profile evidence and gaps without numerical scores.
5. Click `Save job` on a result, then open the saved job from `/jobs`.

`GREENHOUSE_BOARDS` can be set to comma-separated public Greenhouse board tokens for opt-in public board searches. The local default remains the mock provider, and mock results are not presented as live jobs.

## Manual Phase 7 Test

1. Sign in and create a profile, saved job, and tracked application.
2. Open the application detail page and click `Practice interview`.
3. Click `Generate prep session`.
4. Step through generated behavioral, technical, job-description, and project/resume questions.
5. Type an answer and click `Submit for feedback`.
6. Confirm structured feedback appears and remains after refreshing the page.

## Manual Phase 8 Test

1. Sign in and create at least one tracked application.
2. Open `http://localhost:3000/agent`.
3. Ask to show upcoming deadlines and confirm no proposal is created.
4. Ask to move an application to another stage and confirm a proposal appears before the application changes.
5. Approve the proposal and confirm the application stage updates.
6. Create a second proposal, reject it, and confirm no application data changes.

## Current Limitations

- The controlled agent uses deterministic MVP planning; richer natural-language planning can be added behind the same proposal boundary.
- Job discovery defaults to mock data unless optional providers are configured.
- Uploaded PDF bytes are not persisted, only metadata and extracted text.
- The removed task workflow is intentionally out of scope for the current version; action planning is represented through applications, deadlines, and next actions.

## Future Improvements

- Richer natural-language planning for the controlled agent
- Optional screenshot assets for the README
- Account deletion/export controls
- More frontend interaction tests for agent approval and interview practice
