"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createResumeSuggestions,
  getProfile,
  JobPosting,
  listApplications,
  listAnalyses,
  listJobs,
  ProfileResponse,
  ResumeSuggestionsOutput
} from "@/lib/api";

export function JobPreparationAgent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId ?? "");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["jobs", "prep-agent"],
    queryFn: () => listJobs()
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => listApplications()
  });
  const suggestionsQuery = useQuery({
    queryKey: ["analyses", selectedJobId, "resume_suggestions"],
    queryFn: () =>
      listAnalyses({
        job_posting_id: selectedJobId,
        analysis_type: "resume_suggestions"
      }),
    enabled: Boolean(selectedJobId)
  });

  const jobs = jobsQuery.data?.items ?? [];
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const application = applicationsQuery.data?.items.find(
    (item) => item.job_posting_id === selectedJobId
  );
  const latestSuggestions = suggestionsQuery.data?.items[0]?.result;
  const prep = useMemo(
    () =>
      selectedJob && profileQuery.data
        ? buildPreparation(selectedJob, profileQuery.data, latestSuggestions)
        : null,
    [latestSuggestions, profileQuery.data, selectedJob]
  );

  const suggestionMutation = useMutation({
    mutationFn: () => createResumeSuggestions(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", selectedJobId, "resume_suggestions"]
      });
    }
  });

  if (
    jobsQuery.isLoading ||
    profileQuery.isLoading ||
    applicationsQuery.isLoading
  ) {
    return <LoadingPanel />;
  }

  if (jobsQuery.isError || profileQuery.isError || applicationsQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load preparation data.
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
        <h2 className="text-xl font-semibold text-ink">
          You have no saved jobs
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Save a job first, then return here to prepare for it.
        </p>
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

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">
          Which saved job would you like to prepare for?
        </h2>
        <div className="mt-4 space-y-2">
          {jobs.map((job) => {
            const app = applicationsQuery.data?.items.find(
              (item) => item.job_posting_id === job.id
            );
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                  selectedJobId === job.id
                    ? "border-lagoon bg-lagoon/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block font-semibold text-ink">
                  {job.title}
                </span>
                <span className="mt-1 block text-slate-600">{job.company}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {job.location || "Location not set"}{" "}
                  {app ? `- ${app.stage}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {selectedJob && prep ? (
        <section className="space-y-5">
          <AgentPanel title="Role overview">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock
                title="Core responsibilities"
                items={prep.responsibilities}
              />
              <ListBlock
                title="Important technologies"
                items={prep.technologies}
              />
              <ListBlock
                title="Experience expectations"
                items={prep.expectations}
              />
              <Info
                label="Location and employment"
                value={`${selectedJob.location || "Location not set"} - ${selectedJob.employment_type || "Type not set"}`}
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Strengths and gaps">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock
                title="Relevant profile evidence"
                items={prep.strengths}
              />
              <ListBlock
                title="Missing or unclear qualifications"
                items={prep.gaps}
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Resume recommendations">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                Uses the existing resume recommendation workflow for this saved
                job.
              </p>
              <button
                type="button"
                onClick={() => suggestionMutation.mutate()}
                disabled={suggestionMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {suggestionMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4" />
                )}
                Generate resume advice
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ListBlock
                title="Add or emphasize"
                items={prep.resumeAdditions}
              />
              <ListBlock
                title="Less important for this job"
                items={prep.lessImportant}
              />
              <ListBlock title="Keywords" items={prep.keywords} />
              <ListBlock
                title="Questions before editing"
                items={prep.resumeQuestions}
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Company and role research">
            <div className="grid gap-4 lg:grid-cols-3">
              <Info
                label="Verified"
                value="Open the original posting for source-of-truth company and role details."
              />
              <Info
                label="Inference"
                value={`The role appears connected to ${prep.technologies.slice(0, 3).join(", ") || "the listed job responsibilities"}.`}
              />
              <Info
                label="Unavailable"
                value="Live company news is not enabled in mock mode."
              />
            </div>
          </AgentPanel>

          <AgentPanel title="Interview-question preparation">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock title="Likely questions" items={prep.questions} />
              <ListBlock
                title="Suggested answer structure"
                items={prep.answerStructure}
              />
            </div>
            {application ? (
              <Link
                href={`/applications/${application.id}/interview`}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Start mock interview
              </Link>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Track this job as an application to use the stored mock
                interview workflow.
              </p>
            )}
          </AgentPanel>

          <AgentPanel title="Technical topics to study">
            <div className="grid gap-4 lg:grid-cols-2">
              <ListBlock title="Essential" items={prep.studyEssential} />
              <ListBlock title="Optional" items={prep.studyOptional} />
            </div>
          </AgentPanel>

          <AgentPanel title="Preparation checklist">
            <div className="space-y-2">
              {prep.checklist.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={completedItems.has(item)}
                    onChange={(event) =>
                      setCompletedItems((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(item);
                        else next.delete(item);
                        return next;
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-lagoon focus:ring-lagoon"
                  />
                  <span>{item}</span>
                  {completedItems.has(item) ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 text-lagoon"
                    />
                  ) : null}
                </label>
              ))}
            </div>
          </AgentPanel>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          Select a saved job to begin preparation.
        </div>
      )}
    </div>
  );
}

function buildPreparation(
  job: JobPosting,
  profile: ProfileResponse,
  suggestions?: ResumeSuggestionsOutput
) {
  const text = job.description.toLowerCase();
  const skills = [...profile.technical_skills, ...profile.soft_skills];
  const technologies = skills.filter((skill) =>
    text.includes(skill.toLowerCase())
  );
  const strengths = [
    ...technologies.map((skill) => `Profile skill: ${skill}`),
    ...profile.projects
      .slice(0, 3)
      .map((project) => `Project evidence: ${project.name}`),
    ...profile.experiences
      .slice(0, 2)
      .map(
        (experience) =>
          `Experience evidence: ${experience.position} at ${experience.organization}`
      )
  ];
  return {
    responsibilities: splitSentences(job.description).slice(0, 5),
    technologies: technologies.length
      ? technologies
      : ["Review the posting and tag important technologies in your profile."],
    expectations: [
      job.employment_type || "Employment type not listed",
      "Use the posting to confirm seniority and interview format."
    ],
    strengths: strengths.length
      ? strengths
      : [
          "Add projects, experiences, and skills to your profile for stronger evidence."
        ],
    gaps: skills.length
      ? [
          "Confirm any required skill not already in your profile.",
          "Add measurable outcomes for relevant projects."
        ]
      : ["Profile has no saved skills."],
    resumeAdditions: suggestions?.suggested_additions?.length
      ? suggestions.suggested_additions
      : ["Generate resume advice to get job-specific recommendations."],
    lessImportant: suggestions?.less_important_items?.length
      ? suggestions.less_important_items
      : ["General content not tied to this role can usually be shortened."],
    keywords: suggestions?.keywords?.length
      ? suggestions.keywords
      : technologies,
    resumeQuestions: suggestions?.missing_information_questions?.length
      ? suggestions.missing_information_questions
      : ["What measurable outcome can you add to the most relevant project?"],
    questions: [
      `Why are you interested in ${job.company}?`,
      `Walk me through a project that relates to ${technologies[0] || "this role"}.`,
      "Tell me about a time you had to learn a technical concept quickly.",
      "How would you explain your contribution to your strongest project?"
    ],
    answerStructure: [
      "Situation",
      "Task",
      "Action you personally took",
      "Result or learning",
      "Connection back to this role"
    ],
    studyEssential: (technologies.length
      ? technologies
      : skills.slice(0, 4)
    ).map((skill) => `${skill}: know where you used it and one tradeoff.`),
    studyOptional: [
      "Company product research",
      "Questions for the interviewer",
      "One extra project story"
    ],
    checklist: [
      "Research the company and product area",
      "Review job responsibilities",
      "Revise resume bullets for this job",
      "Prepare project explanations",
      "Practice behavioral stories",
      "Review technical topics",
      "Prepare questions for the interviewer",
      "Confirm interview logistics"
    ]
  };
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
      {items.length > 0 ? (
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
      ) : (
        <p className="mt-2 text-sm text-slate-500">Not available.</p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">
        {value || "Not available"}
      </p>
    </div>
  );
}
