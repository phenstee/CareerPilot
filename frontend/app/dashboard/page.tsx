import Link from "next/link";
import { Bot, Send } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DashboardSummary } from "@/components/dashboard-summary";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Dashboard"
          title={user ? `Welcome, ${user.full_name}` : "Career workspace"}
          description="Your at-a-glance command center for jobs, applications, resume, and AI assistance."
          actions={
            <>
              <Link href="/applications" className="button button-primary">
                <Send aria-hidden="true" className="h-4 w-4" />
                Applications
              </Link>
              <Link href="/agents" className="button button-secondary">
                <Bot aria-hidden="true" className="h-4 w-4" />
                AI Agents
              </Link>
            </>
          }
        />
        <DashboardSummary />
      </div>
    </AppShell>
  );
}
