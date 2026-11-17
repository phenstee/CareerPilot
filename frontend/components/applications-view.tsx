"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import {
  APPLICATION_STAGES,
  ApplicationStage,
  listApplications,
  TrackedApplication
} from "@/lib/api";
import {
  daysUntil,
  formatDate,
  formatShortDate,
  relativeDays,
  SOON_DAYS
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StageDot, StageLabel, stageStyle } from "@/components/ui/stage";

const HIDDEN_TRACKER_STAGES = new Set<ApplicationStage>([
  "Saved",
  "Online Assessment",
  "Withdrawn"
]);

const VISIBLE_TRACKER_STAGES = APPLICATION_STAGES.filter(
  (stage) => !HIDDEN_TRACKER_STAGES.has(stage)
);

function stageId(stage: ApplicationStage) {
  return `stage-${stage.toLowerCase().replace(/\s+/g, "-")}`;
}

export function ApplicationsView() {
  const [view, setView] = useState<"board" | "table">("board");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
  const hasFilters = Object.values(params).some(Boolean);

  const applicationsQuery = useQuery({
    queryKey: ["applications", params],
    queryFn: () => listApplications(params)
  });
  const data = applicationsQuery.data;

  const grouped = useMemo(() => {
    const groups = new Map<ApplicationStage, TrackedApplication[]>(
      APPLICATION_STAGES.map((applicationStage) => [applicationStage, []])
    );
    for (const application of data?.items ?? []) {
      groups.get(application.stage)?.push(application);
    }
    return groups;
  }, [data?.items]);

  const dueThisWeek = (data?.items ?? []).filter((application) => {
    if (!application.deadline) return false;
    const days = daysUntil(application.deadline);
    return days >= 0 && days <= 7;
  }).length;

  function clearFilters() {
    setCompany("");
    setRole("");
    setStage("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description={
          data && !hasFilters
            ? `${data.total} tracked · ${
                dueThisWeek === 0
                  ? "nothing due this week"
                  : `${dueThisWeek} due this week`
              }`
            : data
              ? `${data.total} matching`
              : "Every application you're tracking, by stage."
        }
        actions={
          <Link href="/jobs/new" className="button button-primary">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add job
          </Link>
        }
      />

      <div
        role="search"
        aria-label="Filter applications"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <label className="relative min-w-0 flex-1 basis-40 sm:basis-56">
          <span className="sr-only">Company</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Company"
            className="form-control pl-9"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          aria-controls="more-filters"
          className="button button-secondary sm:hidden"
        >
          {showFilters ? "Fewer filters" : "More filters"}
        </button>
        <div
          id="more-filters"
          className={`${showFilters ? "flex" : "hidden"} w-full flex-wrap items-center gap-2 sm:contents`}
        >
          <label className="relative min-w-0 flex-1 basis-full sm:basis-56">
            <span className="sr-only">Role</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
              className="form-control pl-9"
            />
          </label>
          <label className="min-w-0 flex-1 basis-36 sm:flex-none">
            <span className="sr-only">Stage</span>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className="form-control sm:w-40"
            >
              <option value="">All stages</option>
              {VISIBLE_TRACKER_STAGES.map((applicationStage) => (
                <option key={applicationStage} value={applicationStage}>
                  {applicationStage}
                </option>
              ))}
            </select>
          </label>
          <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:flex-none sm:basis-auto">
            <span className="text-meta font-medium text-ink-2">Applied</span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Applied from</span>
              <input
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                type="date"
                title="Applied from"
                className="form-control sm:w-40"
              />
            </label>
            <span aria-hidden="true" className="text-meta text-muted">
              to
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Applied to</span>
              <input
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                type="date"
                title="Applied to"
                className="form-control sm:w-40"
              />
            </label>
          </div>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="button button-ghost"
          >
            Clear filters
          </button>
        ) : null}
        <div
          role="group"
          aria-label="View"
          className="segmented ml-auto flex-none"
        >
          <button
            type="button"
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
            className="segmented-item"
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className="segmented-item"
          >
            Table
          </button>
        </div>
      </div>

      {applicationsQuery.isPending ? (
        <BoardSkeleton />
      ) : applicationsQuery.isError || !data ? (
        <ErrorState
          message="Your applications didn't load. Check your connection and try again."
          onRetry={() => applicationsQuery.refetch()}
        />
      ) : data.total === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No applications match these filters"
            description="Try a different company, role, stage or date range."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="button button-secondary"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No applications yet"
            description="Open a saved job and set its stage to start tracking it here. Each stage gets its own column."
            action={
              <>
                <Link href="/jobs" className="button button-secondary">
                  Open saved jobs
                </Link>
                <Link href="/agents/job-finder" className="button button-ghost">
                  Find jobs
                </Link>
              </>
            }
          />
        )
      ) : view === "board" ? (
        <Board grouped={grouped} counts={data.counts_by_stage} />
      ) : (
        <ApplicationsTable applications={data.items} />
      )}
    </>
  );
}

