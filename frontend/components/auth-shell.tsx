import type { ReactNode } from "react";
import { BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";

const trustPoints = [
  "Track applications at your own pace",
  "AI recommendations grounded in your profile",
  "Review before any agent data change"
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
    <main className="grid min-h-screen bg-paper lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-ink px-12 py-10 text-white lg:flex lg:flex-col">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight">CareerPilot</p>
            <p className="text-xs text-white/55">Career command center</p>
          </div>
        </div>

        <div className="relative mt-16 max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-100">
            Career search, organized
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">
            A focused workspace for the next step in your career.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/70">
            Keep jobs, applications, resumes, and interview preparation in one
            trusted place.
          </p>
        </div>

        <ul className="relative mt-auto space-y-3">
          {trustPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-sm text-white/75"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 flex-none text-brand-100"
              />
              <span>{point}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Human review built in
          </li>
        </ul>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="font-bold tracking-tight text-ink">
              CareerPilot
            </span>
          </div>
          <div className="surface p-6 sm:p-8">
            <p className="page-eyebrow">CareerPilot</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer ? (
            <p className="mt-5 text-center text-sm text-muted">{footer}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
