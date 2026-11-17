import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ResumeManager } from "@/components/resume-manager";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ResumePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow lg:pt-8">
        <PageHeader
          title="Resume"
          description="One PDF. CareerPilot reads its text and uses it alongside your profile for matching, drafts and interview prep."
        />
        <ResumeManager />
      </div>
    </AppShell>
  );
}
