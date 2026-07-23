"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Columns3, Loader2, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  APPLICATION_STAGES,
  ApplicationStage,
  listApplications,
  TrackedApplication
} from "@/lib/api";

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function ApplicationsView() {
  const [view, setView] = useState<"board" | "table">("board");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = useMemo(
    () => ({
      company: company.trim(),
      role: role.trim(),
      stage,
      date_from: dateFrom,
      date_to: dateTo
    }),
    [company, dateFrom, dateTo, role, stage]
  );
  const applicationsQuery = useQuery({
    queryKey: ["applications", params],
    queryFn: () => listApplications(params)
  });

  const grouped = useMemo(() => {
    const groups = new Map<ApplicationStage, TrackedApplication[]>(
      APPLICATION_STAGES.map((applicationStage) => [applicationStage, []])
    );
    for (const application of applicationsQuery.data?.items ?? []) {
      groups.get(application.stage)?.push(application);
    }
    return groups;
  }, [applicationsQuery.data?.items]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_190px_160px_160px]">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"
            />
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Filter company"
              className="w-full rounded-md border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Filter role"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            aria-label="Filter by stage"
            className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          >
            <option value="">All stages</option>
            {APPLICATION_STAGES.map((applicationStage) => (
              <option key={applicationStage} value={applicationStage}>
                {applicationStage}
              </option>
            ))}
          </select>
          <input
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            aria-label="Applied from"
            type="date"
            className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
          <input
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="Applied to"
            type="date"
            className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
        </div>
        <div className="mt-4 inline-flex rounded-md border border-slate-300 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-slate-600 transition aria-pressed:bg-lagoon aria-pressed:text-white"
          >
            <Columns3 aria-hidden="true" className="h-4 w-4" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-slate-600 transition aria-pressed:bg-lagoon aria-pressed:text-white"
          >
            <Table2 aria-hidden="true" className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {applicationsQuery.isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-lagoon"
          />
        </div>
      ) : null}

      {applicationsQuery.isError ? (
        <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
          Unable to load applications.
        </div>
      ) : null}

      {applicationsQuery.data && applicationsQuery.data.total === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No tracked applications match this view. Open a saved job to start
          tracking it.
        </div>
      ) : null}

      {applicationsQuery.data && applicationsQuery.data.total > 0 ? (
        view === "board" ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {APPLICATION_STAGES.map((applicationStage) => (
              <section
                key={applicationStage}
                className="min-h-40 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-ink">
                    {applicationStage}
                  </h2>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {applicationsQuery.data.counts_by_stage[applicationStage] ??
                      0}
                  </span>
                </div>
                <div className="space-y-3">
                  {(grouped.get(applicationStage) ?? []).map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <ApplicationsTable applications={applicationsQuery.data.items} />
        )
      ) : null}
    </section>
  );
}

function ApplicationCard({ application }: { application: TrackedApplication }) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
    >
      <h3 className="text-sm font-semibold text-ink">
        {application.job_title}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{application.company}</p>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
        Deadline {formatDate(application.deadline)}
      </p>
      {application.next_action ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
          {application.next_action}
        </p>
      ) : null}
    </Link>
  );
}

function ApplicationsTable({
  applications
}: {
  applications: TrackedApplication[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Next action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-ink">
                  <Link
                    href={`/applications/${application.id}`}
                    className="hover:text-lagoon"
                  >
                    {application.job_title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {application.company}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-lagoon/10 px-2 py-1 text-xs font-semibold text-lagoon">
                    {application.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(application.date_applied)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(application.deadline)}
                </td>
                <td className="max-w-xs px-4 py-3 text-slate-600">
                  <span className="line-clamp-2">
                    {application.next_action || "Not set"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
