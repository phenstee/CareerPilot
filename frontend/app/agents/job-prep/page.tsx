import Link from "next/link";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { JobPreparationAgent } from "@/components/job-preparation-agent";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobPreparationAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Job Preparation Agent"
          title="Prepare for a saved job"
          description="Review the role, compare your evidence, generate resume advice, and practice interview answers."
          actions={
            <Link href="/agents" className="button button-secondary">
              All agents
            </Link>
          }
        />
        <Suspense
          fallback={
            <div className="surface p-5 text-sm text-muted">
              Loading preparation agent...
            </div>
          }
        >
          <JobPreparationAgent />
        </Suspense>
      </div>
    </AppShell>
  );
}
