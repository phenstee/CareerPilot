import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Settings"
          title="Account and data"
          description="Review your signed-in account and access the places where your career data is managed."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-lg bg-surface-muted px-3 py-3">
                <dt className="font-semibold text-muted">Name</dt>
                <dd className="text-right text-ink">
                  {user?.full_name ?? "Not signed in"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-surface-muted px-3 py-3">
                <dt className="font-semibold text-muted">Email</dt>
                <dd className="text-right text-ink">
                  {user?.email ?? "Not available"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-surface-muted px-3 py-3">
                <dt className="font-semibold text-muted">Member since</dt>
                <dd className="text-right text-ink">
                  {user?.created_at ? formatDate(user.created_at) : "Not set"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">
              AI and your control
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              CareerPilot keeps you in control. Agents prepare recommendations,
              but any action that changes your career data is presented for
              your review first.
            </p>
            <div className="mt-5">
              <Link href="/agents" className="button button-primary">
                Open AI agents
              </Link>
            </div>
          </section>

          <section className="surface p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">Data controls</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Profile details, saved jobs, application records, extracted
              resume text, generated analyses, and interview practice are
              stored in your CareerPilot workspace. Uploaded PDFs are not
              stored as original files.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Link
                href="/profile"
                className="rounded-lg border border-border bg-surface-muted px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Edit profile
              </Link>
              <Link
                href="/resume"
                className="rounded-lg border border-border bg-surface-muted px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Manage resume
              </Link>
              <Link
                href="/jobs"
                className="rounded-lg border border-border bg-surface-muted px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Saved jobs
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
