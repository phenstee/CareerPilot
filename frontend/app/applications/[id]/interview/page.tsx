import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { InterviewPractice } from "@/components/interview-practice";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationInterviewPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container-narrow">
        <PageHeader
          eyebrow="Interview"
          title="Practice session"
          actions={
            <Link href="/applications" className="button button-secondary">
              All applications
            </Link>
          }
        />
        <InterviewPractice />
      </div>
    </AppShell>
  );
}
