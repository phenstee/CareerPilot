import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { JobPosting } from "@/lib/api";

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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
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
    <section className="rounded-lg border border-lagoon/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-lagoon">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
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
    ? "inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
    : "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

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
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Saved jobs</h2>
      <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
              selectedJobId === job.id
                ? "border-lagoon bg-lagoon/5"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="block font-semibold text-ink">{job.title}</span>
            <span className="mt-1 block text-slate-600">{job.company}</span>
            {getMeta ? (
              <span className="mt-1 block text-xs text-slate-500">
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
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      </section>
    ) : null;
  }

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

export function TagList({ items, limit = 8 }: { items: string[]; limit?: number }) {
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
          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
        >
          {item}
        </span>
      ))}
      {extra > 0 ? (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
          +{extra} more
        </span>
      ) : null}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-lagoon" />
        <span>{message}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-md bg-slate-100" />
        <div className="h-20 rounded-md bg-slate-100" />
        <div className="h-20 rounded-md bg-slate-100" />
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
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600">{description}</p>
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

export function ErrorCallout({
  message,
  action
}: {
  message: string;
  action?: Action;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800 sm:flex-row sm:items-center sm:justify-between">
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
