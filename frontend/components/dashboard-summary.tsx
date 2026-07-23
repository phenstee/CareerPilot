"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Loader2, ListChecks } from "lucide-react";
import Link from "next/link";

import { getDashboard } from "@/lib/api";

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function DashboardSummary() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load your dashboard.
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const stats = [
    {
      label: "Active applications",
      value: dashboard.active_applications,
      href: "/applications",
      action: "Open applications"
    },
    {
      label: "Saved jobs",
      value: dashboard.saved_jobs,
      href: "/jobs",
      action: "Open saved jobs"
    },
    {
      label: "Priority tasks",
      value: dashboard.priority_tasks,
      href: "/tasks",
      action: "Open tasks"
    }
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-lagoon/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lagoon">
              {stat.action}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel title="Upcoming deadlines">
          {dashboard.upcoming_deadlines.length > 0 ? (
            dashboard.upcoming_deadlines.map((application) => (
              <Link
                key={application.id}
                href={`/applications/${application.id}`}
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white"
              >
                <p className="text-sm font-semibold text-ink">
                  {application.company}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {application.job_title}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(application.deadline)}
                </p>
              </Link>
            ))
          ) : (
            <EmptyPanelText>No upcoming deadlines.</EmptyPanelText>
          )}
        </DashboardPanel>

        <DashboardPanel title="Follow-ups due">
          {dashboard.follow_ups_due.length > 0 ? (
            dashboard.follow_ups_due.map((application) => (
              <Link
                key={application.id}
                href={`/applications/${application.id}`}
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white"
              >
                <p className="text-sm font-semibold text-ink">
                  {application.company}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {application.next_action || application.job_title}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(application.follow_up_date)}
                </p>
              </Link>
            ))
          ) : (
            <EmptyPanelText>No follow-ups due.</EmptyPanelText>
          )}
        </DashboardPanel>

        <DashboardPanel title="High-priority tasks">
          {dashboard.priority_task_items.length > 0 ? (
            dashboard.priority_task_items.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white"
              >
                <p className="text-sm font-semibold text-ink">{task.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {task.application_company
                    ? `${task.application_company} - ${task.application_role}`
                    : task.related_skill || "General task"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(task.suggested_deadline)}
                </p>
              </Link>
            ))
          ) : (
            <EmptyPanelText>No high-priority tasks.</EmptyPanelText>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DashboardPanel title="Stage counts">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(dashboard.counts_by_stage).map(([stage, count]) => (
              <div
                key={stage}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-600">{stage}</span>
                <span className="text-sm font-semibold text-ink">{count}</span>
              </div>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel title="Recent AI analyses">
          {dashboard.recent_analyses.length > 0 ? (
            dashboard.recent_analyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/jobs/${analysis.job_posting_id}`}
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    {analysis.company}
                  </p>
                  {analysis.match_score !== null ? (
                    <span className="rounded-md bg-lagoon/10 px-2 py-1 text-xs font-semibold text-lagoon">
                      {analysis.match_score}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {analysis.analysis_type === "job_match"
                    ? "Job match"
                    : "Resume suggestions"}{" "}
                  for {analysis.job_title}
                </p>
              </Link>
            ))
          ) : (
            <EmptyPanelText>No AI analyses yet.</EmptyPanelText>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DashboardPanel title="Recent jobs">
          {dashboard.recent_jobs.length > 0 ? (
            dashboard.recent_jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-lagoon/50 hover:bg-white"
              >
                <p className="text-sm font-semibold text-ink">{job.title}</p>
                <p className="mt-1 text-sm text-slate-600">{job.company}</p>
              </Link>
            ))
          ) : (
            <EmptyPanelText>No saved jobs yet.</EmptyPanelText>
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

function DashboardPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {title.includes("task") ? (
          <ListChecks aria-hidden="true" className="h-4 w-4 text-lagoon" />
        ) : (
          <CalendarClock aria-hidden="true" className="h-4 w-4 text-lagoon" />
        )}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyPanelText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}
