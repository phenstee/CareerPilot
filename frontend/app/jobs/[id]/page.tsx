import { AppShell } from "@/components/app-shell";
import { JobDetail } from "@/components/job-detail";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobDetailPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <JobDetail />
      </div>
    </AppShell>
  );
}
