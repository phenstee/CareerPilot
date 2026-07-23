export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  ai_provider: string;
};

export type ApiUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

export type AuthResponse = {
  user: ApiUser;
};

export type AuthPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type ProjectInput = {
  name: string;
  description: string;
  technologies: string[];
  link: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type ExperienceInput = {
  organization: string;
  position: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
};

export type ProfilePayload = {
  full_name: string;
  school: string;
  program: string;
  graduation_year: number | null;
  target_roles: string[];
  preferred_locations: string[];
  technical_skills: string[];
  soft_skills: string[];
  coursework: string[];
  career_goals: string;
  projects: ProjectInput[];
  experiences: ExperienceInput[];
};

export type ProfileResponse = ProfilePayload & {
  id: string | null;
  projects: Array<ProjectInput & { id: string }>;
  experiences: Array<ExperienceInput & { id: string }>;
  created_at: string | null;
  updated_at: string | null;
};

export type ResumeResponse = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
  extracted_text_preview: string;
  extracted_text_length: number;
};

export type JobPostingPayload = {
  title: string;
  company: string;
  location: string;
  job_url: string | null;
  employment_type: string;
  description: string;
  notes: string;
};

export type JobPosting = JobPostingPayload & {
  id: string;
  date_saved: string;
  created_at: string;
  updated_at: string;
};

export type JobPostingListResponse = {
  items: JobPosting[];
  total: number;
};

export const APPLICATION_STAGES = [
  "Saved",
  "Preparing",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn"
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type ApplicationPayload = {
  job_posting_id: string;
  stage: ApplicationStage;
  date_applied: string | null;
  deadline: string | null;
  follow_up_date: string | null;
  notes: string;
  important_contacts: string[];
  next_action: string;
};

export type ApplicationStageHistory = {
  id: string;
  from_stage: ApplicationStage | null;
  to_stage: ApplicationStage;
  changed_at: string;
  note: string;
};

export type TrackedApplication = Omit<ApplicationPayload, "stage"> & {
  id: string;
  stage: ApplicationStage;
  job_title: string;
  company: string;
  location: string;
  employment_type: string;
  created_at: string;
  updated_at: string;
  stage_history: ApplicationStageHistory[];
};

export type ApplicationListResponse = {
  items: TrackedApplication[];
  total: number;
  counts_by_stage: Record<ApplicationStage, number>;
};

export type CareerTaskPayload = {
  application_id: string | null;
  title: string;
  explanation: string;
  priority: TaskPriority;
  estimated_effort: string;
  related_skill: string;
  suggested_deadline: string | null;
  is_completed: boolean;
};

export type CareerTask = CareerTaskPayload & {
  id: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  application_company: string | null;
  application_role: string | null;
};

export type CareerTaskListResponse = {
  items: CareerTask[];
  total: number;
};

export type ResumeRewriteSuggestion = {
  original_text: string;
  suggested_text: string;
  rationale: string;
};

export type JobMatchAnalysisOutput = {
  overall_match_score: number;
  score_explanation: string;
  matching_skills: string[];
  missing_or_weak_skills: string[];
  relevant_experiences_and_projects: string[];
  important_job_requirements: string[];
  recommended_preparation_priorities: string[];
  potential_resume_improvements: string[];
  portfolio_project_ideas: string[];
  uncertainties: string[];
  supported_facts: string[];
  suggestions_for_improvement: string[];
  unknowns: string[];
};

export type ResumeSuggestionsOutput = {
  keywords: string[];
  relevant_existing_resume_content: string[];
  suggested_additions?: string[];
  less_important_items?: string[];
  suggested_rewrites?: ResumeRewriteSuggestion[];
  missing_information_questions?: string[];
  application_checklist?: string[];
  uncertainties?: string[];
};

export type JobAnalysis = {
  id: string;
  job_posting_id: string;
  job_title: string;
  company: string;
  analysis_type: "job_match" | "resume_suggestions";
  provider: string;
  match_score: number | null;
  result: JobMatchAnalysisOutput | ResumeSuggestionsOutput;
  created_at: string;
  updated_at: string;
};

export type JobAnalysisListResponse = {
  items: JobAnalysis[];
  total: number;
};

export type JobSearchFilters = {
  location: string;
  workplace_types: Array<"Remote" | "Hybrid" | "Onsite">;
  employment_types: string[];
  experience_levels: Array<
    "Internship" | "Entry-level" | "Junior" | "Mid-level" | "Senior"
  >;
  preferred_role: string;
  date_posted: "Any time" | "Past 24 hours" | "Past week" | "Past month";
  minimum_match_score: number;
};

export type NormalizedJobResult = {
  external_id: string;
  title: string;
  company: string;
  location: string;
  workplace_type: "Remote" | "Hybrid" | "Onsite";
  employment_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  source: string;
  source_url: string;
  posted_at: string | null;
  discovered_at: string;
  short_description: string;
  description: string;
  requirements: string[];
  skills: string[];
  match_score: number;
  match_reasons: string[];
  qualification_gaps: string[];
  is_mock: boolean;
};

export type JobSearchResponse = {
  mode: "profile" | "prompt";
  filters: JobSearchFilters;
  strategy: string;
  results: NormalizedJobResult[];
  warnings: string[];
  provider_failures: string[];
  profile_incomplete: boolean;
};

export type SaveDiscoveredJobResponse = {
  id: string;
  already_saved: boolean;
};

export type DashboardResponse = {
  active_applications: number;
  saved_jobs: number;
  priority_tasks: number;
  counts_by_stage: Record<ApplicationStage, number>;
  upcoming_deadlines: TrackedApplication[];
  follow_ups_due: TrackedApplication[];
  recent_jobs: JobPosting[];
  recent_analyses: JobAnalysis[];
  priority_task_items: CareerTask[];
  today: string;
};

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }

  return (
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000"
  );
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("CareerPilot API is unavailable");
  }

  return response.json() as Promise<HealthResponse>;
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // Fall through to a friendly default message.
  }

  return "Something went wrong. Please try again.";
}

