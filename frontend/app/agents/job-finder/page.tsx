import { AppShell } from "@/components/app-shell";
import { JobSearchAgent } from "@/components/job-search-agent";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobFinderAgentPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container lg:pt-8">
        <PageHeader
          title="Find jobs"
          description="Search from your profile or describe what you want. Each result explains its fit with evidence instead of a score."
        />
        <JobSearchAgent />
      </div>
    </AppShell>
  );
}
