import { BriefcaseBusiness, Plus } from "lucide-react";
import Link from "next/link";

import { ApplicationsView } from "@/components/applications-view";

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Applications
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Application tracker
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Move roles through stages, track deadlines and follow-ups, and
              keep notes for every active opportunity.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Dashboard
            </Link>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Save job
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
              Saved jobs
            </Link>
          </div>
        </div>
        <ApplicationsView />
      </div>
    </main>
  );
}
