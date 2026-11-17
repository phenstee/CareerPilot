import { AppShell } from "@/components/app-shell";
import { ApplicationDetail } from "@/components/application-detail";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationDetailPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <ApplicationDetail />
      </div>
    </AppShell>
  );
}
