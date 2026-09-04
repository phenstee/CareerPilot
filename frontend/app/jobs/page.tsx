import { Plus } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { JobsList } from "@/components/jobs-list";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Jobs"
          title="Saved job postings"
          description="Browse, filter, and organize roles before you move them into your application tracker."
          actions={
            <Link href="/jobs/new" className="button button-primary">
              <Plus aria-hidden="true" className="h-4 w-4" />
              New job
            </Link>
          }
        />
        <JobsList />
      </div>
    </AppShell>
  );
}
