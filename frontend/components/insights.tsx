"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import type { EvidenceItem, QualificationGap } from "@/lib/api";

type Priority = "high" | "medium" | "low";

const priorityStyles: Record<Priority, string> = {
  high: "badge-highlight",
  medium: "badge-warning",
  low: "badge-neutral"
};

const priorityLabels: Record<Priority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Lower priority"
};

function toPriority(severity?: QualificationGap["severity"]): Priority {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

export function PriorityBadge({
  level,
  severity
}: {
  level?: Priority;
  severity?: QualificationGap["severity"];
}) {
  const resolved = level ?? toPriority(severity);
  return (
    <span className={`badge flex-none ${priorityStyles[resolved]}`}>
      {priorityLabels[resolved]}
    </span>
  );
}

/** Strengths and gaps side by side: green rows and marigold rows. */
export function InsightSummary({
  title,
  description,
  strengths,
  gaps
}: {
  title: string;
  description?: string;
  strengths: string[];
  gaps: string[];
}) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-serif text-2xl font-medium text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-2">
          {description}
        </p>
      ) : null}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <SignalColumn
          title="Where you're strong"
          items={strengths}
          empty="No strengths surfaced yet."
          tone="strength"
        />
        <SignalColumn
          title="Focus before the interview"
          items={gaps}
          empty="No major gaps surfaced."
          tone="gap"
        />
      </div>
    </section>
  );
}

function SignalColumn({
  title,
  items,
  empty,
  tone
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "strength" | "gap";
}) {
  const rowClass =
    tone === "strength" ? "bg-accent-subtle" : "bg-highlight-subtle";
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.slice(0, 3).map((item) => (
            <li
              key={item}
              className={`rounded-lg px-3 py-2 text-sm leading-5 text-ink ${rowClass}`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

/** A requirement to prepare for, on a marigold row; opens for detail. */
export function GapInsight({ gap }: { gap: QualificationGap }) {
  return (
    <details className="group rounded-lg bg-highlight-subtle">
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-start justify-between gap-2">
            <span className="text-sm font-semibold leading-5 text-ink">
              {gap.requirement}
            </span>
            <PriorityBadge severity={gap.severity} />
          </span>
          <span className="mt-1 block text-sm leading-6 text-ink-2">
            {gap.recommendation
              ? shortRecommendation(gap.recommendation)
              : "Review this requirement before the interview."}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 flex-none text-muted transition-transform duration-150 group-open:rotate-180"
        />
      </summary>
      <dl className="space-y-3 border-t border-ink/10 px-4 pb-4 pt-3">
        <div>
          <dt className="text-meta font-medium text-ink-2">
            What you have now
          </dt>
          <dd className="mt-0.5 font-serif text-body italic text-ink">
            {gap.current_evidence || "Not clearly shown in your profile yet."}
          </dd>
        </div>
        <div>
          <dt className="text-meta font-medium text-ink-2">What to prepare</dt>
          <dd className="mt-0.5 text-sm leading-6 text-ink">
            {gap.recommendation}
          </dd>
        </div>
      </dl>
    </details>
  );
}

/** A strength with the evidence quoted from your profile or resume. */
export function EvidenceInsight({ evidence }: { evidence: EvidenceItem }) {
  return (
    <div className="rounded-lg bg-accent-subtle px-4 py-3">
      <p className="text-sm font-semibold leading-5 text-ink">
        {evidence.claim}
      </p>
      <p className="mt-1 font-serif text-body italic text-ink-2">
        &ldquo;{evidence.evidence}&rdquo;
      </p>
    </div>
  );
}

export function RecommendationPanel({
  items,
  title = "Recommended next steps"
}: {
  items: string[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="surface p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ol className="mt-3 space-y-3">
        {items.slice(0, 3).map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-3">
            <span className="tabular w-5 flex-none font-serif text-lg leading-6 text-accent">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-ink">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function InsightSectionLabel({
  icon,
  children
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="section-title">{children}</h3>
    </div>
  );
}

export function UncertaintyList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">Open questions</h3>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-ink-2">
            <span aria-hidden="true" className="font-serif italic text-muted">
              ?
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function shortRecommendation(value: string): string {
  const sentence = value.split(/(?<=[.!?])\s+/)[0];
  return sentence.length > 170 ? `${sentence.slice(0, 167)}...` : sentence;
}
