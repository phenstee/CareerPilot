import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {breadcrumb ? (
          <Link
            href={breadcrumb.href}
            className="mb-2 inline-flex rounded-sm text-meta font-medium text-muted hover:text-ink"
          >
            {breadcrumb.label} /
          </Link>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2 md:flex-none md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
