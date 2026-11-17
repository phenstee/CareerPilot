"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  ApplicationStage,
  createApplication,
  deleteJob,
  getJob,
  listApplications,
  updateApplication
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { JobForm } from "@/components/job-form";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, errorMessage } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StageDot } from "@/components/ui/stage";

const JOB_DETAIL_STATUSES: ApplicationStage[] = [
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
];

const NOT_TRACKED = "";

export function JobDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const statusId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const jobQuery = useQuery({
    queryKey: ["job", params.id],
    queryFn: () => getJob(params.id)
  });
  const applicationsQuery = useQuery({
    queryKey: ["applications", "job-status", params.id],
    queryFn: () => listApplications()
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/jobs");
      router.refresh();
    }
  });
  const statusMutation = useMutation({
    mutationFn: async (stage: ApplicationStage) => {
      const existing = applicationsQuery.data?.items.find(
        (application) => application.job_posting_id === params.id
      );

      if (!existing) {
        return createApplication({
          job_posting_id: params.id,
          stage,
          date_applied: null,
          deadline: null,
          follow_up_date: null,
          notes: "",
          important_contacts: [],
          next_action:
            stage === "Preparing" ? "Prepare application materials" : ""
        });
      }

      return updateApplication(existing.id, {
        job_posting_id: existing.job_posting_id,
        stage,
        date_applied: existing.date_applied,
        deadline: existing.deadline,
        follow_up_date: existing.follow_up_date,
        notes: existing.notes,
        important_contacts: existing.important_contacts,
        next_action: existing.next_action
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.refresh();
    }
  });

  if (jobQuery.isPending) {
    return (
      <>
        <div className="mb-8 space-y-3" aria-hidden="true">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-2/3 max-w-md" />
          <div className="skeleton h-4 w-1/3 max-w-xs" />
        </div>
        <LoadingState label="Loading job" rows={3} />
      </>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <>
        <PageHeader
          breadcrumb={{ href: "/jobs", label: "Saved jobs" }}
          title="Job not found"
        />
        <ErrorState
          message="This job couldn't be loaded. It may have been deleted."
          onRetry={() => jobQuery.refetch()}
        />
      </>
    );
  }

  const job = jobQuery.data;
  const application = applicationsQuery.data?.items.find(
    (item) => item.job_posting_id === job.id
  );
  // Show a tracked job's real stage even when it isn't one of the five
  // offered here (e.g. Saved), instead of falsely showing "Preparing".
  const statusOptions =
    application && !JOB_DETAIL_STATUSES.includes(application.stage)
      ? [application.stage, ...JOB_DETAIL_STATUSES]
      : JOB_DETAIL_STATUSES;
  const currentStatus = application ? application.stage : NOT_TRACKED;

  const meta = [job.company, job.location].filter(Boolean).join(" · ");

  if (isEditing) {
    return (
      <>
        <PageHeader
          breadcrumb={{ href: `/jobs/${job.id}`, label: job.title }}
          title="Edit job"
        />
        <JobForm job={job} onCancel={() => setIsEditing(false)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/jobs", label: "Saved jobs" }}
        title={job.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{meta || "Company not set"}</span>
            {job.employment_type ? <Badge>{job.employment_type}</Badge> : null}
          </span>
        }
        actions={
          <>
            {job.job_url ? (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-secondary"
              >
                Open posting
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="button button-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="button button-danger"
            >
              Delete
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="section-title">
              Description
            </h2>
            <p className="mt-3 max-w-prose whitespace-pre-wrap text-body text-ink">
              {job.description}
            </p>
          </section>
          {job.notes ? (
            <section aria-labelledby="notes-heading">
              <h2 id="notes-heading" className="section-title">
                Your notes
              </h2>
              <p className="mt-3 max-w-prose whitespace-pre-wrap rounded-2xl bg-sunken p-4 text-sm leading-6 text-ink">
                {job.notes}
              </p>
            </section>
          ) : null}
          <p className="text-meta text-muted">
            Saved {formatDate(job.date_saved)}
          </p>
        </article>

        <aside className="order-first space-y-4 lg:sticky lg:top-24 lg:order-none lg:self-start">
          <section
            className="surface p-5"
            aria-labelledby={`${statusId}-label`}
          >
            <h2
              id={`${statusId}-label`}
              className="text-sm font-semibold text-ink"
            >
              Tracking
            </h2>
            <p className="mt-1 text-meta text-muted">
              {application
                ? "This job is on your applications board."
                : "Pick a stage to add this job to your applications board."}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {application ? <StageDot stage={application.stage} /> : null}
              <label htmlFor={statusId} className="sr-only">
                Application stage
              </label>
              <select
                id={statusId}
                value={currentStatus}
                onChange={(event) => {
                  if (event.target.value === NOT_TRACKED) return;
                  statusMutation.mutate(event.target.value as ApplicationStage);
                }}
                disabled={
                  applicationsQuery.isPending || statusMutation.isPending
                }
                className="form-control"
              >
                {!application ? (
                  <option value={NOT_TRACKED}>Not tracked</option>
                ) : null}
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {statusMutation.isPending ? (
                <Spinner className="h-4 w-4 flex-none text-accent" />
              ) : null}
            </div>
            {statusMutation.isError ? (
              <p role="alert" className="form-error">
                {errorMessage(
                  statusMutation.error,
                  "The stage didn't save. Try again."
                )}
              </p>
            ) : null}
            {application ? (
              <Link
                href={`/applications/${application.id}`}
                className="link-arrow mt-3"
              >
                Open application
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : null}
          </section>

          <section className="surface p-5" aria-labelledby="prepare-heading">
            <h2 id="prepare-heading" className="text-sm font-semibold text-ink">
              Prepare
            </h2>
            <ul className="mt-2 divide-y divide-line">
              <li>
                <Link
                  href={`/agents/job-prep?job=${job.id}`}
                  className="group flex items-center justify-between gap-3 py-2.5 text-sm text-ink hover:text-accent"
                >
                  <span>
                    <span className="block font-medium">Interview prep</span>
                    <span className="block text-meta text-muted">
                      Role analysis, prep plan and practice questions
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 flex-none transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
              <li>
                <Link
                  href={`/agents/job-application?job=${job.id}`}
                  className="group flex items-center justify-between gap-3 py-2.5 text-sm text-ink hover:text-accent"
                >
                  <span>
                    <span className="block font-medium">Draft application</span>
                    <span className="block text-meta text-muted">
                      A preview and cover letter for you to edit
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 flex-none transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this job?"
        description={
          <>
            <strong className="font-semibold text-ink">{job.title}</strong> will
            be removed from your saved jobs
            {application
              ? ", along with its application, stage history and prep results"
              : ", along with any prep results"}
            . This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete job"
        pending={deleteMutation.isPending}
        error={
          deleteMutation.isError
            ? errorMessage(deleteMutation.error, "The job wasn't deleted.")
            : null
        }
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => {
          deleteMutation.reset();
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
