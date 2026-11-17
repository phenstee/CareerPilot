import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { JobPreparationAgent } from "@/components/job-preparation-agent";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobPreparationAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container lg:pt-8">
        <PageHeader
          title="Interview prep"
          description="Pick a saved job. Start with a role analysis, then build a prep plan and work through the checklist."
        />
        <Suspense fallback={<LoadingState label="Loading" rows={4} />}>
          <JobPreparationAgent />
        </Suspense>
      </div>
    </AppShell>
  );
}
