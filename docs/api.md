# CareerPilot API

The backend serves OpenAPI documentation at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Phase 1 Endpoints

### `GET /api/v1/health`

Returns service status and basic runtime configuration.

Example response:

```json
{
  "status": "ok",
  "service": "careerpilot-api",
  "environment": "development",
  "ai_provider": "mock"
}
```

## Auth Endpoints

### `POST /api/v1/auth/register`

Creates a user and sets an HttpOnly session cookie.

### `POST /api/v1/auth/login`

Authenticates a user and sets an HttpOnly session cookie.

### `POST /api/v1/auth/logout`

Clears the session cookie.

### `GET /api/v1/auth/me`

Returns the current authenticated user. Requires the session cookie.

## Profile Endpoints

### `GET /api/v1/profile`

Returns the signed-in user's career profile. New users receive an empty profile shape with `id: null`.

### `PUT /api/v1/profile`

Creates or replaces the signed-in user's profile data, including skills, projects, and experiences.

## Resume Endpoints

### `GET /api/v1/resume`

Returns the signed-in user's uploaded resume metadata, or `null`.

### `POST /api/v1/resume`

Uploads or replaces a PDF resume. The backend validates file type and size, extracts readable PDF text, and stores the extracted text.

### `GET /api/v1/resume/text`

Returns the extracted resume text for later explicit AI workflows.

### `DELETE /api/v1/resume`

Deletes the signed-in user's resume record.

## Job Posting Endpoints

### `GET /api/v1/jobs`

Lists the signed-in user's saved job postings. Supports `search`, `company`, `employment_type`, `skip`, and `limit`.

### `POST /api/v1/jobs`

Creates a manually saved job posting.

### `GET /api/v1/jobs/{job_id}`

Returns one owned job posting.

### `PUT /api/v1/jobs/{job_id}`

Updates one owned job posting.

### `DELETE /api/v1/jobs/{job_id}`

Deletes one owned job posting.

## Job Search Endpoints

### `POST /api/v1/job-search/profile`

Searches for normalized job results using the signed-in user's saved profile plus optional filters. The default local source is a clearly labeled mock provider.

### `POST /api/v1/job-search/prompt`

Converts natural-language search instructions into structured filters and keywords, searches configured job sources, deduplicates results, and returns ranked normalized jobs.

### `POST /api/v1/job-search/save`

Saves one discovered job through the existing saved-job system. The backend rejects unsafe non-HTTPS source URLs and avoids duplicates for the signed-in user.

## Analysis Endpoints

### `GET /api/v1/analyses`

Lists stored resume-suggestion results for the signed-in user. Supports `job_posting_id`, `analysis_type`, `skip`, and `limit`.

### `POST /api/v1/analyses/resume-suggestions`

Creates and stores structured resume-tailoring suggestions for an owned saved job. This is surfaced through the Job Preparation Agent. The response may suggest rewrites, but it must not fabricate resume bullets or overwrite the uploaded resume.

### `GET /api/v1/analyses/{analysis_id}`

Returns one owned stored analysis result.

## Interview Endpoints

### `GET /api/v1/interviews`

Lists interview preparation sessions for an owned application. Requires `application_id`.

### `POST /api/v1/interviews/sessions`

Generates and stores interview questions, preparation plan, strong topics, and weak areas for an owned application.

### `GET /api/v1/interviews/sessions/{session_id}`

Returns one owned interview practice session with questions and previous answer attempts.

### `POST /api/v1/interviews/sessions/{session_id}/questions/{question_id}/answers`

Stores a typed practice answer and returns structured feedback. Feedback critiques the answer and may include an improved outline, but it must not claim a fabricated answer is what the user said.

## Controlled Agent Endpoints

### `GET /api/v1/agent/conversations`

Lists the signed-in user's controlled agent conversations.

### `GET /api/v1/agent/conversations/{conversation_id}`

Returns one owned agent conversation with messages, action proposals, and audit logs.

### `POST /api/v1/agent/messages`

Stores a user message and returns the agent response. Read-only tools can summarize profile, saved jobs, applications, deadlines, and resume suggestions immediately. Writable actions are returned only as proposals.

### `POST /api/v1/agent/proposals/{proposal_id}/approve`

Approves an owned pending proposal, validates its Pydantic arguments, executes the allowlisted backend action, and logs `approved` plus `executed`.

### `POST /api/v1/agent/proposals/{proposal_id}/reject`

Rejects an owned pending proposal without executing a database mutation and logs `rejected`.
