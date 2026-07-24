"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  createApplication,
  deleteJob,
  getJob,
  listApplications
} from "@/lib/api";
import { JobForm } from "@/components/job-form";

export function JobDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const jobQuery = useQuery({
    queryKey: ["job", params.id],
    queryFn: () => getJob(params.id)
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/jobs");
      router.refresh();
    }
  });
  const trackMutation = useMutation({
    mutationFn: async () => {
      try {
        return await createApplication({
          job_posting_id: params.id,
          stage: "Preparing",
          date_applied: null,
          deadline: null,
          follow_up_date: null,
          notes: "",
          important_contacts: [],
          next_action: "Prepare application materials"
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          const applications = await listApplications();
          const existing = applications.items.find(
            (application) => application.job_posting_id === params.id
          );
          if (existing) return existing;
        }
        throw error;
      }
    },
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/applications/${application.id}`);
      router.refresh();
    }
  });

  if (jobQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Job posting not found.
      </div>
    );
  }

  const job = jobQuery.data;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
        >
          Cancel editing
        </button>
        <JobForm job={job} />
      </div>
    );
  }

  return (
    <>
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              {job.company}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {job.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {job.location || "Location not set"} ·{" "}
              {job.employment_type || "Type not set"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {job.job_url ? (
              <Link
                href={job.job_url}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Open job
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => trackMutation.mutate()}
              disabled={trackMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {trackMutation.isPending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
              Track application
            </button>
            <Link
              href={`/agents/job-application?job=${job.id}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Prepare application
            </Link>
            <Link
              href={`/agents/job-prep?job=${job.id}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Prepare for job
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-base font-semibold text-ink">Description</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.description}
          </p>
        </section>

        {job.notes ? (
          <section className="mt-6 rounded-lg bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-ink">Notes</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {job.notes}
            </p>
          </section>
        ) : null}
      </article>
    </>
  );
}
