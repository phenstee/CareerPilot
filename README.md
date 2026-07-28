# CareerPilot

[![CI](https://github.com/phenstee/CareerPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/phenstee/CareerPilot/actions/workflows/ci.yml)

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
- Mock/OpenAI AI provider boundary with backend-only API key handling
- AI Agents workspace for job finding, backend-powered application drafting, and backend-powered job preparation
- Stored resume-tailoring suggestions for saved jobs
- Stored application drafts, role analyses, and preparation plans for saved jobs
- AI-assisted job discovery with profile search, prompt search, mock source results, ranking, and save-to-jobs flow
- Interview preparation sessions with generated questions, typed practice answers, structured feedback, and stored attempts
- Development seed data for a demo account and portfolio walkthrough

## Screenshots

Screenshots can be added from these representative local pages:

- `/dashboard`
- `/profile`
- `/agents/job-finder`
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

3. In another terminal, seed the demo data if desired. The backend container applies migrations before starting:

```bash
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
- `ENVIRONMENT`: `development`, `test`, or `production`; production enables stricter safety checks.
- `DATABASE_URL`: SQLAlchemy database URL used by FastAPI and Alembic.
- `JWT_SECRET`: signing secret for HttpOnly session cookies.
- `AUTH_COOKIE_SECURE`: set `true` in HTTPS production deployments.
- `AUTH_COOKIE_SAMESITE`: `lax`, `strict`, or `none`; `none` requires secure cookies.
- `APP_URL`: canonical frontend origin used for safe auth redirects; required in production.
- `BETA_ACCESS_CODE`: optional closed-beta invite code required during registration when set.
- `AI_RATE_LIMIT_COUNT`, `AI_RATE_LIMIT_WINDOW_SECONDS`: total AI generation requests per authenticated user across all AI workflows during the configured window.
- `JOB_SEARCH_RATE_LIMIT_COUNT`, `JOB_SEARCH_RATE_LIMIT_WINDOW_SECONDS`: total job-search requests per authenticated user across profile and prompt search during the configured window.
- Registration and login rate limits use the direct client host in this beta. Behind a single reverse proxy, multiple users may share that unauthenticated bucket unless trusted-proxy handling is configured later.
- `AI_PROVIDER`: `mock` by default, or `openai` for real AI calls.
- `OPENAI_API_KEY`: backend-only OpenAI key used only when `AI_PROVIDER=openai`.
- `OPENAI_MODEL`: model name used by the backend OpenAI provider.
- `OPENAI_TIMEOUT_SECONDS`, `OPENAI_MAX_RETRIES`: request timeout and retry controls for OpenAI calls.
- `GREENHOUSE_BOARDS`: optional comma-separated public Greenhouse board tokens.
- `NEXT_PUBLIC_API_URL`: browser-visible backend URL.
- `BACKEND_INTERNAL_URL`: backend URL used by Next.js server-side calls and production build-time API rewrites.
- `CORS_ORIGINS`: allowed frontend origins for browser API requests.

### Local Mock Mode

```env
AI_PROVIDER=mock
OPENAI_API_KEY=
```

Mock mode requires no API key and returns deterministic development data through the same backend endpoints used by real AI workflows.

### OpenAI Mode

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=your-configured-model
```

The OpenAI key is read only by the FastAPI backend. Do not put it in any `NEXT_PUBLIC_*` variable.

After changing AI environment variables in Docker, recreate the backend:

```powershell
docker compose up -d --force-recreate backend
```

Safe provider verification, after signing in:

```powershell
curl.exe -b cookies.txt http://localhost:3000/api/v1/ai/status
```

The response reports the active provider, configured model, and whether a key is configured. It never returns the key.

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

The seed command creates a demo user, Waterloo-style profile, extracted resume text, five saved jobs, tracked applications with deadlines, one stored resume-suggestion analysis, and one interview practice session.

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
npm run typecheck
npm run format:check
npm run test
npm run build
```

## Continuous Integration

GitHub Actions runs on pushes to `main` and on pull requests:

- Backend: installs Python dependencies, runs Alembic migrations against PostgreSQL, imports `app.main`, and runs pytest in `AI_PROVIDER=mock` mode.
- Frontend: runs `npm ci`, linting, formatting checks, Vitest tests, production build, and TypeScript type checking.
- Docker: validates development and production Compose configuration and builds production backend/frontend images.

CI never requires or calls OpenAI and does not contain secrets.

## Production Deployment

The default `docker-compose.yml` is a development stack. It uses development Docker targets, bind mounts source files, and runs the frontend with `next dev`.

For containerized production, use the production targets directly or the provided production Compose overlay:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Required production environment variables:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
JWT_SECRET=<long-random-secret-at-least-32-characters>
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
APP_URL=https://your-frontend.example
CORS_ORIGINS=https://your-frontend.example
NEXT_PUBLIC_API_URL=https://your-backend.example
BACKEND_INTERNAL_URL=https://your-backend.example
AI_PROVIDER=mock
```

`BACKEND_INTERNAL_URL` must be available while building the production frontend image because the current Next.js rewrite configuration is evaluated during `next build`.

For OpenAI-backed production, add:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=<backend-only-openai-key>
OPENAI_MODEL=<model-name>
```

Production safety checks reject missing `APP_URL`, the known development JWT secret, weak production JWT secrets, insecure production cookies, wildcard CORS origins, invalid AI providers, and `AI_PROVIDER=openai` without an API key.

Production backend start command:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
```

Production frontend commands:

```bash
npm run build
npm run start
```

Deployment health check:

```text
/api/v1/health
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
5. Open `/dashboard` and confirm application counts and stage counts are summarized.

## Manual AI Agents Test

1. Keep `AI_PROVIDER=mock` for local deterministic development, or configure `AI_PROVIDER=openai` with a backend-only key.
2. Create a profile, upload a resume, and save a job posting.
3. Open `/agents` and confirm Job Finder, Job Application, and Job Preparation agents are listed.
4. Open `/agents/job-finder`, search with your profile or a prompt, and confirm results use fit labels rather than numerical scores.
5. Save a result, then use `Prepare application` or `Prepare for this job`.
6. In Job Application, click `Generate` and confirm the backend returns application summary, keywords, grounded emphasis, questions for missing information, cover letter draft, autofill preview, and warnings.
7. In Job Preparation, generate role analysis, resume advice, and preparation plan. Confirm recommendations stay grounded in saved profile/resume evidence and unknowns remain explicit.
8. Edit the job, profile, or resume and confirm older role analyses and preparation plans show stale warnings; regenerate role analysis before creating a new preparation plan.

Real AI workflows currently include:

- Resume suggestions: `POST /api/v1/analyses/resume-suggestions`
- Application draft: `POST /api/v1/agents/application-draft`
- Role analysis: `POST /api/v1/agents/role-analysis`
- Preparation plan: `POST /api/v1/agents/preparation-plan`
- Interview prep and answer feedback: `POST /api/v1/interviews/sessions` and `POST /api/v1/interviews/sessions/{session_id}/questions/{question_id}/answers`

Deterministic workflows remain:

- Core CRUD for profile, resume metadata, saved jobs, and application tracker
- Mock provider outputs when `AI_PROVIDER=mock`

## Manual AI Job Search Test

1. Sign in and open `http://localhost:3000/agents/job-finder`.
2. Choose `Use my profile`, adjust filters, and click `Find jobs for me`.
3. Switch to `Describe what you want`, click an example prompt, and click `Search jobs`.
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

## Current Limitations

- Job discovery defaults to mock data unless optional providers are configured.
- Uploaded PDF bytes are not persisted, only metadata and extracted text.
- Next.js is pinned to `16.3.0-preview.9` because npm audit currently resolves the active PostCSS advisory through that release line; revisit when the stable line contains the same fix.
- The removed task workflow is intentionally out of scope for the current version; action planning is represented through applications, deadlines, and next actions.

## Future Improvements

- Optional screenshot assets for the README
- Account deletion/export controls
- More frontend interaction tests for agent approval and interview practice
