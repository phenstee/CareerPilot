import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const features = [
  {
    title: "Discover relevant jobs",
    description:
      "Turn your profile, skills, and preferences into a focused list of opportunities with transparent fit evidence.",
    icon: BriefcaseBusiness
  },
  {
    title: "Manage every application",
    description:
      "Move roles through a clear pipeline, track deadlines, follow-ups, contacts, and the next action that matters.",
    icon: Layers3
  },
  {
    title: "Improve your resume",
    description:
      "Keep an up-to-date PDF and let CareerPilot use the extracted text for tailored preparation and matching.",
    icon: FileText
  },
  {
    title: "Prepare with confidence",
    description:
      "Get role analysis, application previews, study plans, and structured interview practice built for each job.",
    icon: Sparkles
  }
];

const aiCapabilities = [
  "Find opportunities from your real profile",
  "Prepare application drafts for manual review",
  "Identify gaps and role-specific strengths",
  "Generate interview questions and structured feedback"
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink">
            CareerPilot
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="button button-ghost">
            Sign in
          </Link>
          <Link href="/register" className="button button-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-surface px-3 py-1.5 text-sm font-semibold text-brand-700">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            AI-enabled, human-controlled
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
            Your career search, organized.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            CareerPilot brings jobs, applications, resumes, and interview
            preparation into one focused workspace for students and early-career
            professionals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="button button-primary px-5 py-3">
              Start your career workspace
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/login" className="button button-secondary px-5 py-3">
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-subtle">
            No surprise submissions. Agents prepare work, and you stay in
            control.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-8 hidden h-32 w-32 rounded-full bg-brand-100 blur-3xl lg:block" />
          <div className="relative rounded-2xl border border-border bg-surface p-3 shadow-lift">
            <div className="rounded-xl border border-border bg-surface-muted/70 p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-subtle">
                    Career command center
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">This week</p>
                </div>
                <span className="badge badge-success">On track</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Applications", "7"],
                  ["Interviews", "2"],
                  ["Saved jobs", "14"]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-surface p-3"
                  >
                    <p className="text-xs font-medium text-muted-subtle">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ["Applied", "Frontend Engineer", "Oct 12"],
                  ["Interview", "AI Platform Intern", "Oct 18"],
                  ["Preparing", "Backend Developer", "Oct 24"]
                ].map(([stage, role, date]) => (
                  <div
                    key={`${role}-${stage}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="badge badge-brand">{stage}</span>
                      <span className="text-sm font-semibold text-ink">
                        {role}
                      </span>
                    </div>
                    <span className="text-xs text-muted-subtle">{date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="page-eyebrow">Built for focused momentum</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              From first search to final interview.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              One clean workspace for the activities that actually move a job
              search forward.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <feature.icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="page-eyebrow">AI that assists, not surprises</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Smart help with a clear human review step.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              CareerPilot uses AI to help you work faster, but it never
              silently changes your career data. Approvals and review remain
              part of every agent workflow.
            </p>
          </div>
          <div className="grid gap-3">
            {aiCapabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 flex-none text-brand-600"
                />
                <p className="text-sm font-medium leading-6 text-ink">
                  {capability}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/70 px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-brand-700">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-[0.1em]">
                  Trust and control
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Your career data. Your decisions.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                CareerPilot is designed around transparency: track without AI,
                ground recommendations in your profile, and approve every agent
                data change.
              </p>
            </div>
            <Link href="/register" className="button button-primary px-5 py-3">
              Create your account
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Bot aria-hidden="true" className="h-4 w-4 text-brand-600" />
            CareerPilot
          </div>
          <p>Organized job search for early-career candidates.</p>
        </div>
      </footer>
    </main>
  );
}
