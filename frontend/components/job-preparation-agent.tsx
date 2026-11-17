"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  AgentCard,
  CompactList,
  ErrorCallout,
  HintCallout,
  JobPicker,
  PrimaryActionCard,
  StaleNotice,
  TaskStatusNotice
} from "@/components/agent-result-ui";
import {
  AsyncTask,
  createPreparationPlan,
  createRoleAnalysis,
  createResumeSuggestions,
  getProfile,
  listApplications,
  listAnalyses,
  listJobs,
  PreparationPlanOutput,
  RoleAnalysisOutput,
  ResumeSuggestionsOutput
} from "@/lib/api";
import {
  analysisQueryKey,
  canGeneratePreparationPlan,
  preparationPlanDisabledReason
} from "@/lib/job-prep-state";
import {
  EvidenceInsight,
  GapInsight,
  InsightSummary,
  RecommendationPanel,
  UncertaintyList
} from "@/components/insights";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PipelineSteps } from "@/components/ui/pipeline-steps";

export function JobPreparationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [activeTask, setActiveTask] = useState<AsyncTask | null>(null);
  const [completedByPlan, setCompletedByPlan] = useState<
    Record<string, string[]>
  >({});
  const [tab, setTab] = useState<"prep" | "resume">("prep");
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
    mutationFn: () => createResumeSuggestions(selectedJobId, setActiveTask),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: analysisQueryKey(selectedJobId, "resume_suggestions")
      });
    }
  });
  const roleAnalysisMutation = useMutation({
    mutationFn: () => createRoleAnalysis(selectedJobId, setActiveTask),
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
      return createPreparationPlan(
        {
          jobPostingId: selectedJobId,
          roleAnalysisId: latestRoleAnalysisItem?.id
        },
        setActiveTask
      );
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
    return <LoadingState label="Loading your prep workspace" rows={4} />;
  }

  if (jobsQuery.isError || profileQuery.isError || applicationsQuery.isError) {
    return (
      <ErrorState
        message="Your prep workspace didn't load. Check your connection and try again."
        onRetry={() => {
          jobsQuery.refetch();
          profileQuery.refetch();
          applicationsQuery.refetch();
        }}
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="Prep works on a specific posting. Save one first, then come back to analyze it."
        action={
          <>
            <Link href="/jobs/new" className="button button-primary">
              Add job
            </Link>
            <Link href="/agents/job-finder" className="button button-secondary">
              Find jobs
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-sidebar">
      <JobPicker
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelect={(jobId) => {
          setSelectedJobId(jobId);
          setActiveTask(null);
        }}
        getMeta={(job) => {
          const app = applicationsQuery.data?.items.find(
            (item) => item.job_posting_id === job.id
          );
          return `${job.location || "Location not set"}${app ? ` · ${app.stage}` : ""}`;
        }}
      />

      {selectedJob ? (
        <section className="min-w-0 space-y-6">
          <PrimaryActionCard
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
            <PipelineSteps
              label="Prep steps"
              steps={[
                {
                  key: "analysis",
                  label: "Role analysis",
                  value: 1,
                  caption: latestRoleAnalysis
                    ? roleAnalysisIsStale
                      ? "Out of date"
                      : "Ready"
                    : "Not started",
                  tint: roleAnalysisIsStale
                    ? "bg-highlight-subtle"
                    : "bg-accent-subtle",
                  dot: roleAnalysisIsStale ? "bg-highlight" : "bg-accent",
                  muted: !latestRoleAnalysis
                },
                {
                  key: "plan",
                  label: "Prep plan",
                  value: 2,
                  caption: latestPlan
                    ? `${checklistCount} tasks`
                    : "Not started",
                  tint: "bg-accent-subtle",
                  dot: "bg-accent",
                  muted: !latestPlan
                },
                {
                  key: "practice",
                  label: "Checklist",
                  value: 3,
                  caption: latestPlan
                    ? `${completedCount} of ${checklistCount} done`
                    : "Not started",
                  tint: "bg-accent-subtle",
                  dot: "bg-accent",
                  muted: !latestPlan || completedCount === 0
                }
              ]}
            />
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
            <TaskStatusNotice task={activeTask} />
          </PrimaryActionCard>

          {latestRoleAnalysis ? (
            <>
              {latestRoleAnalysisItem?.is_stale ? (
                <StaleNotice message="This role analysis may be stale because the job, profile, or resume changed. Refresh it before relying on the plan." />
              ) : null}
              <InsightSummary
                title="How you fit this role"
                description={latestRoleAnalysis.role_summary}
                strengths={latestRoleAnalysis.strengths.map(
                  (strength) => strength.claim
                )}
                gaps={latestRoleAnalysis.gaps.map((gap) => gap.requirement)}
              />
              <RecommendationPanel
                title="What to do next"
                items={latestRoleAnalysis.preparation_priorities}
              />

              <section className="space-y-3">
                <h3 className="section-title">Areas to prepare</h3>
                {latestRoleAnalysis.gaps.length > 0 ? (
                  latestRoleAnalysis.gaps.map((gap, index) => (
                    <GapInsight key={`${gap.requirement}-${index}`} gap={gap} />
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No major gaps were identified.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="section-title">Evidence to use</h3>
                {latestRoleAnalysis.strengths.length > 0 ? (
                  latestRoleAnalysis.strengths.map((strength, index) => (
                    <EvidenceInsight
                      key={`${strength.claim}-${index}`}
                      evidence={strength}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No strong evidence was returned.
                  </p>
                )}
              </section>

              <UncertaintyList items={latestRoleAnalysis.uncertainties} />
            </>
          ) : null}

          <div role="tablist" aria-label="Prep sections" className="segmented">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "prep"}
              onClick={() => setTab("prep")}
              className="segmented-item"
            >
              Prep plan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "resume"}
              onClick={() => setTab("resume")}
              className="segmented-item"
            >
              Resume advice
            </button>
          </div>

          {tab === "prep" ? (
            <AgentCard
              title="Preparation plan"
              description="A short plan with next steps first, followed by practice tasks."
              action={{
                label: latestPlan
                  ? "Regenerate plan"
                  : "Generate interview plan",
                onClick: () => planMutation.mutate(),
                disabled: !planCanGenerate,
                loading: planMutation.isPending
              }}
            >
              {planDisabledReason ? (
                <HintCallout
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
                <p className="text-sm text-muted">
                  Generate a plan after the role analysis is ready.
                </p>
              )}
            </AgentCard>
          ) : null}

          {tab === "resume" ? (
            <AgentCard
              title="Resume advice"
              description="Optional. Use this when you want to tune your resume before applying."
              action={{
                label: latestSuggestions
                  ? "Regenerate resume advice"
                  : "Generate resume advice",
                onClick: () => suggestionMutation.mutate(),
                loading: suggestionMutation.isPending
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
                <p className="text-sm text-muted">
                  Resume advice is optional and stays secondary to preparation.
                </p>
              )}
            </AgentCard>
          ) : null}

          {tab === "prep" ? (
            <AgentCard title="Checklist and practice">
              <div className="grid gap-4 lg:grid-cols-2">
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
                <div className="rounded-lg bg-sunken p-4">
                  <h3 className="text-sm font-semibold text-ink">
                    Practice questions
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Practice after the plan is ready and the job is tracked as
                    an application.
                  </p>
                  {application ? (
                    <Link
                      href={`/applications/${application.id}/interview`}
                      className="button button-secondary mt-4"
                    >
                      Open interview practice
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm text-muted">
                      Track this job as an application to unlock the stored mock
                      interview workflow.
                    </p>
                  )}
                </div>
              </div>
            </AgentCard>
          ) : null}
        </section>
      ) : (
        <EmptyState
          title="Pick a saved job"
          description="Choose a job on the left to see its role analysis, prep plan and checklist."
        />
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
      label: hasRoleAnalysis
        ? "Refresh role analysis"
        : "Generate role analysis",
      onClick: generateRoleAnalysis,
      loading: roleAnalysisPending
    };
  }

  return {
    label: hasPlan ? "Regenerate interview plan" : "Generate interview plan",
    onClick: generatePlan,
    disabled: !planCanGenerate,
    loading: planPending
  };
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
      <div className="rounded-lg bg-sunken p-4 text-sm text-muted">
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
    <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-sunken px-3 py-2 text-sm text-ink has-[:checked]:bg-accent-subtle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(itemKey, event.target.checked)}
        className="h-4 w-4 flex-none accent-accent"
      />
      <span className={checked ? "text-ink-2 line-through" : undefined}>
        {item}
      </span>
    </label>
  );
}

function formatError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
