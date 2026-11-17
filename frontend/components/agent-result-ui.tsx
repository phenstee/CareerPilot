import Link from "next/link";
import type { ReactNode } from "react";

import type { AsyncTask, JobPosting } from "@/lib/api";
import { Spinner } from "@/components/ui/loading-state";

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
          <h2 className="section-title">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-2">
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
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: Action;
  children?: ReactNode;
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-ink">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-2">
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
  const classes = primary ? "button button-primary" : "button button-secondary";

  const content = (
    <>
      {action.loading ? <Spinner /> : action.icon}
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
    <aside aria-labelledby="job-picker-heading" className="min-w-0">
      <h2
        id="job-picker-heading"
        className="mb-3 text-sm font-semibold text-ink"
      >
        Saved jobs
      </h2>
      <div className="surface max-h-list divide-y divide-line overflow-y-auto">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            aria-pressed={selectedJobId === job.id}
            className={`relative block w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
              selectedJobId === job.id
                ? "bg-accent-subtle before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-accent before:content-['']"
                : "hover:bg-canvas"
            }`}
          >
            <span className="block font-semibold text-ink">{job.title}</span>
            <span className="mt-0.5 block text-meta text-ink-2">
              {job.company}
            </span>
            {getMeta ? (
              <span className="mt-1 block text-xs text-muted">
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
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      </section>
    ) : null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-1 divide-y divide-line text-sm leading-6 text-muted">
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
        <span key={item} className="badge badge-neutral">
          {item}
        </span>
      ))}
      {extra > 0 ? (
        <span className="badge badge-neutral">+{extra} more</span>
      ) : null}
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
    <div
      role="alert"
      className="callout-error mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      {action ? <ActionButton action={action} /> : null}
    </div>
  );
}

/** Out-of-date results are a warning, not an error. */
export function StaleNotice({ message }: { message: string }) {
  return <p className="callout-warning mt-4">{message}</p>;
}

/** A missing prerequisite is a neutral hint, not an error. */
export function HintCallout({
  message,
  action
}: {
  message: string;
  action?: Action;
}) {
  return (
    <div className="callout-info mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p>{message}</p>
      {action ? <ActionButton action={action} /> : null}
    </div>
  );
}

export function TaskStatusNotice({ task }: { task: AsyncTask | null }) {
  if (!task) {
    return null;
  }

  const status = taskStatusCopy(task);
  const isDone = task.status === "SUCCEEDED";
  const isFailed = task.status === "FAILED";

  return (
    <p
      role="status"
      className={`mt-4 flex items-center gap-2 text-sm ${
        isFailed ? "callout-error" : isDone ? "text-success" : "text-ink-2"
      }`}
    >
      {!isDone && !isFailed ? (
        <Spinner className="h-4 w-4 text-accent" />
      ) : null}
      {status}
    </p>
  );
}

function taskStatusCopy(task: AsyncTask): string {
  if (task.status === "QUEUED") {
    return "Queued…";
  }
  if (task.status === "RUNNING") {
    return "Generating…";
  }
  if (task.status === "RETRYING") {
    return `Temporary issue, retrying (${task.attempt_count} of ${task.max_attempts})…`;
  }
  if (task.status === "SUCCEEDED") {
    return "Done.";
  }
  return task.last_error_message ?? "Generation failed. Try again.";
}
