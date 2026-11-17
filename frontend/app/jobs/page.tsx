import { AppShell } from "@/components/app-shell";
import { JobsList } from "@/components/jobs-list";
import { getCurrentUser } from "@/lib/server-auth";

export default async function JobsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <JobsList />
      </div>
    </AppShell>
  );
}
