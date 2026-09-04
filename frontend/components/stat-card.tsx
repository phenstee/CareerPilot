import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  href
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      {icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
        {href ? (
          <ArrowUpRight
            aria-hidden="true"
            className="mb-1 h-4 w-4 text-muted-subtle"
          />
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-xs text-muted-subtle">{hint}</p> : null}
    </>
  );

  const className =
    "surface surface-hover block h-full p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lagoon";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
