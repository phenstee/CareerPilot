import Link from "next/link";
import { Bot, Send, UserRound } from "lucide-react";

import { DashboardSummary } from "@/components/dashboard-summary";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              {user ? `Welcome, ${user.full_name}` : "Career workspace"}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Track applications, upcoming deadlines, saved jobs, your resume,
              and your profile from one workspace.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/applications"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Applications
            </Link>
            <Link
              href="/agents"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <Bot aria-hidden="true" className="h-4 w-4" />
              AI Agents
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" />
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>

        <DashboardSummary />
      </div>
    </main>
  );
}
