import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Wordmark } from "@/components/ui/wordmark";

const trustPoints = [
  "The tracker works without any AI at all",
  "AI suggestions are based on your own profile and resume",
  "Nothing in your data changes until you review it"
];

export function AuthShell({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-accent-deep px-12 py-10 text-cream lg:flex lg:flex-col">
        <Wordmark href="/" tone="cream" />

        <div className="mt-20 max-w-lg">
          <p className="font-serif text-display-2 font-medium text-cream">
            Every application in one place, and{" "}
            <em className="italic text-highlight">a plan for each one.</em>
          </p>
        </div>

        <div aria-hidden="true" className="relative mt-12 h-48 max-w-sm">
          <SampleCard
            className="absolute left-0 top-0 w-72 -rotate-2"
            title="AI Engineering Intern"
            company="Boreal AI Labs"
            due="Due Nov 26"
            edge="before:bg-stage-interview"
          />
          <SampleCard
            className="absolute left-16 top-24 w-72 rotate-1"
            title="Backend Engineering Intern"
            company="Northstar Robotics"
            due="Due Nov 20 · In 3 days"
            soon
            edge="before:bg-stage-prep"
          />
        </div>

        <ul className="mt-auto space-y-3">
          {trustPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-sm leading-6 text-cream-muted"
            >
              <span
                aria-hidden="true"
                className="mt-2 h-2 w-2 flex-none rounded-full bg-highlight"
              />
              {point}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-10 lg:justify-center lg:py-10">
        <div className="lg:hidden">
          <Wordmark href="/" />
        </div>
        <div className="mx-auto w-full max-w-sm flex-1 pt-12 lg:flex-none lg:pt-0">
          <h1 className="page-title">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-ink-2">{description}</p>
          <div className="mt-8">{children}</div>
          {footer ? (
            <p className="mt-8 border-t border-line pt-5 text-sm text-ink-2">
              {footer}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function SampleCard({
  title,
  company,
  due,
  soon = false,
  edge,
  className
}: {
  title: string;
  company: string;
  due: string;
  soon?: boolean;
  edge: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-surface py-3 pl-4 pr-3 shadow-overlay before:absolute before:bottom-3 before:left-1.5 before:top-3 before:w-1 before:rounded-full before:content-[''] ${edge} ${className}`}
    >
      <p className="text-sm font-semibold leading-5 text-ink">{title}</p>
      <p className="mt-0.5 text-meta text-ink-2">{company}</p>
      <div className="mt-2.5">
        <Badge tone={soon ? "warning" : "neutral"}>{due}</Badge>
      </div>
    </div>
  );
}
