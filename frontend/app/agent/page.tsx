import Link from "next/link";

import { ControlledAgent } from "@/components/controlled-agent";

export default function AgentPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Controlled Agent
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Ask, review, then approve
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Use one guarded career agent for read-only checks and explicit
              application-update proposals.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/agents"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              All agents
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <ControlledAgent />
      </div>
    </main>
  );
}
