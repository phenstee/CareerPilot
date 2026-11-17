"use client";

import Link from "next/link";

import { Wordmark } from "@/components/ui/wordmark";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-bar max-w-app items-center px-4 sm:px-6 lg:px-8">
        <Wordmark href="/dashboard" />
      </header>
      <main className="mx-auto max-w-app px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <p className="font-serif text-lg italic text-danger">
          Something went wrong
        </p>
        <h1 className="mt-2 max-w-2xl font-serif text-display-2 font-medium text-ink">
          This page didn&apos;t finish loading.
        </h1>
        <div
          role="alert"
          className="mt-6 max-w-prose border-l-2 border-danger pl-4 text-sm leading-6 text-ink-2"
        >
          {error.message || "CareerPilot couldn't finish loading this page."}
        </div>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="button button-primary"
          >
            Try again
          </button>
          <Link href="/dashboard" className="button button-secondary">
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
