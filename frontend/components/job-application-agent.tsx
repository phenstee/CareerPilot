"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { getProfile, JobPosting, listJobs, ProfileResponse } from "@/lib/api";

const sensitiveFields = [
  "Work authorization",
  "Sponsorship",
  "Relocation",
  "Salary expectations",
  "Legal declarations",
  "Electronic signature"
];

export function JobApplicationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [approved, setApproved] = useState(false);

  const jobsQuery = useQuery({
    queryKey: ["jobs", "agent"],
    queryFn: () => listJobs()
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const profile = profileQuery.data ?? null;

  const draft = useMemo(
    () =>
      selectedJob && profile
        ? buildApplicationDraft(selectedJob, profile)
        : null,
    [profile, selectedJob]
  );

  if (jobsQuery.isLoading || profileQuery.isLoading) {
    return <LoadingPanel />;
  }

  if (jobsQuery.isError || profileQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load saved jobs or profile details.
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        description="Save a job before preparing an application."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
          Step 1
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">Select job</h2>
        <div className="mt-4 space-y-2">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJobId(job.id);
                setApproved(false);
              }}
              className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                selectedJobId === job.id
                  ? "border-lagoon bg-lagoon/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold text-ink">{job.title}</span>
              <span className="mt-1 block text-slate-600">{job.company}</span>
            </button>
          ))}
        </div>
      </aside>

      {selectedJob && profile && draft ? (
        <section className="space-y-5">
          <AgentPanel title="Step 2: Review profile information">
            <ProfileReview profile={profile} />
          </AgentPanel>

          <AgentPanel title="Step 3: Prepared application materials">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock
                title="Projects and experiences to emphasize"
                items={draft.emphasis}
              />
              <ListBlock
                title="Keywords to include naturally"
                items={draft.keywords}
              />
              <ListBlock
                title="Missing information requiring input"
                items={draft.missingInformation}
              />
              <ListBlock
                title="Sensitive answers requiring confirmation"
                items={sensitiveFields}
              />
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-ink">
                Cover letter draft
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {draft.coverLetter}
              </p>
            </div>
          </AgentPanel>

          <AgentPanel title="Step 4: Autofill preview">
            <div className="space-y-3">
              {draft.preview.map((item) => (
                <div
                  key={item.field}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.field}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {item.answer}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Evidence: {item.evidence}
                      </p>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-lagoon">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AgentPanel>

          <AgentPanel title="Step 5: Review and approval">
            <div className="flex items-start gap-3 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-orange-800">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              <p>
                CareerPilot has not submitted or autofilled any external
                website. Review everything manually before using it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setApproved(true)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              {approved ? (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
              {approved ? "Approved for manual use" : "Approve and continue"}
            </button>
          </AgentPanel>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          Select a saved job to begin.
        </div>
      )}
    </div>
  );
}

function buildApplicationDraft(job: JobPosting, profile: ProfileResponse) {
  const skills = [...profile.technical_skills, ...profile.soft_skills];
  const keywords = skills
    .filter((skill) =>
      job.description.toLowerCase().includes(skill.toLowerCase())
    )
    .slice(0, 8);
  const emphasis = [
    ...profile.projects
      .slice(0, 3)
      .map((project) => `Project: ${project.name}`),
    ...profile.experiences
      .slice(0, 2)
      .map(
        (experience) => `${experience.position} at ${experience.organization}`
      )
  ];
  return {
    keywords: keywords.length ? keywords : skills.slice(0, 6),
    emphasis: emphasis.length
      ? emphasis
      : [
          "Add a project or experience in your profile before using this draft."
        ],
    missingInformation: [
      "Confirm work authorization and sponsorship answers.",
      "Confirm availability, start date, and any location constraints.",
      "Add measurable outcomes for the most relevant project if missing."
    ],
    coverLetter: `Dear ${job.company} team,\n\nI am interested in the ${job.title} role. My background in ${profile.program || "my program"} at ${profile.school || "school"} and experience with ${keywords.slice(0, 4).join(", ") || "the skills saved in my profile"} make this role especially relevant to my goals.\n\nI would focus my application on ${emphasis.slice(0, 2).join(" and ") || "my most relevant projects"}.\n\nSincerely,\n${profile.full_name || "Your name"}`,
    preview: [
      {
        field: "Full name",
        answer: profile.full_name || "Missing",
        evidence: "Career profile",
        status: profile.full_name ? "Ready" : "Needs input"
      },
      {
        field: "Education",
        answer:
          [profile.school, profile.program].filter(Boolean).join(", ") ||
          "Missing",
        evidence: "Career profile",
        status: profile.school && profile.program ? "Ready" : "Needs input"
      },
      {
        field: "Relevant skills",
        answer: (keywords.length ? keywords : skills).join(", ") || "Missing",
        evidence: "Career profile skills and selected job description",
        status: skills.length ? "Ready" : "Needs input"
      },
      {
        field: "Work authorization",
        answer: "Requires your manual answer",
        evidence: "Sensitive question; not inferred",
        status: "Confirmation required"
      }
    ]
  };
}

function ProfileReview({ profile }: { profile: ProfileResponse }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Info label="School" value={profile.school} />
      <Info label="Program" value={profile.program} />
      <Info label="Target roles" value={profile.target_roles.join(", ")} />
      <Info label="Locations" value={profile.preferred_locations.join(", ")} />
      <Info
        label="Technical skills"
        value={profile.technical_skills.join(", ")}
      />
      <Info label="Soft skills" value={profile.soft_skills.join(", ")} />
      <Link href="/profile" className="text-sm font-semibold text-lagoon">
        Edit profile
      </Link>
    </div>
  );
}

function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/agents/job-finder"
          className="inline-flex justify-center rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white"
        >
          Find jobs
        </Link>
        <Link
          href="/jobs"
          className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink"
        >
          View all jobs
        </Link>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <Loader2
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-lagoon"
      />
    </div>
  );
}

function AgentPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-md bg-slate-50 px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink">{value || "Not saved"}</p>
    </div>
  );
}
