import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/ui/wordmark";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-bar max-w-app items-center px-4 sm:px-6 lg:px-8">
        <Wordmark href="/dashboard" />
      </header>
      <main className="mx-auto max-w-app px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <p className="voice text-lg">Page not found</p>
        <h1 className="mt-2 max-w-2xl font-serif text-display-2 font-medium text-ink">
          There&apos;s nothing at this address.
        </h1>
        <p className="mt-4 max-w-prose text-body text-ink-2">
          The link may be out of date, or the job or application it pointed to
          was deleted.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link href="/dashboard" className="button button-primary">
            Go to dashboard
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link href="/applications" className="button button-secondary">
            Applications
          </Link>
        </div>
      </main>
    </div>
  );
}
