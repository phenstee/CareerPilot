import { AppShell } from "@/components/app-shell";
import { ApplicationsView } from "@/components/applications-view";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <ApplicationsView />
      </div>
    </AppShell>
  );
}
