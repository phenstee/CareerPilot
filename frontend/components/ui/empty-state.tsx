import type { ReactNode } from "react";

/** Left-aligned, in the space the content would take. No icon. */
export function EmptyState({
  title,
  description,
  action,
  className = ""
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-line-ui px-5 py-8 sm:px-6 ${className}`}
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">{action}</div>
      ) : null}
    </div>
  );
}
