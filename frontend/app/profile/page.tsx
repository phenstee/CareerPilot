import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Career profile
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Keep your school, target roles, skills, projects, experience, and
              resume in one place for future job matching and interview
              preparation.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-lagoon/10 text-lagoon">
                <FileText aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Resume</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Upload or replace the PDF used for later matching and
                  tailoring workflows.
                </p>
              </div>
            </div>
            <Link
              href="/resume"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              Manage resume
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <ProfileForm />
      </div>
    </main>
  );
}
