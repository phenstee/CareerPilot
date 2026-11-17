"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Plus } from "lucide-react";

import type { ApiUser, ApplicationStage } from "@/lib/api";
import { getDashboard } from "@/lib/api";
import {
  daysUntil,
  formatLongDate,
  relativeDays,
  SOON_DAYS
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DateTile, Monogram } from "@/components/ui/date-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { PipelineSteps } from "@/components/ui/pipeline-steps";
import { StageLabel, stageStyle } from "@/components/ui/stage";

const pipelineStages: ApplicationStage[] = [
  "Preparing",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer"
];

function greetingFor(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const noopSubscribe = () => () => {};

/** Time-of-day greeting from the browser clock; "Hello" during SSR. */
function useGreeting(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => greetingFor(new Date().getHours()),
    () => "Hello"
  );
}

function plural(count: number, word: string): string {
  const spelled = count === 1 ? "one" : String(count);
  return `${spelled} ${word}${count === 1 ? "" : "s"}`;
}

export function DashboardSummary({ user }: { user: ApiUser | null }) {
  const greeting = useGreeting();
  const firstName = user?.full_name?.trim().split(/\s+/)[0];

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  const dashboard = dashboardQuery.data;
  const today = new Date();
  const deadlines = (dashboard?.upcoming_deadlines ?? []).filter(
    (application) => application.deadline
  );
  const soonCount = deadlines.filter(
    (application) =>
      daysUntil(application.deadline as string, today) <= SOON_DAYS
  ).length;

  let fact: string | null = null;
  if (dashboard) {
    fact =
      soonCount > 0
        ? `${plural(soonCount, "deadline")} in the next ${SOON_DAYS} days`
        : deadlines.length > 0
          ? `next deadline ${relativeDays(
              daysUntil(deadlines[0].deadline as string, today)
            ).toLowerCase()}`
          : "no upcoming deadlines";
  }

  return (
    <>
      <PageHeader
        title={
          firstName ? (
            <>
              {greeting}, <span className="voice">{firstName}</span>
            </>
          ) : (
            "Dashboard"
          )
        }
        description={
          <>
            {formatLongDate(today)}
            {fact ? ` · ${fact}` : null}
          </>
        }
        actions={
          <>
            <Link href="/agents/job-finder" className="button button-secondary">
              Find jobs
            </Link>
            <Link href="/jobs/new" className="button button-primary">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add job
            </Link>
          </>
        }
      />

      {dashboardQuery.isPending ? (
        <div className="space-y-9">
          <div className="surface h-40 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-2">
            <LoadingState label="Loading deadlines" rows={4} />
            <LoadingState label="Loading saved jobs" rows={3} />
          </div>
        </div>
      ) : dashboardQuery.isError || !dashboard ? (
        <ErrorState
          message="Your dashboard didn't load. Check your connection and try again."
          onRetry={() => dashboardQuery.refetch()}
        />
      ) : (
        <div className="space-y-9">
          <section
            aria-labelledby="pipeline-heading"
            className="surface px-4 pb-5 pt-5 sm:px-7 sm:pt-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="pipeline-heading" className="section-title">
                Your pipeline
              </h2>
              <Link href="/applications" className="link-arrow">
                Open board
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <PipelineSteps
              label="Applications by stage"
              steps={pipelineStages.map((stage) => {
                const count = dashboard.counts_by_stage[stage] ?? 0;
                return {
                  key: stage,
                  label: stage,
                  value: count,
                  tint: stageStyle[stage].tint,
                  dot: stageStyle[stage].dot,
                  muted: count === 0,
                  href: "/applications"
                };
              })}
            />
          </section>

          <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 lg:gap-8">
            <section aria-labelledby="coming-up-heading" className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 id="coming-up-heading" className="section-title">
                  Coming up
                </h2>
                <Link href="/applications" className="link-arrow">
                  All applications
                </Link>
              </div>
              {deadlines.length > 0 ? (
                <ul className="surface divide-y divide-line overflow-hidden">
                  {deadlines.slice(0, 5).map((application) => {
                    const days = daysUntil(
                      application.deadline as string,
                      today
                    );
                    const soon = days <= SOON_DAYS;
                    return (
                      <li key={application.id}>
                        <Link
                          href={`/applications/${application.id}`}
                          className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-canvas sm:grid-cols-[auto_1fr_auto] sm:px-5"
                        >
                          <DateTile
                            date={application.deadline as string}
                            soon={soon}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {application.job_title}
                            </span>
                            <span className="block truncate text-meta text-muted">
                              {application.company}
                            </span>
                          </span>
                          <span className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:col-start-3 sm:flex-col sm:items-end">
                            {soon ? (
                              <Badge tone="warning">{relativeDays(days)}</Badge>
                            ) : (
                              <span className="text-meta text-muted">
                                {relativeDays(days)}
                              </span>
                            )}
                            <StageLabel stage={application.stage} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="No upcoming deadlines"
                  description="When you add a deadline to an application, it shows up here with a countdown."
                  action={
                    <Link
                      href="/applications"
                      className="button button-secondary"
                    >
                      Open applications
                    </Link>
                  }
                />
              )}
            </section>

            <section aria-labelledby="recent-heading" className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 id="recent-heading" className="section-title">
                  Recently saved
                </h2>
                <Link href="/jobs" className="link-arrow">
                  All jobs
                </Link>
              </div>
              {dashboard.recent_jobs.length > 0 ? (
                <ul className="surface divide-y divide-line overflow-hidden">
                  {dashboard.recent_jobs.slice(0, 4).map((job) => (
                    <li
                      key={job.id}
                      className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
                    >
                      <Monogram name={job.company} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="block truncate rounded-sm text-sm font-semibold text-ink hover:text-accent"
                        >
                          {job.title}
                        </Link>
                        <p className="truncate text-meta text-muted">
                          {[job.company, job.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Link
                        href={`/agents/job-prep?job=${job.id}`}
                        className="link-arrow flex-none"
                        aria-label={`Prepare for ${job.title} at ${job.company}`}
                      >
                        Prepare
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No saved jobs yet"
                  description="Save a posting you found, or search for roles that match your profile."
                  action={
                    <>
                      <Link
                        href="/agents/job-finder"
                        className="button button-secondary"
                      >
                        Find jobs
                      </Link>
                      <Link href="/jobs/new" className="button button-ghost">
                        Add a job by hand
                      </Link>
                    </>
                  }
                />
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
