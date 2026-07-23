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

## Analysis Endpoints

### `GET /api/v1/analyses`

Lists stored AI analysis results for the signed-in user. Supports `job_posting_id`, `analysis_type`, `skip`, and `limit`.

### `POST /api/v1/analyses/job-match`

Creates and stores a structured job-match analysis for an owned saved job. The provider compares only the saved job description, saved career profile, and extracted resume text.

### `POST /api/v1/analyses/resume-suggestions`

Creates and stores structured resume-tailoring suggestions for an owned saved job. The response may suggest rewrites, but it must not fabricate resume bullets or overwrite the uploaded resume.

### `GET /api/v1/analyses/{analysis_id}`

Returns one owned stored analysis result.

## Planned API Groups

- `/api/v1/interviews`
- `/api/v1/agent`