export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ProfileResponse>;
}

export async function saveProfile(
  payload: ProfilePayload
): Promise<ProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ProfileResponse>;
}

export async function getResume(): Promise<ResumeResponse | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/resume`, {
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ResumeResponse | null>;
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/resume`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ResumeResponse>;
}

export async function deleteResume(): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/resume`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

export async function listJobs(params?: {
  search?: string;
  company?: string;
  employment_type?: string;
}): Promise<JobPostingListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.company) searchParams.set("company", params.company);
  if (params?.employment_type)
    searchParams.set("employment_type", params.employment_type);

  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/jobs${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobPostingListResponse>;
}

export async function createJob(
  payload: JobPostingPayload
): Promise<JobPosting> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobPosting>;
}

export async function getJob(jobId: string): Promise<JobPosting> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}`, {
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobPosting>;
}

export async function updateJob(
  jobId: string,
  payload: JobPostingPayload
): Promise<JobPosting> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobPosting>;
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

export async function listApplications(params?: {
  company?: string;
  stage?: string;
  role?: string;
  date_from?: string;
  date_to?: string;
}): Promise<ApplicationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.company) searchParams.set("company", params.company);
  if (params?.stage) searchParams.set("stage", params.stage);
  if (params?.role) searchParams.set("role", params.role);
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);

  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/applications${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ApplicationListResponse>;
}

export async function createApplication(
  payload: ApplicationPayload
): Promise<TrackedApplication> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<TrackedApplication>;
}

export async function getApplication(
  applicationId: string
): Promise<TrackedApplication> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/applications/${applicationId}`,
    {
      credentials: "include",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<TrackedApplication>;
}

export async function updateApplication(
  applicationId: string,
  payload: ApplicationPayload
): Promise<TrackedApplication> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/applications/${applicationId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<TrackedApplication>;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/applications/${applicationId}`,
    {
      method: "DELETE",
      credentials: "include"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

export async function listTasks(params?: {
  include_completed?: boolean;
}): Promise<CareerTaskListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.include_completed !== undefined) {
    searchParams.set("include_completed", String(params.include_completed));
  }
  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/tasks${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<CareerTaskListResponse>;
}

export async function createTask(
  payload: CareerTaskPayload
): Promise<CareerTask> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<CareerTask>;
}

export async function updateTask(
  taskId: string,
  payload: CareerTaskPayload
): Promise<CareerTask> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<CareerTask>;
}

export async function completeTask(taskId: string): Promise<CareerTask> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/tasks/${taskId}/complete`,
    {
      method: "PATCH",
      credentials: "include"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<CareerTask>;
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

export async function listAnalyses(params?: {
  job_posting_id?: string;
  analysis_type?: "job_match" | "resume_suggestions";
}): Promise<JobAnalysisListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.job_posting_id)
    searchParams.set("job_posting_id", params.job_posting_id);
  if (params?.analysis_type)
    searchParams.set("analysis_type", params.analysis_type);
  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/analyses${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobAnalysisListResponse>;
}

export async function createJobMatchAnalysis(
  jobPostingId: string
): Promise<JobAnalysis> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/analyses/job-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ job_posting_id: jobPostingId })
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobAnalysis>;
}

export async function createResumeSuggestions(
  jobPostingId: string
): Promise<JobAnalysis> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/analyses/resume-suggestions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ job_posting_id: jobPostingId })
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobAnalysis>;
}

export async function searchJobsByProfile(
  payload: JobSearchFilters
): Promise<JobSearchResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/job-search/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobSearchResponse>;
}

export async function searchJobsByPrompt(payload: {
  prompt: string;
  use_profile_context: boolean;
}): Promise<JobSearchResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/job-search/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<JobSearchResponse>;
}

export async function saveDiscoveredJob(
  result: NormalizedJobResult
): Promise<SaveDiscoveredJobResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/job-search/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ result })
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SaveDiscoveredJobResponse>;
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/dashboard`, {
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<DashboardResponse>;
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: payload.email, password: payload.password })
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(
  payload: Required<AuthPayload>
): Promise<AuthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}
