import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/server-auth";

const dataPlaces = [
  {
    label: "Profile",
    stored: "Education, target roles, skills, coursework, projects, experience",
    href: "/profile"
  },
  {
    label: "Resume",
    stored: "Text read from your PDF. The PDF file itself isn't kept.",
    href: "/resume"
  },
  {
    label: "Saved jobs",
    stored: "Postings you saved, plus role analyses and prep plans for them",
    href: "/jobs"
  },
  {
    label: "Applications",
    stored: "Stages, dates, notes, contacts and interview practice",
    href: "/applications"
  }
];

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          title="Settings"
          description="Your account, and where each kind of data you've given CareerPilot lives."
        />

        <div className="surface divide-y divide-line">
          <SettingsRow
            title="Account"
            description="The details you signed up with."
          >
            <dl className="divide-y divide-line text-sm">
              <AccountItem label="Name" value={user?.full_name || "Not set"} />
              <AccountItem
                label="Email"
                value={user?.email ?? "Not available"}
              />
              <AccountItem
                label="Member since"
                value={
                  user?.created_at
                    ? formatDate(user.created_at)
                    : "Not available"
                }
              />
            </dl>
          </SettingsRow>

          <SettingsRow
            title="Your data"
            description="Everything is stored in your CareerPilot workspace. Edit or delete it where it lives."
          >
            <ul className="divide-y divide-line">
              {dataPlaces.map((place) => (
                <li key={place.href}>
                  <Link
                    href={place.href}
                    className="group flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink group-hover:text-accent">
                        {place.label}
                      </span>
                      <span className="block text-meta text-muted">
                        {place.stored}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 flex-none text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </SettingsRow>

          <SettingsRow
            title="AI features"
            description="What the Prepare tools can and can't do."
          >
            <p className="max-w-prose border-l-2 border-highlight pl-4 text-sm leading-6 text-ink-2">
              The Prepare tools write suggestions and drafts for you to read.
              Anything that would change your saved data is shown to you for
              review first.
            </p>
            <Link href="/agents" className="link-arrow mt-4">
              Go to Prepare
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </SettingsRow>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsRow({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 p-5 sm:p-6 md:grid-cols-3 md:gap-8">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-meta text-muted">{description}</p>
      </div>
      <div className="min-w-0 md:col-span-2">{children}</div>
    </section>
  );
}

function AccountItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink sm:text-right">{value}</dd>
    </div>
  );
}
