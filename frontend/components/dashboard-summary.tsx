"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bot, CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";

import { getDashboard } from "@/lib/api";

const HIDDEN_DASHBOARD_STAGES = new Set([
  "Saved",
  "Preparing",
  "Online Assessment",
  "Withdrawn"
]);

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
  const visibleStageCounts = Object.entries(dashboard.counts_by_stage).filter(
    ([stage]) => !HIDDEN_DASHBOARD_STAGES.has(stage)
  );
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
    }
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
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

      <section className="grid gap-4 lg:grid-cols-2">
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

        <DashboardPanel title="Stage counts">
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleStageCounts.map(([stage, count]) => (
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
      </section>

      <section>
        <DashboardPanel title="AI Agents" icon="agents">
          <p className="text-sm leading-6 text-slate-600">
            Find opportunities, prepare applications, and get ready for
            interviews.
          </p>
          <Link
            href="/agents"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lagoon"
          >
            Open AI agents
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </DashboardPanel>
      </section>
    </div>
  );
}

function DashboardPanel({
  title,
  children,
  icon = "calendar"
}: {
  title: string;
  children: React.ReactNode;
  icon?: "calendar" | "agents";
}) {
  const Icon = icon === "agents" ? Bot : CalendarClock;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon aria-hidden="true" className="h-4 w-4 text-lagoon" />
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyPanelText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}
