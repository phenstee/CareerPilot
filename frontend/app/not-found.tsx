import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="inline-flex rounded-lg bg-brand-50 p-3 text-brand-600">
            <Compass aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="page-eyebrow">
              Not found
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">
              This page is not available
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              The page may have moved, or you may need to return to one of the
              main CareerPilot workflows.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard"
                className="button button-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/agents"
                className="button button-secondary"
              >
                AI agents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
