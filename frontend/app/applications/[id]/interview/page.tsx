import { AppShell } from "@/components/app-shell";
import { InterviewPractice } from "@/components/interview-practice";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ApplicationInterviewPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-container">
        <InterviewPractice />
      </div>
    </AppShell>
  );
}
