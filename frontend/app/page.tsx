import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Sparkles
} from "lucide-react";

import { getHealth } from "@/lib/api";

const pillars = [
  "Track applications without AI",
  "Ground recommendations in your profile",
  "Approve every agent data change"
];

export default async function HomePage() {
  const health = await getHealth().catch(() => null);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 py-10 lg:min-h-[calc(100vh-3rem)] lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-lagoon/20 bg-white/80 px-3 py-2 text-sm font-medium text-lagoon shadow-sm">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Portfolio-quality MVP foundation
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
            CareerPilot
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            A responsive career workspace for students to manage profiles,
            resumes, jobs, applications, interview preparation, and carefully
            controlled AI assistance.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Open dashboard
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Sign in
            </a>
          </div>
        </div>

        <div className="w-full flex-1 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-coral/10 text-coral">
              <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                System status
              </h2>
              <p className="text-sm text-slate-500">Phase 1 service wiring</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
              <dt className="text-slate-600">Backend API</dt>
              <dd
                className={
                  health
                    ? "font-semibold text-lagoon"
                    : "font-semibold text-coral"
                }
              >
                {health ? health.status : "offline"}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
              <dt className="text-slate-600">AI provider</dt>
              <dd className="font-semibold text-ink">
                {health?.ai_provider ?? "mock"}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
              <dt className="text-slate-600">Environment</dt>
              <dd className="font-semibold text-ink">
                {health?.environment ?? "development"}
              </dd>
            </div>
          </dl>

          <ul className="mt-6 space-y-3">
            {pillars.map((pillar) => (
              <li
                key={pillar}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 flex-none text-lagoon"
                />
                <span>{pillar}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
