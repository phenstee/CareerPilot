"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  FileCheck2,
  FileText,
  GraduationCap,
  Layers3,
  Plus,
  Search,
  Sparkles
} from "lucide-react";

import { getDashboard } from "@/lib/api";
import { Badge } from "@/components/badge";
import { LoadingState } from "@/components/loading-state";
import { StatCard } from "@/components/stat-card";

const pipelineStages = [
  "Preparing",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer"
] as const;

function formatDate(value: string | null): string {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

const aiTools = [
  {
    title: "Smart Job Finder",
    description: "Discover relevant opportunities from your profile or a prompt.",
    href: "/agents/job-finder",
    icon: Search
  },
  {
    title: "Application Agent",
    description: "Prepare a focused application preview for manual review.",
    href: "/agents/job-application",
    icon: FileText
  },
  {
    title: "Job Preparation Agent",
    description: "Research the role, close gaps, and practice interviews.",
    href: "/agents/job-prep",
    icon: GraduationCap
  }
];

const quickActions = [
  {
    label: "Find jobs",
    description: "Use your profile to surface new opportunities.",
    href: "/agents/job-finder",
    icon: Search
  },
  {
    label: "Save a job",
    description: "Add a role you already have in mind.",
    href: "/jobs/new",
    icon: Plus
  },
  {
    label: "Manage resume",
    description: "Keep your latest PDF ready for matching.",
    href: "/resume",
    icon: FileCheck2
  }
];

export function DashboardSummary() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  if (dashboardQuery.isLoading) {
    return <LoadingState message="Loading your career workspace..." />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="callout-error">
        Unable to load your dashboard. Please refresh and try again.
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const interviewCount =
    (dashboard.counts_by_stage["Interview"] ?? 0) +
    (dashboard.counts_by_stage["Online Assessment"] ?? 0);
  const activePipelineTotal = pipelineStages.reduce(
    (total, stage) => total + (dashboard.counts_by_stage[stage] ?? 0),
    0
  );
  const maxPipelineCount = Math.max(...pipelineStages.map((stage) => dashboard.counts_by_stage[stage] ?? 0), 1);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active applications"
          value={dashboard.active_applications}
          hint="Roles currently in motion"
          icon={<Layers3 aria-hidden="true" className="h-5 w-5" />}
          href="/applications"
        />
        <StatCard
          label="Saved jobs"
          value={dashboard.saved_jobs}
          hint="Your saved opportunity list"
          icon={<BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />}
          href="/jobs"
        />
        <StatCard
          label="Interviews & assessments"
          value={interviewCount}
          hint="Roles needing focused prep"
          icon={<CalendarClock aria-hidden="true" className="h-5 w-5" />}
          href="/applications"
        />
        <StatCard
          label="Upcoming deadlines"
          value={dashboard.upcoming_deadlines.length}
          hint="Next actions to prioritize"
          icon={<Bot aria-hidden="true" className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface p-5 sm:p-6">
          <SectionTitle
            title="Application pipeline"
            description="A compact view of where your active applications sit."
          />
          <div className="mt-5 space-y-4">
            {pipelineStages.map((stage) => {
              const count = dashboard.counts_by_stage[stage] ?? 0;
              const width = Math.round((count / maxPipelineCount) * 100);
              return (
                <div key={stage}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{stage}</span>
                    <span className="font-bold text-muted">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-muted-subtle">
            {activePipelineTotal} total role{activePipelineTotal === 1 ? "" : "s"} in your active pipeline.
          </p>
        </div>

        <div className="surface p-5 sm:p-6">
          <SectionTitle
            title="Next actions"
            description="Upcoming deadlines from your tracked applications."
          />
          <div className="mt-5 space-y-3">
            {dashboard.upcoming_deadlines.length > 0 ? (
              dashboard.upcoming_deadlines.slice(0, 4).map((application) => (
                <Link
                  key={application.id}
                  href={`/applications/${application.id}`}
                  className="surface-soft surface-hover flex items-start justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {application.job_title}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {application.company}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <Badge tone="warning">{formatDate(application.deadline)}</Badge>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-subtle"
                    />
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-lg bg-surface-muted px-4 py-5 text-sm text-muted">
                No upcoming deadlines right now.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          title="AI career tools"
          description="Review-first assistants for each stage of your search."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {aiTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="surface surface-hover group p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <tool.icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <Sparkles
                  aria-hidden="true"
                  className="h-4 w-4 text-brand-600/60"
                />
              </div>
              <h3 className="mt-5 text-base font-semibold text-ink">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                Open tool
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Quick actions"
          description="Shortcuts to the workflows you use most."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="surface surface-hover flex items-center gap-3 p-4"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-muted text-muted">
                <action.icon aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{action.label}</p>
                <p className="mt-0.5 text-xs text-muted-subtle">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
