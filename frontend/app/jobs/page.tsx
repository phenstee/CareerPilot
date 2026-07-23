import { Plus } from "lucide-react";
import Link from "next/link";

import { JobsList } from "@/components/jobs-list";

export default function JobsPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Jobs
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Saved job postings
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Save roles manually, search your list, and keep notes before
              turning a job into an application in the next phase.
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New job
          </Link>
        </div>
        <JobsList />
      </div>
    </main>
  );
}
