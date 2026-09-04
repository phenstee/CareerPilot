import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ApplicationDetail } from "@/components/application-detail";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationDetailPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Applications"
          title="Application details"
          actions={
            <Link href="/applications" className="button button-secondary">
              All applications
            </Link>
          }
        />
        <ApplicationDetail />
      </div>
    </AppShell>
  );
}
