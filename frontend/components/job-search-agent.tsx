"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  ThumbsDown
} from "lucide-react";
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
  "Matching your saved profile...",
  "Searching job sources...",
  "Organizing the strongest opportunities..."
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
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeButton
          active={mode === "profile"}
          title="Use my profile"
          description="Search from saved skills, roles, locations, projects, and education."
          onClick={() => setMode("profile")}
        />
        <ModeButton
          active={mode === "prompt"}
          title="Describe what you want"
          description="Write instructions and let CareerPilot convert them into search filters."
          onClick={() => setMode("prompt")}
        />
      </div>

      <section className="surface p-5 sm:p-6">
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
              {profileSearch.isPending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              )}
              Find jobs for me
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="form-label">
                Search instructions
              </span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={7}
                placeholder="Find entry-level AI engineering or full-stack AI agent internships in Canada or the United States that use Python, FastAPI, React, or LLM APIs."
                className="form-control mt-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {promptExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="badge badge-neutral cursor-pointer transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {example}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={startPromptSearch}
              disabled={promptSearch.isPending || prompt.trim().length < 5}
              className="button button-primary"
            >
              {promptSearch.isPending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Search aria-hidden="true" className="h-4 w-4" />
              )}
              Search jobs
            </button>
          </div>
        )}
      </section>

      {activeSearch.isPending ? (
        <div className="surface p-5 text-sm text-muted">
          {progressMessages[progressIndex]}
        </div>
      ) : null}

      {activeSearch.isError ? (
        <div className="callout-error">
          {activeSearch.error instanceof Error
            ? activeSearch.error.message
            : "Unable to search jobs."}
        </div>
      ) : null}

      {response ? (
        <section className="space-y-4">
          {response.profile_incomplete ? (
            <div className="callout-error">
              <div className="flex items-start gap-3">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Profile needs more detail</p>
                  <p className="mt-1">
                    Add skills, target roles, projects, or preferred locations
                    for better matches.
                  </p>
                  <Link
                    href="/profile"
                    className="mt-3 inline-flex font-semibold text-lagoon"
                  >
                    Update profile
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div className="surface p-5">
            <p className="text-sm font-semibold text-ink">Search strategy</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {response.strategy}
            </p>
            {response.provider_failures.length > 0 ? (
              <p className="mt-3 text-sm text-orange-800">
                Some sources were unavailable:{" "}
                {response.provider_failures.join("; ")}
              </p>
            ) : null}
          </div>

          {visibleResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface p-6 text-sm text-muted">
              No results found. Try widening the location, role, or job type.
            </div>
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
    </section>
  );
}

function ModeButton({
  active,
  title,
  description,
  onClick
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="surface surface-hover p-5 text-left aria-pressed:border-brand-500 aria-pressed:bg-brand-50"
    >
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </button>
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
        className="form-control mt-2"
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
    <div>
      <p className="form-label">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected.includes(value)}
            onClick={() => onToggle(value as never)}
            className="badge badge-neutral cursor-pointer transition hover:bg-brand-50 hover:text-brand-700 aria-pressed:bg-brand-50 aria-pressed:text-brand-700"
          >
            {value}
          </button>
        ))}
      </div>
    </div>
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
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-brand">
              {fitLabel}
            </span>
            <span className="badge badge-neutral">
              {result.workplace_type}
            </span>
            {result.is_mock ? (
              <span className="badge badge-warning">
                Mock result
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink">
            {result.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {result.company} - {result.location}
          </p>
          <p className="mt-2 text-sm text-muted-subtle">
            {result.employment_type || "Type not listed"} -{" "}
            {result.experience_level || "Level not listed"} - {salary}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink">
            {result.short_description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={result.source_url}
            target="_blank"
            className="button button-secondary"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            View job
          </Link>
          {savedJobId ? (
            <>
              <Link
                href={`/jobs/${savedJobId}`}
                className="button button-primary"
              >
                <Check aria-hidden="true" className="h-4 w-4" />
                Saved
              </Link>
              <Link
                href={`/agents/job-application?job=${savedJobId}`}
                className="button button-secondary"
              >
                Prepare application
              </Link>
              <Link
                href={`/agents/job-prep?job=${savedJobId}`}
                className="button button-secondary"
              >
                Prepare for this job
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={savePending}
              className="button button-primary"
            >
              {savePending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkPlus aria-hidden="true" className="h-4 w-4" />
              )}
              Save job
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="button button-danger"
          >
            <ThumbsDown aria-hidden="true" className="h-4 w-4" />
            Not interested
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <ResultList title="Required skills" items={skills} />
        <ResultList title="Relevant profile evidence" items={profileEvidence} />
        <ResultList title="Possible gaps" items={gaps} />
      </div>
      <p className="mt-4 text-xs text-muted-subtle">
        Source: {result.source}
        {result.posted_at
          ? ` - Posted ${new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              year: "numeric"
            }).format(new Date(result.posted_at))}`
          : ""}
      </p>
    </article>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="badge badge-neutral"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-subtle">None listed.</p>
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
