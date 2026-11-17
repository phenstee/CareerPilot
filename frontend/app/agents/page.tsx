import { AppShell } from "@/components/app-shell";
import { AgentsHome } from "@/components/agents-home";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function AgentsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container lg:pt-8">
        <PageHeader
          title={
            <>
              Prepare for <span className="voice">each role</span>
            </>
          }
          description="Three tools that work from a posting plus your profile and resume. Use them in order or on their own."
        />
        <AgentsHome />
      </div>
    </AppShell>
  );
}
