"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Sparkles
} from "lucide-react";

import type {
  EvidenceItem,
  QualificationGap
} from "@/lib/api";

type Priority = "high" | "medium" | "low";

const priorityStyles: Record<Priority, string> = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
  low: "bg-surface-muted text-muted"
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
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${priorityStyles[resolved]}`}
    >
      {resolved === "high" ? (
        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
      ) : null}
      {priorityLabels[resolved]}
    </span>
  );
}

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
    <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-surface via-surface to-ai-soft p-5 shadow-card sm:p-6">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-ai-deep">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-[0.12em]">
            AI snapshot
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SignalColumn
            title="Top strengths"
            items={strengths}
            empty="No strengths surfaced yet."
            tone="strength"
          />
          <SignalColumn
            title="Focus before interview"
            items={gaps}
            empty="No major gaps surfaced."
            tone="gap"
          />
        </div>
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
  const Icon = tone === "strength" ? CheckCircle2 : AlertTriangle;
  const iconClass =
    tone === "strength" ? "text-success" : "text-warning";
  return (
    <div className="rounded-xl bg-surface/90 p-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-subtle">
        {title}
      </h3>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Icon
                aria-hidden="true"
                className={`mt-0.5 h-4 w-4 flex-none ${iconClass}`}
              />
              <p className="text-sm font-medium leading-5 text-ink">{item}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">{empty}</p>
        )}
      </div>
    </div>
  );
}

export function GapInsight({
  gap
}: {
  gap: QualificationGap;
}) {
  const details = [
    {
      label: "Current evidence",
      icon: FileText,
      value: gap.current_evidence || "Not clearly evidenced in your profile."
    },
    {
      label: "What to prepare",
      icon: ArrowRight,
      value: gap.recommendation
    }
  ];

  return (
    <details className="group rounded-xl border border-border bg-surface p-4 transition hover:border-brand-100 hover:shadow-card">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-warning/10 text-warning">
          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="text-sm font-semibold leading-5 text-ink">
              {gap.requirement}
            </span>
            <PriorityBadge severity={gap.severity} />
          </span>
          <span className="mt-1.5 block text-sm leading-6 text-muted">
            {gap.recommendation
              ? shortRecommendation(gap.recommendation)
              : "Review this requirement before the interview."}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 h-4 w-4 flex-none text-muted-subtle transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {details.map((detail) => (
          <div key={detail.label} className="grid grid-cols-[1.25rem_1fr] gap-2">
            <detail.icon
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 text-brand-600"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-subtle">
                {detail.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink">{detail.value}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export function EvidenceInsight({
  evidence
}: {
  evidence: EvidenceItem;
}) {
  return (
    <details className="group rounded-xl border border-border bg-surface p-4 transition hover:border-brand-100 hover:shadow-card">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-success/10 text-success">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-5 text-ink">
            {evidence.claim}
          </span>
          <span className="mt-1 block text-sm leading-6 text-muted">
            {evidence.evidence}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 h-4 w-4 flex-none text-muted-subtle transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-subtle">
          Supporting evidence
        </p>
        <p className="mt-2 text-sm leading-6 text-ink">{evidence.evidence}</p>
      </div>
    </details>
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
    <section className="rounded-xl border border-ai-soft bg-ai-soft/70 p-4">
      <div className="flex items-center gap-2 text-ai-deep">
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        <h3 className="text-sm font-bold uppercase tracking-[0.08em]">
          {title}
        </h3>
      </div>
      <ol className="mt-3 space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ai text-xs font-bold text-white">
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
    <div className="flex items-center gap-2 text-muted">
      {icon}
      <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
        {children}
      </h3>
    </div>
  );
}

export function UncertaintyList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <CircleHelp aria-hidden="true" className="h-4 w-4" />
        <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
          Open questions
        </h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted">
            <span className="text-muted-subtle">?</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortRecommendation(value: string): string {
  const sentence = value.split(/(?<=[.!?])\s+/)[0];
  return sentence.length > 170 ? `${sentence.slice(0, 167)}...` : sentence;
}
