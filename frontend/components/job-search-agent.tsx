"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  JobSearchFilters,
  JobSearchResponse,
  NormalizedJobResult,
  saveDiscoveredJob,
  searchJobsByProfile,
  searchJobsByPrompt
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, errorMessage } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/loading-state";

const defaultFilters: JobSearchFilters = {
  location: "",
  workplace_types: [],
  employment_types: [],
  experience_levels: [],
  preferred_role: "",
  date_posted: "Any time"
};

const promptExamples = [
  "Entry-level AI engineering internships",
  "Remote Python backend roles",
  "Full-stack AI agent jobs in Canada",
  "Machine learning co-ops for students"
];

const progressMessages = [
  "Matching your saved profile…",
  "Searching job sources…",
  "Organizing the strongest opportunities…"
];

export function JobSearchAgent() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"profile" | "prompt">("profile");
  const [filters, setFilters] = useState<JobSearchFilters>(defaultFilters);
  const [prompt, setPrompt] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Record<string, string>>({});
  const [progressIndex, setProgressIndex] = useState(0);

  const profileSearch = useMutation({
    mutationFn: searchJobsByProfile,
    onMutate: () => setProgressIndex(0)
  });
  const promptSearch = useMutation({
    mutationFn: searchJobsByPrompt,
    onMutate: () => setProgressIndex(1)
  });
  const saveMutation = useMutation({
    mutationFn: saveDiscoveredJob,
    onSuccess: (response, result) => {
      setSavedJobs((current) => ({
        ...current,
        [result.external_id]: response.id
      }));
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const activeSearch = mode === "profile" ? profileSearch : promptSearch;
  const response = (profileSearch.data ?? promptSearch.data) as
    | JobSearchResponse
    | undefined;
  const visibleResults = useMemo(
    () =>
      (response?.results ?? []).filter(
        (result) => !dismissed.has(result.external_id)
      ),
    [dismissed, response?.results]
  );

  function toggleArrayValue<T extends string>(
    key: keyof JobSearchFilters,
    value: T
  ) {
    setFilters((current) => {
      const list = current[key] as T[];
      return {
        ...current,
        [key]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value]
      };
    });
  }

  function startProfileSearch() {
    profileSearch.mutate(filters);
  }

  function startPromptSearch() {
    promptSearch.mutate({ prompt, use_profile_context: true });
  }

  return (
    <div className="space-y-6">
      <section className="surface p-5 sm:p-6" aria-label="Search">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Search mode"
            className="segmented self-start"
          >
            <button
              type="button"
              aria-pressed={mode === "profile"}
              onClick={() => setMode("profile")}
              className="segmented-item"
            >
              Use my profile
            </button>
            <button
              type="button"
              aria-pressed={mode === "prompt"}
              onClick={() => setMode("prompt")}
              className="segmented-item"
            >
              Describe what you want
            </button>
          </div>
          <p className="text-meta text-muted">
            {mode === "profile"
              ? "Searches from your saved skills, roles, locations, projects and education."
              : "Write it in your own words. CareerPilot turns it into search filters."}
          </p>
        </div>
        {mode === "profile" ? (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <TextInput
                label="Location"
                value={filters.location}
                placeholder="Toronto, Canada, Remote"
                onChange={(value) =>
                  setFilters((current) => ({ ...current, location: value }))
                }
              />
              <TextInput
                label="Preferred role"
                value={filters.preferred_role}
                placeholder="AI engineering, backend, full-stack"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    preferred_role: value
                  }))
                }
              />
            </div>

            <FilterGroup
              label="Workplace"
              values={["Remote", "Hybrid", "Onsite"]}
              selected={filters.workplace_types}
              onToggle={(value) => toggleArrayValue("workplace_types", value)}
            />
            <FilterGroup
              label="Employment type"
              values={["Internship", "Co-op", "Full-time", "Contract"]}
              selected={filters.employment_types}
              onToggle={(value) => toggleArrayValue("employment_types", value)}
            />
            <FilterGroup
              label="Experience level"
              values={["Internship", "Entry-level", "Junior", "Mid-level"]}
              selected={filters.experience_levels}
              onToggle={(value) => toggleArrayValue("experience_levels", value)}
            />

            <button
              type="button"
              onClick={startProfileSearch}
              disabled={profileSearch.isPending}
              className="button button-primary"
            >
              {profileSearch.isPending ? <Spinner /> : null}
              Find jobs for me
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="search-prompt" className="form-label">
                What are you looking for?
              </label>
              <textarea
                id="search-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                placeholder="e.g. Entry-level AI engineering internships in Canada or the US that use Python, FastAPI, React or LLM APIs."
                className="form-control"
              />
            </div>
            <div>
              <p className="text-meta text-muted">Or start from an example:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {promptExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-meta text-ink-2 transition-colors duration-150 hover:border-line-ui hover:text-ink"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={startPromptSearch}
              disabled={promptSearch.isPending || prompt.trim().length < 5}
              className="button button-primary"
            >
              {promptSearch.isPending ? <Spinner /> : null}
              Search jobs
            </button>
          </div>
        )}
      </section>

      {activeSearch.isPending ? (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-2">
          <Spinner className="h-4 w-4 text-accent" />
          {progressMessages[progressIndex]}
        </p>
      ) : null}

      {activeSearch.isError ? (
        <ErrorState
          message={errorMessage(
            activeSearch.error,
            "The search didn't finish. Try again."
          )}
          onRetry={mode === "profile" ? startProfileSearch : startPromptSearch}
        />
      ) : null}

      {response ? (
        <section className="space-y-4">
          {response.profile_incomplete ? (
            <div className="callout-warning flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                <span className="font-semibold">
                  Your profile is missing details.
                </span>{" "}
                Add skills, target roles, projects or preferred locations for
                closer matches.
              </p>
              <Link
                href="/profile"
                className="button button-sm button-secondary flex-none"
              >
                Update profile
              </Link>
            </div>
          ) : null}

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="section-title">
                {visibleResults.length}{" "}
                {visibleResults.length === 1 ? "result" : "results"}
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-2">
              <span className="font-medium text-ink">How it searched:</span>{" "}
              {response.strategy}
            </p>
            {response.provider_failures.length > 0 ? (
              <p className="mt-2 text-sm text-warning">
                Some sources were unavailable:{" "}
                {response.provider_failures.join("; ")}
              </p>
            ) : null}
          </div>

          {visibleResults.length === 0 ? (
            <EmptyState
              title="No results"
              description="Try a wider location, a broader role, or fewer job types."
            />
          ) : (
            <div className="grid gap-4">
              {visibleResults.map((result) => (
                <JobResultCard
                  key={result.external_id}
                  result={result}
                  savedJobId={savedJobs[result.external_id]}
                  savePending={
                    saveMutation.isPending &&
                    saveMutation.variables?.external_id === result.external_id
                  }
                  onSave={() => saveMutation.mutate(result)}
                  onDismiss={() =>
                    setDismissed((current) =>
                      new Set(current).add(result.external_id)
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="form-control"
      />
    </label>
  );
}

function FilterGroup({
  label,
  values,
  selected,
  onToggle
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (value: never) => void;
}) {
  return (
    <fieldset>
      <legend className="form-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const pressed = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggle(value as never)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-meta font-medium transition-colors duration-150 ${
                pressed
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-line-ui bg-surface text-ink-2 hover:bg-sunken hover:text-ink"
              }`}
            >
              {pressed ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              ) : null}
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function JobResultCard({
  result,
  savedJobId,
  savePending,
  onSave,
  onDismiss
}: {
  result: NormalizedJobResult;
  savedJobId?: string;
  savePending: boolean;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const salary =
    result.salary_min && result.salary_max
      ? `${result.salary_currency} ${result.salary_min.toLocaleString()}-${result.salary_max.toLocaleString()}`
      : "Salary not listed";
  const fitLabel = result.fit_label ?? legacyFitLabel(result.match_score);
  const profileEvidence = result.profile_evidence ?? result.match_reasons ?? [];
  const skills = result.skills ?? result.requirements ?? [];
  const gaps = result.qualification_gaps ?? [];

  return (
    <article className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{fitLabel}</Badge>
            {result.workplace_type ? (
              <Badge>{result.workplace_type}</Badge>
            ) : null}
            {result.is_mock ? (
              <Badge tone="warning">Sample result</Badge>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-7 text-ink">
            {result.title}
          </h3>
          <p className="text-sm text-ink-2">
            {[result.company, result.location].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-meta text-muted">
            {[
              result.employment_type || "Type not listed",
              result.experience_level || "Level not listed",
              salary
            ].join(" · ")}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">
            {result.short_description}
          </p>
        </div>
        <div className="flex flex-none flex-wrap gap-2 lg:w-44 lg:flex-col">
          {savedJobId ? (
            <Link
              href={`/jobs/${savedJobId}`}
              className="button button-secondary border-accent text-accent"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
              Saved
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={savePending}
              className="button button-primary"
            >
              {savePending ? <Spinner /> : null}
              Save job
            </button>
          )}
          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
          >
            View posting
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className="button button-ghost"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 border-t border-line pt-5 lg:grid-cols-3">
        <ResultList title="Skills it asks for" items={skills} tone="neutral" />
        <ResultList
          title="What you can point to"
          items={profileEvidence}
          tone="brand"
        />
        <ResultList title="Possible gaps" items={gaps} tone="warning" />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-meta text-muted">
          Source: {result.source}
          {result.posted_at ? ` · Posted ${formatDate(result.posted_at)}` : ""}
        </p>
        {savedJobId ? (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href={`/agents/job-application?job=${savedJobId}`}
              className="link-arrow"
            >
              Draft application
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href={`/agents/job-prep?job=${savedJobId}`}
              className="link-arrow"
            >
              Interview prep
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ResultList({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: "neutral" | "brand" | "warning";
}) {
  return (
    <section>
      <h4 className="text-meta font-medium text-ink-2">{title}</h4>
      {items.length > 0 && tone === "neutral" ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <Badge key={`${item}-${index}`}>{item}</Badge>
          ))}
        </div>
      ) : items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2 text-sm leading-5 text-ink"
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 flex-none rounded-full ${
                  tone === "brand" ? "bg-accent" : "bg-highlight"
                }`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">None listed.</p>
      )}
    </section>
  );
}
function legacyFitLabel(score?: number) {
  if (typeof score !== "number") return "Possible fit";
  if (score >= 75) return "Strong fit";
  if (score >= 45) return "Possible fit";
  return "Stretch opportunity";
}
