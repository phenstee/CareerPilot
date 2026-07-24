"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  APPLICATION_STAGES,
  ApplicationPayload,
  ApplicationStage,
  deleteApplication,
  getApplication,
  TrackedApplication,
  updateApplication
} from "@/lib/api";

type ApplicationFormState = Omit<ApplicationPayload, "important_contacts"> & {
  important_contacts: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function toFormState(application: TrackedApplication): ApplicationFormState {
  return {
    job_posting_id: application.job_posting_id,
    stage: application.stage,
    date_applied: application.date_applied ?? "",
    deadline: application.deadline ?? "",
    follow_up_date: application.follow_up_date ?? "",
    notes: application.notes,
    important_contacts: application.important_contacts.join("\n"),
    next_action: application.next_action
  };
}

function toPayload(values: ApplicationFormState): ApplicationPayload {
  return {
    ...values,
    date_applied: values.date_applied || null,
    deadline: values.deadline || null,
    follow_up_date: values.follow_up_date || null,
    important_contacts: values.important_contacts
      .split(/\r?\n|,/)
      .map((contact) => contact.trim())
      .filter(Boolean)
  };
}

export function ApplicationDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    applicationId: string;
    values: ApplicationFormState;
  } | null>(null);
  const applicationQuery = useQuery({
    queryKey: ["application", params.id],
    queryFn: () => getApplication(params.id)
  });

  const updateMutation = useMutation({
    mutationFn: (nextValues: ApplicationFormState) =>
      updateApplication(params.id, toPayload(nextValues)),
    onSuccess: (application) => {
      setFormError(null);
      setDraft({
        applicationId: application.id,
        values: toFormState(application)
      });
      queryClient.setQueryData(["application", application.id], application);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to update application."
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/applications");
      router.refresh();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to delete application."
      );
    }
  });

  if (applicationQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  if (applicationQuery.isError || !applicationQuery.data) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Application not found.
      </div>
    );
  }

  const application = applicationQuery.data;
  const values =
    draft?.applicationId === application.id
      ? draft.values
      : toFormState(application);
  const setValues = (nextValues: ApplicationFormState) =>
    setDraft({ applicationId: application.id, values: nextValues });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          updateMutation.mutate(values);
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              {application.company}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {application.job_title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {application.location || "Location not set"} -{" "}
              {application.employment_type || "Type not set"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Delete
          </button>
          <Link
            href={`/applications/${application.id}/interview`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            <Mic aria-hidden="true" className="h-4 w-4" />
            Practice interview
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Stage</span>
            <select
              value={values.stage}
              onChange={(event) =>
                setValues({
                  ...values,
                  stage: event.target.value as ApplicationStage
                })
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            >
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <DateField
            label="Date applied"
            value={values.date_applied ?? ""}
            onChange={(value) => setValues({ ...values, date_applied: value })}
          />
          <DateField
            label="Deadline"
            value={values.deadline ?? ""}
            onChange={(value) => setValues({ ...values, deadline: value })}
          />
          <DateField
            label="Follow-up date"
            value={values.follow_up_date ?? ""}
            onChange={(value) =>
              setValues({ ...values, follow_up_date: value })
            }
          />
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">
            Next action
          </span>
          <input
            value={values.next_action}
            onChange={(event) =>
              setValues({ ...values, next_action: event.target.value })
            }
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
        </label>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea
              value={values.notes}
              onChange={(event) =>
                setValues({ ...values, notes: event.target.value })
              }
              rows={10}
              className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Important contacts
            </span>
            <textarea
              value={values.important_contacts}
              onChange={(event) =>
                setValues({
                  ...values,
                  important_contacts: event.target.value
                })
              }
              rows={10}
              placeholder="One contact per line"
              className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
        </div>

        {formError ? (
          <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {updateMutation.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="h-4 w-4" />
          )}
          Save application
        </button>
      </form>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-ink">Stage history</h3>
        <div className="mt-4 space-y-4">
          {application.stage_history.map((event) => (
            <div key={event.id} className="border-l-2 border-lagoon/30 pl-4">
              <p className="text-sm font-semibold text-ink">
                {event.from_stage ? `${event.from_stage} to ` : ""}
                {event.to_stage}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(event.changed_at)}
              </p>
              {event.note ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {event.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
      />
    </label>
  );
}
