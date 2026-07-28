"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  createPreparationPlan,
  createRoleAnalysis,
  createResumeSuggestions,
  getProfile,
  listApplications,
  listAnalyses,
  listJobs,
  PreparationPlanOutput,
  QualificationGap,
  RoleAnalysisOutput,
  ResumeSuggestionsOutput
} from "@/lib/api";

export function JobPreparationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [completedByPlan, setCompletedByPlan] = useState<
    Record<string, string[]>
  >({});
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["jobs", "prep-agent"],
    queryFn: () => listJobs()
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => listApplications()
  });
  const suggestionsQuery = useQuery({
    queryKey: ["analyses", selectedJobId, "resume_suggestions"],
    queryFn: () =>
      listAnalyses({
        job_posting_id: selectedJobId,
        analysis_type: "resume_suggestions"
      }),
    enabled: Boolean(selectedJobId)
  });
  const roleAnalysisQuery = useQuery({
    queryKey: ["analyses", selectedJobId, "role_analysis"],
    queryFn: () =>
      listAnalyses({
        job_posting_id: selectedJobId,
        analysis_type: "role_analysis"
      }),
    enabled: Boolean(selectedJobId)
  });
  const planQuery = useQuery({
    queryKey: ["analyses", selectedJobId, "preparation_plan"],
    queryFn: () =>
      listAnalyses({
        job_posting_id: selectedJobId,
        analysis_type: "preparation_plan"
      }),
    enabled: Boolean(selectedJobId)
  });

  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const application = applicationsQuery.data?.items.find(
    (item) => item.job_posting_id === selectedJobId
  );
  const latestSuggestionsItem = suggestionsQuery.data?.items[0];
  const latestSuggestions = latestSuggestionsItem?.result as
    | ResumeSuggestionsOutput
    | undefined;
  const latestRoleAnalysisItem = roleAnalysisQuery.data?.items[0];
  const latestRoleAnalysis = latestRoleAnalysisItem?.result as
    | RoleAnalysisOutput
    | undefined;
  const latestPlanItem = planQuery.data?.items[0];
  const latestPlan = latestPlanItem?.result as
    | PreparationPlanOutput
    | undefined;
  const latestPlanId = latestPlanItem?.id ?? "";
  const completedItems = new Set(
    latestPlanId ? (completedByPlan[latestPlanId] ?? []) : []
  );

  const suggestionMutation = useMutation({
    mutationFn: () => createResumeSuggestions(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "resume_suggestions"]
      });
    }
  });
  const roleAnalysisMutation = useMutation({
    mutationFn: () => createRoleAnalysis(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "role_analysis"]
      });
    }
  });
  const planMutation = useMutation({
    mutationFn: () =>
      createPreparationPlan({
        jobPostingId: selectedJobId,
        roleAnalysisId: latestRoleAnalysisItem?.id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "preparation_plan"]
      });
    }
  });

  if (
    jobsQuery.isLoading ||
    profileQuery.isLoading ||
    applicationsQuery.isLoading
  ) {
    return <LoadingPanel />;
  }

  if (jobsQuery.isError || profileQuery.isError || applicationsQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load preparation data.
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
        <h2 className="text-xl font-semibold text-ink">
          You have no saved jobs
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Save a job first, then return here to prepare for it.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/agents/job-finder"
            className="inline-flex justify-center rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white"
          >
            Find jobs
          </Link>
          <Link
            href="/jobs"
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            View all jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">
          Which saved job would you like to prepare for?
        </h2>
        <div className="mt-4 space-y-2">
          {jobs.map((job) => {
            const app = applicationsQuery.data?.items.find(
              (item) => item.job_posting_id === job.id
            );
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                  selectedJobId === job.id
                    ? "border-lagoon bg-lagoon/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block font-semibold text-ink">
                  {job.title}
                </span>
                <span className="mt-1 block text-slate-600">{job.company}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {job.location || "Location not set"}{" "}
                  {app ? `- ${app.stage}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {selectedJob ? (
        <section className="space-y-5">
          <AgentPanel title="Role overview">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                Generate a backend role analysis from the saved job, profile,
                and resume before building the preparation plan.
              </p>
              <button
                type="button"
                onClick={() => roleAnalysisMutation.mutate()}
                disabled={!selectedJobId || roleAnalysisMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {roleAnalysisMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                )}
                {latestRoleAnalysis
                  ? "Regenerate analysis"
                  : "Generate analysis"}
              </button>
            </div>
            {roleAnalysisMutation.isError ? (
              <ErrorMessage error={roleAnalysisMutation.error} />
            ) : null}
            {latestRoleAnalysis ? (
              <div className="mt-4 space-y-4">
                {latestRoleAnalysisItem?.is_stale ? <StaleNotice /> : null}
                <p className="text-sm leading-6 text-slate-700">
                  {latestRoleAnalysis.role_summary}
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <ListBlock
                    title="Core responsibilities"
                    items={latestRoleAnalysis.responsibilities}
                  />
                  <ListBlock
                    title="Required skills"
                    items={latestRoleAnalysis.required_skills}
                  />
                  <ListBlock
                    title="Preferred skills"
                    items={latestRoleAnalysis.preferred_skills}
                  />
                  <ListBlock
                    title="Important technologies"
                    items={latestRoleAnalysis.technologies}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No role analysis generated yet.
              </p>
            )}
          </AgentPanel>

          <AgentPanel title="Strengths and gaps">
            {latestRoleAnalysis ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {latestRoleAnalysisItem?.is_stale ? (
                  <div className="lg:col-span-2">
                    <StaleNotice />
                  </div>
                ) : null}
                <EvidenceBlock
                  title="Relevant evidence"
                  items={latestRoleAnalysis.strengths}
                />
                <GapBlock
                  title="Missing or unclear qualifications"
                  items={latestRoleAnalysis.gaps}
                />
                <ListBlock
                  title="Uncertainties"
                  items={latestRoleAnalysis.uncertainties}
                />
                <ListBlock
                  title="Preparation priorities"
                  items={latestRoleAnalysis.preparation_priorities}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Generate role analysis to see strengths, gaps, and priorities.
              </p>
            )}
          </AgentPanel>

          <AgentPanel title="Resume recommendations">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                Uses the existing resume recommendation workflow for this saved
                job.
              </p>
              <button
                type="button"
                onClick={() => suggestionMutation.mutate()}
                disabled={suggestionMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {suggestionMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4" />
                )}
                Generate resume advice
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {latestSuggestionsItem?.is_stale ? (
                <div className="lg:col-span-2">
                  <StaleNotice />
                </div>
              ) : null}
              <ListBlock
                title="Already relevant"
                items={
                  latestSuggestions?.relevant_existing_resume_content ?? []
                }
              />
              <ListBlock
                title="Add or emphasize"
                items={latestSuggestions?.suggested_additions ?? []}
              />
              <ListBlock
                title="Less important for this job"
                items={latestSuggestions?.less_important_items ?? []}
              />
              <ListBlock
                title="Keywords"
                items={latestSuggestions?.keywords ?? []}
              />
              <ListBlock
                title="Questions before editing"
                items={latestSuggestions?.missing_information_questions ?? []}
              />
              <RewriteBlock
                items={latestSuggestions?.suggested_rewrites ?? []}
              />
              <ListBlock
                title="Application checklist"
                items={latestSuggestions?.application_checklist ?? []}
              />
              <ListBlock
                title="Uncertainties"
                items={latestSuggestions?.uncertainties ?? []}
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Company and role research">
            <div className="grid gap-4 lg:grid-cols-3">
              <Info
                label="Verified"
                value="Open the original posting for source-of-truth company and role details."
              />
              <Info
                label="Inference"
                value={`The role appears connected to ${latestRoleAnalysis?.technologies.slice(0, 3).join(", ") || "the listed job responsibilities"}.`}
              />
              <Info
                label="Unavailable"
                value="Live company news is not enabled in mock mode."
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Preparation plan">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                Build a staged plan from the latest role analysis.
              </p>
              <button
                type="button"
                onClick={() => planMutation.mutate()}
                disabled={
                  !selectedJobId ||
                  !latestRoleAnalysis ||
                  planMutation.isPending
                }
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {planMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                )}
                {latestPlan ? "Regenerate plan" : "Generate plan"}
              </button>
            </div>
            {planMutation.isError ? (
              <ErrorMessage error={planMutation.error} />
            ) : null}
            {!latestRoleAnalysis ? (
              <p className="mt-4 text-sm text-slate-500">
                Generate role analysis first.
              </p>
            ) : null}
          </AgentPanel>

          {latestPlan ? (
            <>
              <AgentPanel title="Technical topics to study">
                <div className="grid gap-4 lg:grid-cols-2">
                  {latestPlanItem?.is_stale ? (
                    <div className="lg:col-span-2">
                      <StaleNotice />
                    </div>
                  ) : null}
                  <ListBlock
                    title="Staged plan"
                    items={latestPlan.staged_plan}
                  />
                  <ListBlock
                    title="Essential"
                    items={latestPlan.essential_topics}
                  />
                  <ListBlock
                    title="Optional"
                    items={latestPlan.optional_topics}
                  />
                  <ListBlock
                    title="Technical practice"
                    items={latestPlan.technical_practice}
                  />
                  <ListBlock
                    title="Concrete exercises"
                    items={latestPlan.concrete_exercises}
                  />
                </div>
              </AgentPanel>

              <AgentPanel title="Behavioral and research preparation">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ListBlock
                    title="Behavioral practice"
                    items={latestPlan.behavioral_practice}
                  />
                  <ListBlock
                    title="Research tasks"
                    items={latestPlan.research_tasks}
                  />
                </div>
              </AgentPanel>
            </>
          ) : null}

          <AgentPanel title="Interview-question preparation">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock
                title="Preparation priorities"
                items={latestRoleAnalysis?.preparation_priorities ?? []}
              />
              <ListBlock
                title="Suggested answer structure"
                items={[
                  "Situation",
                  "Task",
                  "Action you personally took",
                  "Result or learning",
                  "Connection back to this role"
                ]}
              />
            </div>
            {application ? (
              <Link
                href={`/applications/${application.id}/interview`}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Start mock interview
              </Link>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Track this job as an application to use the stored mock
                interview workflow.
              </p>
            )}
          </AgentPanel>

          <AgentPanel title="Preparation checklist">
            <div className="space-y-2">
              {(latestPlan?.completion_checklist ?? []).map((item) =>
                (() => {
                  const itemKey = `${latestPlanId}:${item}`;
                  return (
                    <label
                      key={itemKey}
                      className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={completedItems.has(itemKey)}
                        onChange={(event) =>
                          setCompletedByPlan((current) => {
                            const currentItems = new Set(
                              current[latestPlanId] ?? []
                            );
                            if (event.target.checked) currentItems.add(itemKey);
                            else currentItems.delete(itemKey);
                            return {
                              ...current,
                              [latestPlanId]: [...currentItems]
                            };
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-lagoon focus:ring-lagoon"
                      />
                      <span>{item}</span>
                      {completedItems.has(itemKey) ? (
                        <CheckCircle2
                          aria-hidden="true"
                          className="ml-auto h-4 w-4 text-lagoon"
                        />
                      ) : null}
                    </label>
                  );
                })()
              )}
              {!latestPlan ? (
                <p className="text-sm text-slate-500">
                  Generate a preparation plan to get a checklist.
                </p>
              ) : null}
            </div>
          </AgentPanel>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          Select a saved job to begin preparation.
        </div>
      )}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <Loader2
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-lagoon"
      />
    </div>
  );
}

function AgentPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RewriteBlock({
  items
}: {
  items: ResumeSuggestionsOutput["suggested_rewrites"];
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Suggested rewrites</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.original_text}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <span className="block font-semibold text-ink">
              {item.suggested_text}
            </span>
            <span className="mt-1 block">{item.rationale}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceBlock({
  title,
  items
}: {
  title: string;
  items: RoleAnalysisOutput["strengths"];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.claim}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <span className="block font-semibold text-ink">{item.claim}</span>
            <span className="mt-1 block">Evidence: {item.evidence}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GapBlock({
  title,
  items
}: {
  title: string;
  items: QualificationGap[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.requirement}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <span className="block font-semibold text-ink">
              {item.requirement}
            </span>
            <span className="mt-1 block">
              Evidence: {item.current_evidence ?? "Not found"}
            </span>
            <span className="mt-1 block">
              Severity: {item.severity}. {item.recommendation}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StaleNotice() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
      <p>
        This result may be stale because the job, profile, resume, or source
        analysis changed. Regenerate it before relying on it.
      </p>
    </div>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
      {error instanceof Error ? error.message : "Unable to generate AI output."}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">
        {value || "Not available"}
      </p>
    </div>
  );
}
