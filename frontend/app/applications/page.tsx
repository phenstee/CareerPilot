import { BriefcaseBusiness, Plus } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ApplicationsView } from "@/components/applications-view";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <PageHeader
          eyebrow="Applications"
          title="Application tracker"
          description="Move opportunities through every stage and keep the next step visible."
          actions={
            <>
              <Link href="/jobs/new" className="button button-primary">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Save job
              </Link>
              <Link href="/jobs" className="button button-secondary">
                <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
                Saved jobs
              </Link>
            </>
          }
        />
        <ApplicationsView />
      </div>
    </AppShell>
  );
}
