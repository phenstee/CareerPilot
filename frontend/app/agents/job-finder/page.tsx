import Link from "next/link";

import { JobSearchAgent } from "@/components/job-search-agent";

export default function JobFinderAgentPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Smart Job Finder
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Find jobs that fit your direction
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Search from your profile or describe what you want. Results use
              fit labels and evidence, not numerical ratings.
            </p>
          </div>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            All agents
          </Link>
        </div>
        <JobSearchAgent />
      </div>
    </main>
  );
}
