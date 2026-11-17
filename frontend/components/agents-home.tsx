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
    icon: BriefcaseBusiness
  },
  {
    title: "Job Application Agent",
    kicker: "Apply",
    description:
      "Prepare a focused application preview, identify missing details, and copy materials for manual review.",
    action: "Prepare application",
    href: "/agents/job-application",
    icon: FileText
  },
  {
    title: "Job Preparation Agent",
    kicker: "Prepare",
    description:
      "Research the role, close qualification gaps, and practice interview answers with structured feedback.",
    action: "Prepare for a job",
    href: "/agents/job-prep",
    icon: GraduationCap
  }
];

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
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-subtle text-accent">
                <agent.icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 text-muted transition group-hover:text-accent"
              />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-muted">
              {agent.kicker}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              {agent.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">
              {agent.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-semibold text-accent">
              {agent.action}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-subtle/60 p-4 text-sm leading-6 text-accent">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
        <p>
          Every agent produces recommendations for your review. CareerPilot does
          not submit applications or change your data without your approval.
        </p>
      </div>
    </section>
  );
}
