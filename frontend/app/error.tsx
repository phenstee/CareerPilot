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
      <div className="mx-auto max-w-3xl rounded-xl border border-coral/20 bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="inline-flex rounded-lg bg-coral/10 p-3 text-coral">
            <AlertTriangle aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="page-eyebrow">
              Error
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {error.message ||
                "CareerPilot could not finish loading this page."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="button button-primary"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="button button-secondary"
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
