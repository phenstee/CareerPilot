import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { AsyncTask, JobPosting } from "@/lib/api";

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function AgentCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: Action;
  children: ReactNode;
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <ActionButton action={action} /> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PrimaryActionCard({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: Action;
  children?: ReactNode;
}) {
  return (
    <section className="surface border-brand-100 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="page-eyebrow">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        {action ? <ActionButton action={action} primary /> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function ActionButton({
  action,
  primary = false
}: {
  action: Action;
  primary?: boolean;
}) {
  const classes = primary
    ? "button button-primary"
    : "button button-secondary";

  const content = (
    <>
      {action.loading ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        action.icon
      )}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={classes}
    >
      {content}
    </button>
  );
}

export function JobPicker({
  jobs,
  selectedJobId,
  onSelect,
  getMeta
}: {
  jobs: JobPosting[];
  selectedJobId: string;
  onSelect: (jobId: string) => void;
  getMeta?: (job: JobPosting) => string;
}) {
  return (
    <aside className="surface p-4">
      <h2 className="text-base font-semibold text-ink">Saved jobs</h2>
      <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
              selectedJobId === job.id
                ? "border-brand-500 bg-brand-50"
                : "border-border bg-surface hover:border-border-strong"
            }`}
          >
            <span className="block font-semibold text-ink">{job.title}</span>
            <span className="mt-1 block text-muted">{job.company}</span>
            {getMeta ? (
              <span className="mt-1 block text-xs text-muted-subtle">
                {getMeta(job)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </aside>
  );
}

export function CompactList({
  title,
  items,
  emptyText
}: {
  title: string;
  items: string[];
  limit?: number;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return emptyText ? (
      <section>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted-subtle">{emptyText}</p>
      </section>
    ) : null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-1 divide-y divide-border text-sm leading-6 text-muted">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="py-2.5 first:pt-1 last:pb-0">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TagList({
  items,
  limit = 8
}: {
  items: string[];
  limit?: number;
}) {
  const visible = items.slice(0, limit);
  const extra = items.length - visible.length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((item) => (
        <span
          key={item}
          className="badge badge-neutral"
        >
          {item}
        </span>
      ))}
      {extra > 0 ? (
        <span className="badge badge-neutral">
          +{extra} more
        </span>
      ) : null}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
        <span>{message}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/agents/job-finder"
          className="button button-primary"
        >
          Find jobs
        </Link>
        <Link
          href="/jobs"
          className="button button-secondary"
        >
          View all jobs
        </Link>
      </div>
    </div>
  );
}

export function ErrorCallout({
  message,
  action
}: {
  message: string;
  action?: Action;
}) {
  return (
    <div className="callout-error mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
        <p>{message}</p>
      </div>
      {action ? <ActionButton action={action} /> : null}
    </div>
  );
}

export function StaleNotice({ message }: { message: string }) {
  return <ErrorCallout message={message} />;
}

export function TaskStatusNotice({ task }: { task: AsyncTask | null }) {
  if (!task) {
    return null;
  }

  const status = taskStatusCopy(task);
  const isDone = task.status === "SUCCEEDED";
  const isFailed = task.status === "FAILED";

  return (
    <div
      className={`mt-4 flex items-start gap-2 px-3 py-2 text-sm ${
        isFailed ? "callout-error" : "callout-info"
      }`}
    >
      {isDone ? (
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 text-lagoon"
        />
      ) : isFailed ? (
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
      ) : (
        <Loader2
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 animate-spin text-lagoon"
        />
      )}
      <p>{status}</p>
    </div>
  );
}

function taskStatusCopy(task: AsyncTask): string {
  if (task.status === "QUEUED") {
    return "Queued...";
  }
  if (task.status === "RUNNING") {
    return "Generating...";
  }
  if (task.status === "RETRYING") {
    return `Temporary issue - retrying (${task.attempt_count}/${task.max_attempts})...`;
  }
  if (task.status === "SUCCEEDED") {
    return "Completed.";
  }
  return task.last_error_message ?? "Generation failed. Try again.";
}
