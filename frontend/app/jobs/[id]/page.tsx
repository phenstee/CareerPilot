import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { JobDetail } from "@/components/job-detail";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobDetailPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Jobs"
          title="Job details"
          actions={
            <Link href="/jobs" className="button button-secondary">
              All jobs
            </Link>
          }
        />
        <JobDetail />
      </div>
    </AppShell>
  );
}
