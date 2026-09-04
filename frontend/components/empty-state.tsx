import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-muted-subtle">
        {icon ?? <Inbox aria-hidden="true" className="h-5 w-5" />}
      </div>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
