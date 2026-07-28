import { BriefcaseBusiness, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    title: "Smart Job Finder",
    description:
      "Search for jobs based on your profile, skills, experience, and career preferences.",
    action: "Find jobs",
    href: "/agents/job-finder",
    Icon: BriefcaseBusiness
  },
  {
    title: "Job Application Agent",
    description:
      "Prepare and autofill an application, then review everything before submitting.",
    action: "Prepare application",
    href: "/agents/job-application",
    Icon: FileText
  },
  {
    title: "Job Preparation Agent",
    description:
      "Prepare for a saved job with resume advice, research, interview practice, and a personalized study plan.",
    action: "Prepare for a job",
    href: "/agents/job-prep",
    Icon: GraduationCap
  }
];

export function AgentsHome() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {agents.map(({ title, description, action, href, Icon }) => (
        <Link
          key={title}
          href={href}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-lagoon/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
        >
          <div className="inline-flex rounded-md bg-lagoon/10 p-3 text-lagoon">
            <Icon aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          <span className="mt-5 inline-flex text-sm font-semibold text-lagoon">
            {action}
          </span>
        </Link>
      ))}
    </div>
  );
}
