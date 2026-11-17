"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  ActionButton,
  AgentCard,
  CompactList,
  ErrorCallout,
  JobPicker,
  PrimaryActionCard,
  StaleNotice,
  TagList,
  TaskStatusNotice
} from "@/components/agent-result-ui";
import {
  ApplicationDraftOutput,
  ApplicationEmphasis,
  AsyncTask,
  AutofillField,
  createApplicationDraft,
  getProfile,
  listAnalyses,
  listJobs
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

export function JobApplicationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [reviewedDraftId, setReviewedDraftId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTask, setActiveTask] = useState<AsyncTask | null>(null);
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["jobs", "agent"],
    queryFn: () => listJobs()
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const draftQuery = useQuery({
    queryKey: ["analyses", selectedJobId, "application_draft"],
    queryFn: () =>
      listAnalyses({
        job_posting_id: selectedJobId,
        analysis_type: "application_draft"
      }),
    enabled: Boolean(selectedJobId)
  });

  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const profile = profileQuery.data ?? null;
  const latestDraftItem = draftQuery.data?.items[0];
  const latestDraft = latestDraftItem?.result as
    | ApplicationDraftOutput
    | undefined;
  const draftReviewed = Boolean(
    latestDraftItem?.id && reviewedDraftId === latestDraftItem.id
  );

  const draftMutation = useMutation({
    mutationFn: () => createApplicationDraft(selectedJobId, setActiveTask),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "application_draft"]
      });
      setReviewedDraftId(null);
      setCopied(false);
    }
  });

  async function copyCoverLetter() {
    if (!latestDraft?.cover_letter) return;
    await navigator.clipboard.writeText(latestDraft.cover_letter);
    setCopied(true);
  }

  if (jobsQuery.isLoading || profileQuery.isLoading) {
    return (
      <LoadingState label="Loading your saved jobs and profile" rows={4} />
    );
  }

  if (jobsQuery.isError || profileQuery.isError) {
    return (
      <ErrorState
        message="Your saved jobs or profile didn't load. Check your connection and try again."
        onRetry={() => {
          jobsQuery.refetch();
          profileQuery.refetch();
        }}
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="A draft is written for one specific posting. Save one first."
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
          setReviewedDraftId(null);
          setCopied(false);
          setActiveTask(null);
        }}
        getMeta={(job) => job.location || "Location not set"}
      />

      {selectedJob && profile ? (
        <section className="min-w-0 space-y-6">
          <PrimaryActionCard
            title={`${selectedJob.title} at ${selectedJob.company}`}
            description="Writes a short application summary, a cover letter and answers to common application questions from this posting, your profile, resume and notes. You copy what you want; nothing is submitted."
            action={{
              label: latestDraft
                ? "Regenerate application preview"
                : "Generate application preview",
              onClick: () => draftMutation.mutate(),
              disabled: !selectedJobId,
              loading: draftMutation.isPending
            }}
          >
            <p className="text-meta text-muted">
              {latestDraft
                ? "Preview ready. Start with the fixes below, then copy the cover letter."
                : "No preview yet for this job."}
            </p>
            {draftMutation.isError ? (
              <ErrorCallout
                message={
                  draftMutation.error instanceof Error
                    ? draftMutation.error.message
                    : "Unable to generate application materials."
                }
                action={{
                  label: "Retry",
                  onClick: () => draftMutation.mutate()
                }}
              />
            ) : null}
            <TaskStatusNotice task={activeTask} />
          </PrimaryActionCard>

          {latestDraft ? (
            <>
              <AgentCard title="Application readiness">
                {latestDraftItem?.is_stale ? (
                  <StaleNotice message="This preview may be stale because the job, profile, resume, or notes changed. Regenerate it before relying on it." />
                ) : null}
                <div className="grid gap-4 lg:grid-cols-split">
                  <div>
                    <p className="max-w-3xl text-sm leading-6 text-ink">
                      {latestDraft.application_summary}
                    </p>
                    <div className="mt-4">
                      <TagList items={latestDraft.keywords} limit={10} />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-sunken p-4">
                    <h3 className="text-sm font-semibold text-ink">
                      Next step
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-ink-2">
                      Resolve required missing information, then copy the cover
                      letter for manual review.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <ActionButton
                        action={{
                          label: copied
                            ? "Cover letter copied"
                            : "Copy cover letter",
                          onClick: copyCoverLetter
                        }}
                        primary
                      />
                      {selectedJob.job_url ? (
                        <ActionButton
                          action={{
                            label: "Open job posting",
                            href: selectedJob.job_url,
                            icon: (
                              <ExternalLink
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            )
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </AgentCard>

              <AgentCard title="Highest-priority fixes">
                <div className="grid gap-4 lg:grid-cols-2">
                  <CompactList
                    title="Required"
                    items={latestDraft.missing_information_questions}
                    limit={4}
                    emptyText="No required missing information found."
                  />
                  <CompactList
                    title="Warnings"
                    items={latestDraft.warnings}
                    limit={3}
                    emptyText="No major warnings returned."
                  />
                </div>
              </AgentCard>

              <AgentCard title="Resume and application alignment">
                <div className="grid gap-4 lg:grid-cols-2">
                  <EmphasisBlock
                    title="Strongly recommended"
                    items={latestDraft.emphasis}
                  />
                  <AutofillSummary items={latestDraft.autofill_preview} />
                </div>
              </AgentCard>

              <AgentCard title="Cover letter">
                <div className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                  <p className="max-w-prose whitespace-pre-wrap font-serif text-body text-ink">
                    {latestDraft.cover_letter}
                  </p>
                </div>
              </AgentCard>

              <AgentCard title="Final manual review">
                <p className="callout-info">
                  CareerPilot hasn&apos;t submitted anything or filled in any
                  form on another site. Read everything before you use it.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <ActionButton
                    action={{
                      label: draftReviewed
                        ? "Marked reviewed"
                        : "Mark preview reviewed",
                      onClick: () =>
                        latestDraftItem
                          ? setReviewedDraftId(latestDraftItem.id)
                          : null
                    }}
                    primary
                  />
                  <Link href="/profile" className="button button-secondary">
                    Edit profile evidence
                  </Link>
                </div>
              </AgentCard>
            </>
          ) : (
            <EmptyState
              title="No preview yet"
              description="Generate one to get the top fixes, a short cover letter and the application answers that need your confirmation."
            />
          )}
        </section>
      ) : (
        <EmptyState
          title="Pick a saved job"
          description="Choose a job on the left to draft an application for it."
        />
      )}
    </div>
  );
}

function EmphasisBlock({
  title,
  items
}: {
  title: string;
  items: ApplicationEmphasis[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <EmphasisItem key={`${item.item}-${index}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function EmphasisItem({ item }: { item: ApplicationEmphasis }) {
  return (
    <li>
      <details className="group rounded-lg bg-accent-subtle">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-lg px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold text-ink">
              {item.item}
            </span>
            <span className="mt-1 block text-sm leading-6 text-ink-2">
              {item.reason}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 flex-none text-muted transition-transform duration-150 group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-ink/10 px-4 pb-4 pt-3">
          <p className="text-meta font-medium text-ink-2">Evidence</p>
          <p className="mt-0.5 font-serif text-body italic text-ink">
            {item.evidence}
          </p>
        </div>
      </details>
    </li>
  );
}

function AutofillSummary({ items }: { items: AutofillField[] }) {
  const required = items.filter((item) => item.requires_confirmation);
  const ready = items.filter((item) => !item.requires_confirmation);

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Application questions</h3>
      <p className="mt-1 text-meta text-muted">
        {required.length} need your confirmation · {ready.length} ready to
        review
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <details
            key={item.field}
            className="group rounded-lg border border-line bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-lg p-3 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-semibold text-ink">{item.field}</p>
                <p className="mt-1 text-sm leading-6 text-ink-2">
                  {item.proposed_answer ??
                    "You'll need to answer this yourself."}
                </p>
              </div>
              <Badge tone={item.requires_confirmation ? "warning" : "neutral"}>
                {item.requires_confirmation ? "Confirm" : "Review"}
              </Badge>
            </summary>
            {item.evidence ? (
              <div className="border-t border-line px-3 pb-3 pt-2">
                <p className="text-meta font-medium text-ink-2">Evidence</p>
                <p className="mt-0.5 font-serif text-body italic text-ink">
                  {item.evidence}
                </p>
              </div>
            ) : null}
          </details>
        ))}
      </div>
    </section>
  );
}
