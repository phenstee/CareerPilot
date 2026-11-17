import { ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    title: "Find jobs",
    description:
      "Search from your profile or describe what you want. Each result says why it fits and what's missing, and you choose what to save.",
    action: "Find jobs",
    href: "/agents/job-finder"
  },
  {
    title: "Draft application",
    description:
      "For a saved job: a short summary of your fit, a cover letter to edit, and the application answers that need your confirmation.",
    action: "Draft an application",
    href: "/agents/job-application"
  },
  {
    title: "Interview prep",
    description:
      "For a saved job: a role analysis that quotes your evidence, a prep plan for the gaps, and practice questions with feedback.",
    action: "Start interview prep",
    href: "/agents/job-prep"
  }
];

export function AgentsHome() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
      <ol className="surface divide-y divide-line overflow-hidden lg:col-span-2">
        {steps.map((step, index) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="group flex gap-5 px-5 py-5 transition-colors duration-150 hover:bg-canvas sm:px-6"
            >
              <span
                aria-hidden="true"
                className="tabular w-6 flex-none font-serif text-3xl font-medium leading-8 text-accent"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">
                  {step.title}
                </span>
                <span className="mt-1 block max-w-xl text-sm leading-6 text-ink-2">
                  {step.description}
                </span>
                <span className="link-arrow mt-3">
                  {step.action}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <aside className="border-l-2 border-highlight pl-5">
        <h2 className="font-serif text-xl font-medium text-ink">
          You stay in charge.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          These only run when you click Generate. They don&apos;t submit
          applications, fill in forms on other sites, or change your profile or
          tracker unless you save something yourself.
        </p>
      </aside>
    </div>
  );
}
