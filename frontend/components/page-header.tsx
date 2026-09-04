import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
