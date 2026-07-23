import Link from "next/link";

import { JobForm } from "@/components/job-form";

export default function NewJobPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Jobs
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Save a job posting
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Paste the full job description and your own notes. No scraping is
              used in this MVP.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            All jobs
          </Link>
        </div>
        <JobForm />
      </div>
    </main>
  );
}
