"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  ApplicationStage,
  createApplication,
  deleteJob,
  getJob,
  listApplications,
  updateApplication
} from "@/lib/api";
import { JobForm } from "@/components/job-form";

const JOB_DETAIL_STATUSES: ApplicationStage[] = [
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
];

export function JobDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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

  if (jobQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-brand-600"
        />
      </div>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="callout-error">Job posting not found.</div>
    );
  }

  const job = jobQuery.data;
  const application = applicationsQuery.data?.items.find(
    (item) => item.job_posting_id === job.id
  );
  const currentStatus =
    application && JOB_DETAIL_STATUSES.includes(application.stage)
      ? application.stage
      : "Preparing";

  if (isEditing) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="button button-secondary"
        >
          Cancel editing
        </button>
        <JobForm job={job} />
      </div>
    );
  }

  return (
    <>
      <article className="surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="page-eyebrow">
              {job.company}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {job.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {job.location || "Location not set"} ·{" "}
              {job.employment_type || "Type not set"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {job.job_url ? (
              <Link
                href={job.job_url}
                target="_blank"
                className="button button-secondary"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Open job
              </Link>
            ) : null}
            <Link
              href={`/agents/job-application?job=${job.id}`}
              className="button button-secondary"
            >
              Prepare application
            </Link>
            <Link
              href={`/agents/job-prep?job=${job.id}`}
              className="button button-secondary"
            >
              Prepare for job
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="button button-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="button button-danger"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Application status
              </h3>
              <p className="mt-1 text-sm text-muted">
                {application
                  ? "This saved job is in your application tracker."
                  : "Choose a status to add this job to your tracker."}
              </p>
            </div>
            <label className="flex items-center gap-2">
              <span className="sr-only">Application status</span>
              {statusMutation.isPending ? (
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin text-lagoon"
                />
              ) : null}
              <select
                value={currentStatus}
                onChange={(event) =>
                  statusMutation.mutate(event.target.value as ApplicationStage)
                }
                disabled={
                  applicationsQuery.isLoading || statusMutation.isPending
                }
                className="form-control disabled:cursor-not-allowed disabled:bg-surface-muted"
              >
                {JOB_DETAIL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {statusMutation.isError ? (
            <p className="mt-3 text-sm text-danger">
              Unable to update application status.
            </p>
          ) : null}
        </section>

        <section className="mt-6">
          <h3 className="text-base font-semibold text-ink">Description</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
            {job.description}
          </p>
        </section>

        {job.notes ? (
          <section className="mt-6 rounded-xl bg-surface-muted p-4">
            <h3 className="text-base font-semibold text-ink">Notes</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
              {job.notes}
            </p>
          </section>
        ) : null}
      </article>
    </>
  );
}
