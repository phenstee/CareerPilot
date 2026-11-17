import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { JobApplicationAgent } from "@/components/job-application-agent";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobApplicationAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container lg:pt-8">
        <PageHeader
          title="Draft an application"
          description="Pick a saved job. You get a fit summary, a cover letter to edit and the answers that need your confirmation."
        />
        <Suspense fallback={<LoadingState label="Loading" rows={4} />}>
          <JobApplicationAgent />
        </Suspense>
      </div>
    </AppShell>
  );
}
