"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  ListChecks,
  RefreshCw,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  AgentCard,
  CompactList,
  EmptyState,
  ErrorCallout,
  JobPicker,
  LoadingState,
  PrimaryActionCard,
  StaleNotice,
  TagList
} from "@/components/agent-result-ui";
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
import {
  analysisQueryKey,
  canGeneratePreparationPlan,
  preparationPlanDisabledReason
} from "@/lib/job-prep-state";

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
  const roleAnalysisIsStale = Boolean(latestRoleAnalysisItem?.is_stale);
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
        queryKey: analysisQueryKey(selectedJobId, "resume_suggestions")
      });
    }
  });
  const roleAnalysisMutation = useMutation({
    mutationFn: () => createRoleAnalysis(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: analysisQueryKey(selectedJobId, "role_analysis")
      });
      queryClient.invalidateQueries({
        queryKey: analysisQueryKey(selectedJobId, "preparation_plan")
      });
    }
  });
  const planMutation = useMutation({
    mutationFn: () => {
      if (roleAnalysisIsStale) {
        throw new Error(
          "The role analysis is outdated. Regenerate it before creating a preparation plan."
        );
      }
      return createPreparationPlan({
        jobPostingId: selectedJobId,
        roleAnalysisId: latestRoleAnalysisItem?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: analysisQueryKey(selectedJobId, "preparation_plan")
      });
    }
  });

  const planDisabledReason = preparationPlanDisabledReason({
    hasRoleAnalysis: Boolean(latestRoleAnalysis),
    roleAnalysisIsStale
  });
  const planCanGenerate = canGeneratePreparationPlan({
    selectedJobId,
    hasRoleAnalysis: Boolean(latestRoleAnalysis),
    roleAnalysisIsStale,
    isPending: planMutation.isPending
  });
  const completedCount = [...completedItems].length;
  const checklistCount = latestPlan?.completion_checklist.length ?? 0;

  if (
    jobsQuery.isLoading ||
    profileQuery.isLoading ||
    applicationsQuery.isLoading
  ) {
    return <LoadingState message="Loading your preparation workspace." />;
  }

  if (jobsQuery.isError || profileQuery.isError || applicationsQuery.isError) {
    return (
      <ErrorCallout message="Unable to load preparation data. Refresh the page and try again." />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="Save a job first, then generate a focused preparation plan."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <JobPicker
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelect={(jobId) => setSelectedJobId(jobId)}
        getMeta={(job) => {
          const app = applicationsQuery.data?.items.find(
            (item) => item.job_posting_id === job.id
          );
          return `${job.location || "Location not set"}${app ? ` - ${app.stage}` : ""}`;
        }}
      />

      {selectedJob ? (
        <section className="space-y-5">
          <PrimaryActionCard
            eyebrow="Preparation"
            title={`${selectedJob.title} at ${selectedJob.company}`}
            description={getHeroDescription({
              hasRoleAnalysis: Boolean(latestRoleAnalysis),
              hasPlan: Boolean(latestPlan),
              roleAnalysisIsStale
            })}
            action={getPrimaryAction({
              hasRoleAnalysis: Boolean(latestRoleAnalysis),
              hasPlan: Boolean(latestPlan),
              roleAnalysisIsStale,
              roleAnalysisPending: roleAnalysisMutation.isPending,
              planPending: planMutation.isPending,
              planCanGenerate,
              generateRoleAnalysis: () => roleAnalysisMutation.mutate(),
              generatePlan: () => planMutation.mutate()
            })}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusTile
                label="Role analysis"
                value={
                  latestRoleAnalysis
                    ? roleAnalysisIsStale
                      ? "Needs refresh"
                      : "Ready"
                    : "Not generated"
                }
              />
              <StatusTile
                label="Plan"
                value={latestPlan ? `${checklistCount} tasks` : "Not generated"}
              />
              <StatusTile
                label="Checklist"
                value={
                  latestPlan ? `${completedCount}/${checklistCount} done` : "0"
                }
              />
            </div>
            {roleAnalysisMutation.isError ? (
              <ErrorCallout
                message={formatError(
                  roleAnalysisMutation.error,
                  "Unable to generate role analysis."
                )}
                action={{
                  label: "Retry",
                  onClick: () => roleAnalysisMutation.mutate()
                }}
              />
            ) : null}
            {planMutation.isError ? (
              <ErrorCallout
                message={formatError(
                  planMutation.error,
                  "Unable to generate preparation plan."
                )}
                action={{
                  label: "Retry",
                  onClick: () => planMutation.mutate(),
                  disabled: !planCanGenerate
                }}
              />
            ) : null}
          </PrimaryActionCard>

          {latestRoleAnalysis ? (
            <AgentCard
              title="What to focus on"
              description="Start with the highest-impact topics before reading deeper detail."
              action={{
                label: "Refresh role analysis",
                onClick: () => roleAnalysisMutation.mutate(),
                loading: roleAnalysisMutation.isPending,
                icon: <RefreshCw aria-hidden="true" className="h-4 w-4" />
              }}
            >
              {latestRoleAnalysisItem?.is_stale ? (
                <StaleNotice message="This role analysis may be stale because the job, profile, or resume changed. Refresh it before relying on the plan." />
              ) : null}
              <p className="max-w-3xl text-sm leading-6 text-slate-700">
                {latestRoleAnalysis.role_summary}
              </p>
              <div className="mt-4">
                <CompactList
                  title="Top priorities"
                  items={latestRoleAnalysis.preparation_priorities}
                  limit={4}
                  emptyText="No priorities returned yet."
                />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <CompactList
                  title="Core responsibilities"
                  items={latestRoleAnalysis.responsibilities}
                />
                <CompactList
                  title="Required skills"
                  items={latestRoleAnalysis.required_skills}
                />
                <CompactList
                  title="Preferred skills"
                  items={latestRoleAnalysis.preferred_skills}
                />
                <section>
                  <h3 className="text-sm font-semibold text-ink">
                    Technologies
                  </h3>
                  <div className="mt-2">
                    <TagList items={latestRoleAnalysis.technologies} />
                  </div>
                </section>
              </div>
            </AgentCard>
          ) : (
            <AgentCard title="Start with a role analysis">
              <p className="text-sm leading-6 text-slate-600">
                CareerPilot needs one role analysis before it can build a
                focused preparation plan.
              </p>
            </AgentCard>
          )}

          <AgentCard
            title="Weak areas and evidence"
            description="Use this section to decide what needs practice or clarification."
          >
            {latestRoleAnalysis ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <GapBlock items={latestRoleAnalysis.gaps} />
                <EvidenceBlock items={latestRoleAnalysis.strengths} />
                <div className="lg:col-span-2">
                  <CompactList
                    title="Uncertainties"
                    items={latestRoleAnalysis.uncertainties}
                    limit={3}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Generate role analysis to see gaps and evidence.
              </p>
            )}
          </AgentCard>

          <AgentCard
            title="Preparation plan"
            description="A short plan with next steps first, followed by practice tasks."
            action={{
              label: latestPlan ? "Regenerate plan" : "Generate interview plan",
              onClick: () => planMutation.mutate(),
              disabled: !planCanGenerate,
              loading: planMutation.isPending,
              icon: <Sparkles aria-hidden="true" className="h-4 w-4" />
            }}
          >
            {planDisabledReason ? (
              <ErrorCallout
                message={planDisabledReason}
                action={
                  roleAnalysisIsStale
                    ? {
                        label: "Refresh role analysis",
                        onClick: () => roleAnalysisMutation.mutate(),
                        loading: roleAnalysisMutation.isPending
                      }
                    : undefined
                }
              />
            ) : null}
            {latestPlan ? (
              <>
                {latestPlanItem?.is_stale ? (
                  <StaleNotice message="This plan may be stale because the job, profile, resume, or source role analysis changed." />
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2">
                  <CompactList
                    title="Next steps"
                    items={latestPlan.staged_plan}
                    limit={4}
                  />
                  <CompactList
                    title="Essential topics"
                    items={latestPlan.essential_topics}
                    limit={4}
                  />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <CompactList
                    title="Technical practice"
                    items={latestPlan.technical_practice}
                  />
                  <CompactList
                    title="Behavioral practice"
                    items={latestPlan.behavioral_practice}
                  />
                  <CompactList
                    title="Concrete exercises"
                    items={latestPlan.concrete_exercises}
                  />
                  <CompactList
                    title="Research tasks"
                    items={latestPlan.research_tasks}
                  />
                  <CompactList
                    title="Optional topics"
                    items={latestPlan.optional_topics}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Generate a plan after the role analysis is ready.
              </p>
            )}
          </AgentCard>

          <AgentCard
            title="Resume advice"
            description="Optional. Use this when you want to tune your resume before applying."
            action={{
              label: latestSuggestions
                ? "Regenerate resume advice"
                : "Generate resume advice",
              onClick: () => suggestionMutation.mutate(),
              loading: suggestionMutation.isPending,
              icon: <FileText aria-hidden="true" className="h-4 w-4" />
            }}
          >
            {suggestionMutation.isError ? (
              <ErrorCallout
                message={formatError(
                  suggestionMutation.error,
                  "Unable to generate resume advice."
                )}
                action={{
                  label: "Retry",
                  onClick: () => suggestionMutation.mutate()
                }}
              />
            ) : null}
            {latestSuggestions ? (
              <>
                {latestSuggestionsItem?.is_stale ? (
                  <StaleNotice message="This resume advice may be stale because your job, profile, or resume changed." />
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2">
                  <CompactList
                    title="Add or emphasize"
                    items={latestSuggestions.suggested_additions ?? []}
                    limit={4}
                  />
                  <CompactList
                    title="Less important"
                    items={latestSuggestions.less_important_items ?? []}
                    limit={4}
                  />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <CompactList
                    title="Already relevant"
                    items={
                      latestSuggestions.relevant_existing_resume_content ?? []
                    }
                  />
                  <CompactList
                    title="Keywords"
                    items={latestSuggestions.keywords ?? []}
                  />
                  <CompactList
                    title="Questions before editing"
                    items={
                      latestSuggestions.missing_information_questions ?? []
                    }
                  />
                  <CompactList
                    title="Uncertainties"
                    items={latestSuggestions.uncertainties ?? []}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Resume advice is optional and stays secondary to preparation.
              </p>
            )}
          </AgentCard>

          <AgentCard title="Quick review">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Checklist
                latestPlanId={latestPlanId}
                items={latestPlan?.completion_checklist ?? []}
                completedItems={completedItems}
                onToggle={(itemKey, checked) =>
                  setCompletedByPlan((current) => {
                    const currentItems = new Set(current[latestPlanId] ?? []);
                    if (checked) currentItems.add(itemKey);
                    else currentItems.delete(itemKey);
                    return {
                      ...current,
                      [latestPlanId]: [...currentItems]
                    };
                  })
                }
              />
              <div className="rounded-md bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-ink">
                  Mock interview
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Practice after the plan is ready and the job is tracked as an
                  application.
                </p>
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
                    Track this job as an application to unlock the stored mock
                    interview workflow.
                  </p>
                )}
              </div>
            </div>
          </AgentCard>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          Select a saved job to begin preparation.
        </div>
      )}
    </div>
  );
}

function getHeroDescription({
  hasRoleAnalysis,
  hasPlan,
  roleAnalysisIsStale
}: {
  hasRoleAnalysis: boolean;
  hasPlan: boolean;
  roleAnalysisIsStale: boolean;
}) {
  if (!hasRoleAnalysis) {
    return "Start with a role analysis so CareerPilot can identify what matters most.";
  }
  if (roleAnalysisIsStale) {
    return "Refresh the role analysis before creating a new preparation plan.";
  }
  if (!hasPlan) {
    return "Create a short plan with the most useful tasks first.";
  }
  return "Work through the checklist and review practice tasks when you are ready.";
}

function getPrimaryAction({
  hasRoleAnalysis,
  hasPlan,
  roleAnalysisIsStale,
  roleAnalysisPending,
  planPending,
  planCanGenerate,
  generateRoleAnalysis,
  generatePlan
}: {
  hasRoleAnalysis: boolean;
  hasPlan: boolean;
  roleAnalysisIsStale: boolean;
  roleAnalysisPending: boolean;
  planPending: boolean;
  planCanGenerate: boolean;
  generateRoleAnalysis: () => void;
  generatePlan: () => void;
}) {
  if (!hasRoleAnalysis || roleAnalysisIsStale) {
    return {
      label: hasRoleAnalysis ? "Refresh role analysis" : "Generate role analysis",
      onClick: generateRoleAnalysis,
      loading: roleAnalysisPending,
      icon: <Sparkles aria-hidden="true" className="h-4 w-4" />
    };
  }

  return {
    label: hasPlan ? "Regenerate interview plan" : "Generate interview plan",
    onClick: generatePlan,
    disabled: !planCanGenerate,
    loading: planPending,
    icon: <ListChecks aria-hidden="true" className="h-4 w-4" />
  };
}

function GapBlock({ items }: { items: QualificationGap[] }) {
  if (items.length === 0) {
    return (
      <CompactList
        title="Weak areas"
        items={[]}
        emptyText="No major gaps returned."
      />
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Weak areas</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.requirement}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <span className="block font-semibold text-ink">
              {item.requirement}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Evidence: {item.current_evidence ?? "Not found"}
            </span>
            <span className="mt-1 block">{item.recommendation}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceBlock({ items }: { items: RoleAnalysisOutput["strengths"] }) {
  if (items.length === 0) {
    return (
      <CompactList
        title="Evidence to use"
        items={[]}
        emptyText="No strong evidence returned."
      />
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Evidence to use</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.claim}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <span className="block font-semibold text-ink">{item.claim}</span>
            <span className="mt-1 block">{item.evidence}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Checklist({
  latestPlanId,
  items,
  completedItems,
  onToggle
}: {
  latestPlanId: string;
  items: string[];
  completedItems: Set<string>;
  onToggle: (itemKey: string, checked: boolean) => void;
}) {
  if (items.length === 0 || !latestPlanId) {
    return (
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        Generate a preparation plan to get a short checklist.
      </div>
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Checklist</h3>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <ChecklistItem
            key={`${latestPlanId}:${item}`}
            latestPlanId={latestPlanId}
            item={item}
            completedItems={completedItems}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function ChecklistItem({
  latestPlanId,
  item,
  completedItems,
  onToggle
}: {
  latestPlanId: string;
  item: string;
  completedItems: Set<string>;
  onToggle: (itemKey: string, checked: boolean) => void;
}) {
  const itemKey = `${latestPlanId}:${item}`;
  const checked = completedItems.has(itemKey);

  return (
    <label className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(itemKey, event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-lagoon focus:ring-lagoon"
      />
      <span>{item}</span>
      {checked ? (
        <CheckCircle2 aria-hidden="true" className="ml-auto h-4 w-4 text-lagoon" />
      ) : null}
    </label>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function formatError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
