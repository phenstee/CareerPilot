import Link from "next/link";
import { Suspense } from "react";

import { JobApplicationAgent } from "@/components/job-application-agent";

export default function JobApplicationAgentPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Job Application Agent
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Prepare an application preview
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Select a saved job, review your profile evidence, and approve a
              manual-use application preview.
            </p>
          </div>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            All agents
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              Loading application agent...
            </div>
          }
        >
          <JobApplicationAgent />
        </Suspense>
      </div>
    </main>
  );
}
