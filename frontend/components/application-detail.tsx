"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  APPLICATION_STAGES,
  ApplicationPayload,
  ApplicationStage,
  deleteApplication,
  getApplication,
  TrackedApplication,
  updateApplication
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, errorMessage } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StageDot, StageLabel } from "@/components/ui/stage";

type ApplicationFormState = Omit<ApplicationPayload, "important_contacts"> & {
  important_contacts: string;
};

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
  const fieldId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      setSavedAt(Date.now());
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
    }
  });

  if (applicationQuery.isPending) {
    return (
      <>
        <div className="mb-8 space-y-3" aria-hidden="true">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-2/3 max-w-md" />
          <div className="skeleton h-4 w-1/3 max-w-xs" />
        </div>
        <LoadingState label="Loading application" rows={4} />
      </>
    );
  }

  if (applicationQuery.isError || !applicationQuery.data) {
    return (
      <>
        <PageHeader
          breadcrumb={{ href: "/applications", label: "Applications" }}
          title="Application not found"
        />
        <ErrorState
          message="This application couldn't be loaded. It may have been deleted."
          onRetry={() => applicationQuery.refetch()}
        />
      </>
    );
  }

  const application = applicationQuery.data;
  const values =
    draft?.applicationId === application.id
      ? draft.values
      : toFormState(application);
  const setValues = (nextValues: ApplicationFormState) => {
    setSavedAt(null);
    setDraft({ applicationId: application.id, values: nextValues });
  };
  const id = (name: string) => `${fieldId}-${name}`;
  const meta = [application.company, application.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        breadcrumb={{ href: "/applications", label: "Applications" }}
        title={application.job_title}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{meta}</span>
            <StageLabel stage={application.stage} />
          </span>
        }
        actions={
          <>
            <Link
              href={`/applications/${application.id}/interview`}
              className="button button-secondary"
            >
              Practice interview
            </Link>
            <Link
              href={`/jobs/${application.job_posting_id}`}
              className="button button-ghost"
            >
              View job
            </Link>
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
        <form
          className="surface min-w-0 p-5 sm:p-6 lg:col-span-2"
          aria-label="Application details"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate(values);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={id("stage")} className="form-label">
                Stage
              </label>
              <select
                id={id("stage")}
                value={values.stage}
                onChange={(event) =>
                  setValues({
                    ...values,
                    stage: event.target.value as ApplicationStage
                  })
                }
                className="form-control"
              >
                {APPLICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <DateField
              id={id("applied")}
              label="Date applied"
              value={values.date_applied ?? ""}
              onChange={(value) =>
                setValues({ ...values, date_applied: value })
              }
            />
            <DateField
              id={id("deadline")}
              label="Deadline"
              value={values.deadline ?? ""}
              onChange={(value) => setValues({ ...values, deadline: value })}
            />
            <DateField
              id={id("follow-up")}
              label="Follow-up date"
              value={values.follow_up_date ?? ""}
              onChange={(value) =>
                setValues({ ...values, follow_up_date: value })
              }
            />
          </div>

          <div className="mt-4">
            <label htmlFor={id("next")} className="form-label">
              Next action
            </label>
            <input
              id={id("next")}
              value={values.next_action}
              onChange={(event) =>
                setValues({ ...values, next_action: event.target.value })
              }
              placeholder="e.g. Ask Mina for a referral"
              className="form-control"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={id("notes")} className="form-label">
                Notes
              </label>
              <textarea
                id={id("notes")}
                value={values.notes}
                onChange={(event) =>
                  setValues({ ...values, notes: event.target.value })
                }
                rows={8}
                className="form-control"
              />
            </div>
            <div>
              <label htmlFor={id("contacts")} className="form-label">
                Important contacts
              </label>
              <textarea
                id={id("contacts")}
                value={values.important_contacts}
                onChange={(event) =>
                  setValues({
                    ...values,
                    important_contacts: event.target.value
                  })
                }
                rows={8}
                aria-describedby={id("contacts-hint")}
                className="form-control"
              />
              <p id={id("contacts-hint")} className="form-hint">
                One per line, or separated by commas.
              </p>
            </div>
          </div>

          {formError ? (
            <p role="alert" className="callout-error mt-4">
              {formError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="button button-primary"
            >
              {updateMutation.isPending ? <Spinner /> : null}
              Save changes
            </button>
            <p role="status" className="text-meta text-success">
              {savedAt ? "Saved" : ""}
            </p>
          </div>
        </form>

        <aside aria-labelledby={id("history")} className="min-w-0">
          <h2 id={id("history")} className="section-title">
            Stage history
          </h2>
          {application.stage_history.length > 0 ? (
            <ol className="mt-4">
              {application.stage_history.map((event) => (
                <li
                  key={event.id}
                  className="relative border-l border-line pb-5 pl-5 last:border-transparent last:pb-0"
                >
                  <span className="absolute -left-1.5 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-canvas">
                    <StageDot stage={event.to_stage} />
                  </span>
                  <p className="text-sm font-medium text-ink">
                    {event.from_stage
                      ? `${event.from_stage} → ${event.to_stage}`
                      : `Started in ${event.to_stage}`}
                  </p>
                  <p className="tabular mt-0.5 text-meta text-muted">
                    {formatDateTime(event.changed_at)}
                  </p>
                  {event.note ? (
                    <p className="mt-1.5 text-sm leading-6 text-ink-2">
                      {event.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Stage changes will be listed here.
            </p>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this application?"
        description={
          <>
            Your stage history, notes, contacts and interview practice for{" "}
            <strong className="font-semibold text-ink">
              {application.job_title}
            </strong>{" "}
            will be deleted. The saved job stays. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete application"
        pending={deleteMutation.isPending}
        error={
          deleteMutation.isError
            ? errorMessage(
                deleteMutation.error,
                "The application wasn't deleted."
              )
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

function DateField({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        className="form-control"
      />
    </div>
  );
}
