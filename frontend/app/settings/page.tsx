import Link from "next/link";

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
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Account and development settings
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Review your signed-in account and the local MVP configuration
              choices.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-500">Name</dt>
                <dd className="text-right text-ink">
                  {user?.full_name ?? "Not signed in"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-500">Email</dt>
                <dd className="text-right text-ink">
                  {user?.email ?? "Not available"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-500">Created</dt>
                <dd className="text-right text-ink">
                  {user?.created_at ? formatDate(user.created_at) : "Not set"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Local AI mode</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              CareerPilot runs with the mock AI provider by default. Set
              `AI_PROVIDER=openai` and configure `OPENAI_API_KEY` only when you
              want real model calls.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/agents"
                className="inline-flex justify-center rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Open AI agents
              </Link>
              <Link
                href="/agent"
                className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400"
              >
                Controlled agent
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">Data controls</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This MVP stores profile details, saved jobs, application records,
              extracted resume text, generated analyses, interview practice, and
              agent audit logs in the project database. Uploaded PDFs are not
              stored as original files.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link
                href="/profile"
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Edit profile
              </Link>
              <Link
                href="/resume"
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Manage resume
              </Link>
              <Link
                href="/jobs"
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-ink transition hover:border-lagoon/50"
              >
                Saved jobs
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
