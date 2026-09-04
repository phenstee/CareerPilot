import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

const agents = [
  {
    title: "Smart Job Finder",
    kicker: "Discover",
    description:
      "Search from your profile or describe what you want, then review fit evidence for each result.",
    action: "Find jobs",
    href: "/agents/job-finder",
    icon: BriefcaseBusiness,
    accent: "brand" as const
  },
  {
    title: "Job Application Agent",
    kicker: "Apply",
    description:
      "Prepare a focused application preview, identify missing details, and copy materials for manual review.",
    action: "Prepare application",
    href: "/agents/job-application",
    icon: FileText,
    accent: "coral" as const
  },
  {
    title: "Job Preparation Agent",
    kicker: "Prepare",
    description:
      "Research the role, close qualification gaps, and practice interview answers with structured feedback.",
    action: "Prepare for a job",
    href: "/agents/job-prep",
    icon: GraduationCap,
    accent: "neutral" as const
  }
];

const accentStyles = {
  brand: {
    icon: "bg-brand-50 text-brand-600",
    kicker: "text-brand-700"
  },
  coral: {
    icon: "bg-coral/10 text-coral",
    kicker: "text-coral"
  },
  neutral: {
    icon: "bg-surface-muted text-muted",
    kicker: "text-muted"
  }
} as const;

export function AgentsHome() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.title}
            href={agent.href}
            className="surface surface-hover group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentStyles[agent.accent].icon}`}
              >
                <agent.icon aria-hidden="true" className="h-6 w-6" />
              </div>
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 text-muted-subtle transition group-hover:text-brand-600"
              />
            </div>
            <p
              className={`mt-6 text-xs font-bold uppercase tracking-[0.1em] ${accentStyles[agent.accent].kicker}`}
            >
              {agent.kicker}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              {agent.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">
              {agent.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-semibold text-brand-700">
              {agent.action}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/70 p-4 text-sm leading-6 text-brand-700">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
        <p>
          Every agent produces recommendations for your review. CareerPilot
          does not submit applications or change your data without your
          approval.
        </p>
      </div>
    </section>
  );
}
