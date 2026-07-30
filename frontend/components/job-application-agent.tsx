"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  ActionButton,
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
  ApplicationDraftOutput,
  ApplicationEmphasis,
  AutofillField,
  createApplicationDraft,
  getProfile,
  listAnalyses,
  listJobs
} from "@/lib/api";

export function JobApplicationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [reviewedDraftId, setReviewedDraftId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    mutationFn: () => createApplicationDraft(selectedJobId),
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
    return <LoadingState message="Loading your saved jobs and profile." />;
  }

  if (jobsQuery.isError || profileQuery.isError) {
    return (
      <ErrorCallout message="Unable to load saved jobs or profile details. Refresh the page and try again." />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="Save a job first, then generate a focused application preview."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <JobPicker
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelect={(jobId) => {
          setSelectedJobId(jobId);
          setReviewedDraftId(null);
          setCopied(false);
        }}
        getMeta={(job) => job.location || "Location not set"}
      />

      {selectedJob && profile ? (
        <section className="space-y-5">
          <PrimaryActionCard
            eyebrow="Application"
            title={`${selectedJob.title} at ${selectedJob.company}`}
            description="Generate a concise, manual-use application preview from your saved job, profile, resume, and application notes."
            action={{
              label: latestDraft
                ? "Regenerate application preview"
                : "Generate application preview",
              onClick: () => draftMutation.mutate(),
              disabled: !selectedJobId,
              loading: draftMutation.isPending,
              icon: <Send aria-hidden="true" className="h-4 w-4" />
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusTile
                label="Status"
                value={latestDraft ? "Preview ready" : "Not generated"}
              />
              <StatusTile
                label="Next action"
                value={
                  latestDraft
                    ? "Review top fixes"
                    : "Generate one focused draft"
                }
              />
              <StatusTile
                label="Profile"
                value={profile.full_name || "Profile loaded"}
              />
            </div>
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
          </PrimaryActionCard>

          {latestDraft ? (
            <>
              <AgentCard title="Application readiness">
                {latestDraftItem?.is_stale ? (
                  <StaleNotice message="This preview may be stale because the job, profile, resume, or notes changed. Regenerate it before relying on it." />
                ) : null}
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                  <div>
                    <p className="max-w-3xl text-sm leading-6 text-slate-700">
                      {latestDraft.application_summary}
                    </p>
                    <div className="mt-4">
                      <TagList items={latestDraft.keywords} limit={10} />
                    </div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-ink">
                      Recommended next action
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Resolve required missing information, then copy the cover
                      letter for manual review.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <ActionButton
                        action={{
                          label: copied ? "Cover letter copied" : "Copy cover letter",
                          onClick: copyCoverLetter,
                          icon: <Copy aria-hidden="true" className="h-4 w-4" />
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
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {latestDraft.cover_letter}
                  </p>
                </div>
              </AgentCard>

              <AgentCard title="Final manual review">
                <div className="flex items-start gap-3 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-orange-800">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5" />
                  <p>
                    CareerPilot has not submitted or autofilled any external
                    website. Review everything manually before using it.
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <ActionButton
                    action={{
                      label: draftReviewed
                        ? "Marked reviewed"
                        : "Mark preview reviewed",
                      onClick: () =>
                        latestDraftItem
                          ? setReviewedDraftId(latestDraftItem.id)
                          : null,
                      icon: draftReviewed ? (
                        <CheckCircle2
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                      ) : (
                        <Send aria-hidden="true" className="h-4 w-4" />
                      )
                    }}
                    primary
                  />
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
                  >
                    Edit profile evidence
                  </Link>
                </div>
              </AgentCard>
            </>
          ) : (
            <AgentCard title="Ready when you are">
              <p className="text-sm leading-6 text-slate-600">
                Generate once to get the top issues, a short cover letter, and
                fields that need manual confirmation.
              </p>
            </AgentCard>
          )}
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          Select a saved job to begin.
        </div>
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
    <li className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
      <span className="block font-semibold text-ink">{item.item}</span>
      <span className="mt-1 block">{item.reason}</span>
      <span className="mt-1 block text-xs text-slate-500">
        Evidence: {item.evidence}
      </span>
    </li>
  );
}

function AutofillSummary({ items }: { items: AutofillField[] }) {
  const required = items.filter((item) => item.requires_confirmation);
  const ready = items.filter((item) => !item.requires_confirmation);

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Application questions</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <StatusTile label="Need confirmation" value={`${required.length}`} />
        <StatusTile label="Ready to review" value={`${ready.length}`} />
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.field}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{item.field}</p>
                <p>{item.proposed_answer ?? "Requires your manual answer"}</p>
              </div>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-lagoon">
                {item.requires_confirmation ? "Confirm" : "Review"}
              </span>
            </div>
            {item.evidence ? (
              <p className="mt-1 text-xs text-slate-500">
                Evidence: {item.evidence}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
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
