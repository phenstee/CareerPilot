import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { JobSearchAgent } from "@/components/job-search-agent";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobFinderAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Smart Job Finder"
          title="Find jobs that fit your direction"
          description="Search from your profile or describe what you want. Results emphasize fit evidence, not arbitrary scores."
          actions={
            <Link href="/agents" className="button button-secondary">
              All agents
            </Link>
          }
        />
        <JobSearchAgent />
      </div>
    </AppShell>
  );
}
