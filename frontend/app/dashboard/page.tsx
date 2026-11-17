import { AppShell } from "@/components/app-shell";
import { DashboardSummary } from "@/components/dashboard-summary";
import { getCurrentUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <DashboardSummary user={user} />
      </div>
    </AppShell>
  );
}
