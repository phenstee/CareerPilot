import { AppShell } from "@/components/app-shell";
import { JobForm } from "@/components/job-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function NewJobPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          breadcrumb={{ href: "/jobs", label: "Saved jobs" }}
          title="Add a job"
          description="Save a posting you already have. You can track it and prepare for it once it's saved."
        />
        <JobForm />
      </div>
    </AppShell>
  );
}
