"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, FileText, Loader2, Sparkles } from "lucide-react";

import {
  createJobMatchAnalysis,
  createResumeSuggestions,
  JobAnalysis,
  JobMatchAnalysisOutput,
  listAnalyses,
  ResumeSuggestionsOutput
} from "@/lib/api";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function isJobMatchResult(
  analysis: JobAnalysis
): analysis is JobAnalysis & { result: JobMatchAnalysisOutput } {
  return analysis.analysis_type === "job_match";
}

function isResumeSuggestionsResult(
  analysis: JobAnalysis
): analysis is JobAnalysis & { result: ResumeSuggestionsOutput } {
  return analysis.analysis_type === "resume_suggestions";
}

export function JobAnalysisPanel({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const analysesQuery = useQuery({
    queryKey: ["analyses", jobId],
    queryFn: () => listAnalyses({ job_posting_id: jobId })
  });

  const jobMatchMutation = useMutation({
    mutationFn: () => createJobMatchAnalysis(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
  const resumeMutation = useMutation({
    mutationFn: () => createResumeSuggestions(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const analyses = analysesQuery.data?.items ?? [];

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
            AI analysis
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            Job match and resume suggestions
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            CareerPilot compares this saved job with your saved profile and
            extracted resume text only when you request it.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => jobMatchMutation.mutate()}
            disabled={jobMatchMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {jobMatchMutation.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            )}
            Analyze match
          </button>
          <button
            type="button"
            onClick={() => resumeMutation.mutate()}
            disabled={resumeMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resumeMutation.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <FileText aria-hidden="true" className="h-4 w-4" />
            )}
            Resume suggestions
          </button>
        </div>
      </div>

      {jobMatchMutation.isError || resumeMutation.isError ? (
        <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
          {jobMatchMutation.error instanceof Error
            ? jobMatchMutation.error.message
            : resumeMutation.error instanceof Error
              ? resumeMutation.error.message
              : "Unable to generate analysis."}
        </div>
      ) : null}

      {analysesQuery.isLoading ? (
        <div className="mt-5 flex min-h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-lagoon"
          />
        </div>
      ) : null}

      {analysesQuery.isError ? (
        <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
          Unable to load saved analyses.
        </div>
      ) : null}

      {!analysesQuery.isLoading && analyses.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          No AI analyses yet.
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {analyses.map((analysis) =>
          isJobMatchResult(analysis) ? (
            <JobMatchCard key={analysis.id} analysis={analysis} />
          ) : isResumeSuggestionsResult(analysis) ? (
            <ResumeSuggestionsCard key={analysis.id} analysis={analysis} />
          ) : null
        )}
      </div>
    </section>
  );
}

function JobMatchCard({
  analysis
}: {
  analysis: JobAnalysis & { result: JobMatchAnalysisOutput };
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot aria-hidden="true" className="h-4 w-4 text-lagoon" />
            <h4 className="font-semibold text-ink">Job match analysis</h4>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(analysis.created_at)} - {analysis.provider}
          </p>
        </div>
        <div className="rounded-md bg-lagoon px-3 py-2 text-center text-white">
          <p className="text-2xl font-semibold">
            {analysis.result.overall_match_score}
          </p>
          <p className="text-xs font-medium">Match score</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">
        {analysis.result.score_explanation}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ListBlock
          title="Matching skills"
          items={analysis.result.matching_skills}
        />
        <ListBlock
          title="Missing or weak skills"
          items={analysis.result.missing_or_weak_skills}
        />
        <ListBlock
          title="Relevant experience and projects"
          items={analysis.result.relevant_experiences_and_projects}
        />
        <ListBlock
          title="Preparation priorities"
          items={analysis.result.recommended_preparation_priorities}
        />
        <ListBlock
          title="Resume improvements"
          items={analysis.result.potential_resume_improvements}
        />
        <ListBlock
          title="Uncertainties"
          items={analysis.result.uncertainties}
        />
      </div>
    </article>
  );
}

function ResumeSuggestionsCard({
  analysis
}: {
  analysis: JobAnalysis & { result: ResumeSuggestionsOutput };
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <FileText aria-hidden="true" className="h-4 w-4 text-lagoon" />
        <h4 className="font-semibold text-ink">Resume suggestions</h4>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {formatDate(analysis.created_at)} - {analysis.provider}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ListBlock title="Keywords" items={analysis.result.keywords} />
        <ListBlock
          title="Existing resume evidence"
          items={analysis.result.relevant_existing_resume_content}
        />
        <ListBlock
          title="Missing information questions"
          items={analysis.result.missing_information_questions}
        />
        <ListBlock
          title="Checklist before applying"
          items={analysis.result.application_checklist}
        />
      </div>
      {analysis.result.suggested_rewrites.length > 0 ? (
        <div className="mt-4 space-y-3">
          <h5 className="text-sm font-semibold text-ink">Suggested rewrites</h5>
          {analysis.result.suggested_rewrites.map((rewrite, index) => (
            <div
              key={`${rewrite.original_text}-${index}`}
              className="rounded-md border border-slate-200 bg-white p-3 text-sm"
            >
              <p className="font-medium text-slate-700">Original</p>
              <p className="mt-1 text-slate-600">{rewrite.original_text}</p>
              <p className="mt-3 font-medium text-slate-700">Suggestion</p>
              <p className="mt-1 text-slate-600">{rewrite.suggested_text}</p>
              <p className="mt-3 text-xs text-slate-500">{rewrite.rationale}</p>
            </div>
          ))}
        </div>
      ) : null}
      <ListBlock title="Uncertainties" items={analysis.result.uncertainties} />
    </article>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h5 className="text-sm font-semibold text-ink">{title}</h5>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-md bg-white px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None found.</p>
      )}
    </section>
  );
}
