import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ResumeManager } from "@/components/resume-manager";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ResumePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Resume"
          title="Resume workspace"
          description="Upload a readable PDF and keep extracted text ready for matching, tailoring, and interview preparation."
        />
        <ResumeManager />
      </div>
    </AppShell>
  );
}
