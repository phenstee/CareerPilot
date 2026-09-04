import { AppShell } from "@/components/app-shell";
import { AgentsHome } from "@/components/agents-home";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function AgentsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="AI Agents"
          title="Choose an AI workflow"
          description="Use specialized, review-first agents for finding roles, preparing materials, and getting interview-ready."
        />
        <AgentsHome />
      </div>
    </AppShell>
  );
}
