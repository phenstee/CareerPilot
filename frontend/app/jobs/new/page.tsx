import Link from "next/link";

import { JobSearchAgent } from "@/components/job-search-agent";

export default function NewJobPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              AI job search
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Find jobs that fit you
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Let CareerPilot analyze your profile or follow your instructions
              to discover relevant opportunities.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            All jobs
          </Link>
        </div>
        <JobSearchAgent />
      </div>
    </main>
  );
}
