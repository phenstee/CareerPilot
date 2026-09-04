import Link from "next/link";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { JobApplicationAgent } from "@/components/job-application-agent";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobApplicationAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Job Application Agent"
          title="Prepare an application preview"
          description="Select a saved job, review profile evidence, and approve a manual-use preview before using it anywhere."
          actions={
            <Link href="/agents" className="button button-secondary">
              All agents
            </Link>
          }
        />
        <Suspense
          fallback={
            <div className="surface p-5 text-sm text-muted">
              Loading application agent...
            </div>
          }
        >
          <JobApplicationAgent />
        </Suspense>
      </div>
    </AppShell>
  );
}
