"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-coral/20 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="inline-flex rounded-md bg-coral/10 p-3 text-orange-800">
            <AlertTriangle aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Error
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {error.message ||
                "CareerPilot could not finish loading this page."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
