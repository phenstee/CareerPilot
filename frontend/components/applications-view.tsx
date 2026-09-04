"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Columns3,
  Loader2,
  Search,
  Table2
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  APPLICATION_STAGES,
  ApplicationStage,
  listApplications,
  TrackedApplication
} from "@/lib/api";
import { Badge } from "@/components/badge";

const HIDDEN_TRACKER_STAGES = new Set<ApplicationStage>([
  "Saved",
  "Online Assessment",
  "Withdrawn"
]);

const VISIBLE_TRACKER_STAGES = APPLICATION_STAGES.filter(
  (stage) => !HIDDEN_TRACKER_STAGES.has(stage)
);

const stageTone: Record<ApplicationStage, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  Saved: "neutral",
  Preparing: "brand",
  Applied: "brand",
  "Online Assessment": "warning",
  Interview: "success",
  Offer: "success",
  Rejected: "danger",
  Withdrawn: "neutral"
};

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
      <div className="surface p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_190px_160px_160px]">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3.5 h-4 w-4 text-muted-subtle"
            />
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Filter company"
              aria-label="Filter by company"
              className="form-control pl-9"
            />
          </label>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Filter role"
            aria-label="Filter by role"
            className="form-control"
          />
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            aria-label="Filter by stage"
            className="form-control"
          >
            <option value="">All stages</option>
            {VISIBLE_TRACKER_STAGES.map((applicationStage) => (
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
            className="form-control"
          />
          <input
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="Applied to"
            type="date"
            className="form-control"
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
            >
              <Columns3 aria-hidden="true" className="h-4 w-4" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
            >
              <Table2 aria-hidden="true" className="h-4 w-4" />
              Table
            </button>
          </div>
          {applicationsQuery.data ? (
            <p className="text-sm font-medium text-muted">
              {applicationsQuery.data.total} tracked
            </p>
          ) : null}
        </div>
      </div>

      {applicationsQuery.isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface">
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-brand-600"
          />
        </div>
      ) : null}

      {applicationsQuery.isError ? (
        <div className="callout-error">Unable to load applications.</div>
      ) : null}

      {applicationsQuery.data && applicationsQuery.data.total === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No tracked applications match this view. Open a saved job to start
          tracking it.
        </div>
      ) : null}

      {applicationsQuery.data && applicationsQuery.data.total > 0 ? (
        view === "board" ? (
          <div className="-mx-1 overflow-x-auto px-1 pb-4">
            <div className="flex min-w-[76rem] gap-4">
              {VISIBLE_TRACKER_STAGES.map((applicationStage) => (
                <section
                  key={applicationStage}
                  className="min-h-40 min-w-[15rem] flex-1 rounded-xl border border-border bg-surface-muted/60 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">
                        {applicationStage}
                      </h2>
                    </div>
                    <Badge tone={stageTone[applicationStage]}>
                      {applicationsQuery.data.counts_by_stage[
                        applicationStage
                      ] ?? 0}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {(grouped.get(applicationStage) ?? []).map(
                      (application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                        />
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
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
      className="surface surface-hover block p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-5 text-ink">
          {application.job_title}
        </h3>
        <Badge tone={stageTone[application.stage]}>{application.stage}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{application.company}</p>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-subtle">
        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
        Deadline {formatDate(application.deadline)}
      </p>
      {application.next_action ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
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
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-muted text-left text-xs font-bold uppercase tracking-[0.08em] text-muted-subtle">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Next action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-semibold text-ink">
                  <Link
                    href={`/applications/${application.id}`}
                    className="hover:text-brand-700"
                  >
                    {application.job_title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{application.company}</td>
                <td className="px-4 py-3">
                  <Badge tone={stageTone[application.stage]}>
                    {application.stage}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(application.date_applied)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(application.deadline)}
                </td>
                <td className="max-w-xs px-4 py-3 text-muted">
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