function Board({
  grouped,
  counts
}: {
  grouped: Map<ApplicationStage, TrackedApplication[]>;
  counts: Record<ApplicationStage, number>;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function jumpTo(stage: ApplicationStage) {
    const column = document.getElementById(stageId(stage));
    const scroller = scrollerRef.current;
    if (!column || !scroller) return;
    scroller.scrollTo({ left: column.offsetLeft - scroller.offsetLeft });
  }

  return (
    <>
      <nav
        aria-label="Jump to stage"
        className="-mx-4 mb-3 overflow-x-auto px-4 lg:hidden"
      >
        <ul className="flex gap-2">
          {VISIBLE_TRACKER_STAGES.map((stage) => (
            <li key={stage}>
              <button
                type="button"
                onClick={() => jumpTo(stage)}
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 text-meta font-medium text-ink-2 hover:bg-sunken"
              >
                <StageDot stage={stage} />
                {stage}
                <span className="tabular text-muted">{counts[stage] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div
        ref={scrollerRef}
        className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:snap-none lg:overflow-visible lg:px-0"
      >
        <div className="flex gap-3 lg:grid lg:grid-cols-5">
          {VISIBLE_TRACKER_STAGES.map((stage) => {
            const items = grouped.get(stage) ?? [];
            return (
              <section
                key={stage}
                id={stageId(stage)}
                aria-labelledby={`${stageId(stage)}-heading`}
                className="flex min-h-96 w-[85%] max-w-xs flex-none snap-start flex-col rounded-xl bg-sunken p-1.5 sm:w-72 lg:w-auto lg:max-w-none"
              >
                <div
                  className={`mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2.5 ${stageStyle[stage].tint}`}
                >
                  <StageDot stage={stage} />
                  <h2
                    id={`${stageId(stage)}-heading`}
                    className="text-sm font-semibold text-ink"
                  >
                    {stage}
                  </h2>
                  <span className="tabular ml-auto font-serif text-count font-medium text-ink">
                    {counts[stage] ?? 0}
                  </span>
                </div>
                {items.length > 0 ? (
                  <ul className="space-y-1.5">
                    {items.map((application) => (
                      <li key={application.id}>
                        <ApplicationCard application={application} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-1 rounded-lg border border-dashed border-line-ui px-3 py-4 text-center text-meta text-muted">
                    Nothing here yet
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function DeadlineChip({ application }: { application: TrackedApplication }) {
  if (!application.deadline) {
    return <Badge>No deadline</Badge>;
  }
  const days = daysUntil(application.deadline);
  const date = formatShortDate(application.deadline);
  if (days >= 0 && days <= SOON_DAYS) {
    return (
      <Badge tone="warning">
        Due {date} · {relativeDays(days)}
      </Badge>
    );
  }
  return <Badge>Due {date}</Badge>;
}

function ApplicationCard({ application }: { application: TrackedApplication }) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className={`surface-hover relative block rounded-lg border border-line bg-surface py-3 pl-4 pr-3 before:absolute before:bottom-3 before:left-1.5 before:top-3 before:w-1 before:rounded-full before:content-[''] ${stageStyle[application.stage].edge}`}
    >
      <h3 className="text-sm font-semibold leading-5 text-ink">
        {application.job_title}
      </h3>
      <p className="mt-0.5 text-meta text-ink-2">{application.company}</p>
      <div className="mt-2.5">
        <DeadlineChip application={application} />
      </div>
      {application.next_action ? (
        <p className="mt-2 line-clamp-2 text-meta text-muted">
          {application.next_action}
        </p>
      ) : null}
    </Link>
  );
}

function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-5"
    >
      <span className="sr-only">Loading applications…</span>
      {VISIBLE_TRACKER_STAGES.map((stage) => (
        <div
          key={stage}
          aria-hidden="true"
          className="w-72 flex-none space-y-1.5 rounded-xl bg-sunken p-1.5 lg:w-auto"
        >
          <div className="h-11 rounded-lg bg-line/60" />
          <div className="h-24 animate-pulse rounded-lg bg-surface" />
          <div className="h-24 animate-pulse rounded-lg bg-surface" />
        </div>
      ))}
    </div>
  );
}

function ApplicationsTable({
  applications
}: {
  applications: TrackedApplication[];
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-sunken text-left text-xs font-medium text-ink-2">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Company
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Stage
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Applied
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Deadline
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Next action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {applications.map((application) => (
              <tr
                key={application.id}
                className="transition-colors duration-150 hover:bg-canvas"
              >
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  <Link
                    href={`/applications/${application.id}`}
                    className="rounded-sm hover:text-accent"
                  >
                    {application.job_title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                  {application.company}
                </td>
                <td className="px-4 py-3">
                  <StageLabel stage={application.stage} />
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3 text-ink-2">
                  {formatDate(application.date_applied, "Not yet")}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3 text-ink-2">
                  {formatDate(application.deadline, "None")}
                </td>
                <td className="min-w-48 max-w-xs px-4 py-3 text-muted">
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
