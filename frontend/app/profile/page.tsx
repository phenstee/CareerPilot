import { FileText } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Profile"
          title="Career profile"
          description="Keep your education, target roles, skills, projects, and experience in one place to power job matching and interview preparation."
        />
        <section className="surface mb-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileText aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Resume</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Upload or replace the PDF used by matching and tailoring
                  workflows.
                </p>
              </div>
            </div>
            <Link href="/resume" className="button button-secondary">
              Manage resume
            </Link>
          </div>
        </section>
        <ProfileForm />
      </div>
    </AppShell>
  );
}
