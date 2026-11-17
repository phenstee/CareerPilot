import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow lg:pt-8">
        <PageHeader
          title="Profile"
          description="What CareerPilot knows about you. Job search, application drafts and interview prep all read from here, along with the resume on the Resume tab."
        />
        <ProfileForm />
      </div>
    </AppShell>
  );
}
