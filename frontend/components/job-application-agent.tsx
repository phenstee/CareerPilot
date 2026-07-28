"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  ApplicationDraftOutput,
  ApplicationEmphasis,
  AutofillField,
  createApplicationDraft,
  getProfile,
  listAnalyses,
  listJobs,
  ProfileResponse
} from "@/lib/api";

export function JobApplicationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [approved, setApproved] = useState(false);
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
  const latestDraft = draftQuery.data?.items[0]?.result as
    | ApplicationDraftOutput
    | undefined;

  const draftMutation = useMutation({
    mutationFn: () => createApplicationDraft(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "application_draft"]
      });
      setApproved(false);
    }
  });

  if (jobsQuery.isLoading || profileQuery.isLoading) {
    return <LoadingPanel />;
  }

  if (jobsQuery.isError || profileQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load saved jobs or profile details.
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="Save a job before preparing an application."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
          Step 1
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">Select job</h2>
        <div className="mt-4 space-y-2">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJobId(job.id);
                setApproved(false);
              }}
              className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                selectedJobId === job.id
                  ? "border-lagoon bg-lagoon/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold text-ink">{job.title}</span>
              <span className="mt-1 block text-slate-600">{job.company}</span>
            </button>
          ))}
        </div>
      </aside>

      {selectedJob && profile ? (
        <section className="space-y-5">
          <AgentPanel title="Step 2: Review profile information">
            <ProfileReview profile={profile} />
          </AgentPanel>

          <AgentPanel title="Step 3: Generate application materials">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                CareerPilot will use your saved job, profile, resume, and
                application notes from the backend.
              </p>
              <button
                type="button"
                onClick={() => draftMutation.mutate()}
                disabled={!selectedJobId || draftMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {draftMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Send aria-hidden="true" className="h-4 w-4" />
                )}
                {latestDraft ? "Regenerate" : "Generate"}
              </button>
            </div>
            {draftMutation.isError ? (
              <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
                {draftMutation.error instanceof Error
                  ? draftMutation.error.message
                  : "Unable to generate application materials."}
              </div>
            ) : null}
          </AgentPanel>

          {latestDraft ? (
            <>
              <AgentPanel title="Step 4: Prepared application materials">
                <p className="mb-4 text-sm leading-6 text-slate-700">
                  {latestDraft.application_summary}
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <EmphasisBlock
                    title="Projects and experiences to emphasize"
                    items={latestDraft.emphasis}
                  />
                  <ListBlock
                    title="Keywords to include naturally"
                    items={latestDraft.keywords}
                  />
                  <ListBlock
                    title="Missing information requiring input"
                    items={latestDraft.missing_information_questions}
                  />
                  <ListBlock title="Warnings" items={latestDraft.warnings} />
                </div>
                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-ink">
                    Cover letter draft
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {latestDraft.cover_letter}
                  </p>
                </div>
              </AgentPanel>

              <AgentPanel title="Step 5: Autofill preview">
                <div className="space-y-3">
                  {latestDraft.autofill_preview.map((item) => (
                    <AutofillPreview key={item.field} item={item} />
                  ))}
                </div>
              </AgentPanel>

              <AgentPanel title="Step 6: Review and approval">
                <div className="flex items-start gap-3 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-orange-800">
                  <AlertTriangle aria-hidden="true" className="h-5 w-5" />
                  <p>
                    CareerPilot has not submitted or autofilled any external
                    website. Review everything manually before using it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setApproved(true)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
                >
                  {approved ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Send aria-hidden="true" className="h-4 w-4" />
                  )}
                  {approved
                    ? "Approved for manual use"
                    : "Approve and continue"}
                </button>
              </AgentPanel>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
              Generate backend-powered application materials to review them
              here.
            </div>
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

function ProfileReview({ profile }: { profile: ProfileResponse }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Info label="School" value={profile.school} />
      <Info label="Program" value={profile.program} />
      <Info label="Target roles" value={profile.target_roles.join(", ")} />
      <Info label="Locations" value={profile.preferred_locations.join(", ")} />
      <Info
        label="Technical skills"
        value={profile.technical_skills.join(", ")}
      />
      <Info label="Soft skills" value={profile.soft_skills.join(", ")} />
      <Link href="/profile" className="text-sm font-semibold text-lagoon">
        Edit profile
      </Link>
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
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.item}-${index}`}
              className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600"
            >
              <span className="block font-semibold text-ink">{item.item}</span>
              <span className="mt-1 block">Evidence: {item.evidence}</span>
              <span className="mt-1 block">Why it matters: {item.reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Not available.</p>
      )}
    </section>
  );
}

function AutofillPreview({ item }: { item: AutofillField }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{item.field}</p>
          <p className="mt-1 text-sm text-slate-700">
            {item.proposed_answer ?? "Requires your manual answer"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Evidence: {item.evidence ?? "Not available"}
          </p>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-lagoon">
          {item.requires_confirmation ? "Confirm manually" : "Ready to review"}
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink">{value || "Not saved"}</p>
    </div>
  );
}
