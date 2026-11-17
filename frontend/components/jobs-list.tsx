"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Plus, Search } from "lucide-react";

import { listJobs } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Monogram } from "@/components/ui/date-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export function JobsList() {
  const [search, setSearch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const params = useMemo(
    () => ({ search: search.trim(), employment_type: employmentType }),
    [employmentType, search]
  );
  const hasFilters = Boolean(params.search || params.employment_type);
  const jobsQuery = useQuery({
    queryKey: ["jobs", params],
    queryFn: () => listJobs(params)
  });
  const data = jobsQuery.data;

  function clearFilters() {
    setSearch("");
    setEmploymentType("");
  }

  return (
    <>
      <PageHeader
        title="Saved jobs"
        description={
          data
            ? hasFilters
              ? `${data.total} matching`
              : `${data.total} saved · open one to track it or prepare for it`
            : "Postings you've saved, before or while you apply."
        }
        actions={
          <>
            <Link href="/agents/job-finder" className="button button-secondary">
              Find jobs
            </Link>
            <Link href="/jobs/new" className="button button-primary">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add job
            </Link>
          </>
        }
      />

      <div
        role="search"
        aria-label="Filter saved jobs"
        className="mb-5 flex flex-wrap gap-2"
      >
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">Search saved jobs</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, company or description"
            className="form-control pl-9"
          />
        </label>
        <label className="min-w-0 flex-1 basis-40 sm:flex-none">
          <span className="sr-only">Employment type</span>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            className="form-control sm:w-44"
          >
            <option value="">All types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="button button-ghost"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {jobsQuery.isPending ? (
        <LoadingState label="Loading saved jobs" rows={4} />
      ) : jobsQuery.isError || !data ? (
        <ErrorState
          message="Your saved jobs didn't load. Check your connection and try again."
          onRetry={() => jobsQuery.refetch()}
        />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No saved jobs match"
            description="Try a different search or employment type."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="button button-secondary"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No saved jobs yet"
            description="Save a posting you already have in mind, or search for roles that match your profile."
            action={
              <>
                <Link href="/jobs/new" className="button button-primary">
                  Add job
                </Link>
                <Link
                  href="/agents/job-finder"
                  className="button button-secondary"
                >
                  Find jobs
                </Link>
              </>
            }
          />
        )
      ) : (
        <ul className="surface divide-y divide-line overflow-hidden">
          {data.items.map((job) => (
            <li
              key={job.id}
              className="flex gap-4 px-4 py-4 transition-colors duration-150 hover:bg-canvas sm:px-5"
            >
              <Monogram name={job.company || job.title} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="rounded-sm text-sm font-semibold text-ink hover:text-accent"
                  >
                    {job.title}
                  </Link>
                  {job.employment_type ? (
                    <Badge>{job.employment_type}</Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-meta text-ink-2">
                  {[job.company || "Company not set", job.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {job.description ? (
                  <p className="mt-1.5 line-clamp-1 text-meta text-muted">
                    {job.description}
                  </p>
                ) : null}
              </div>
              <div className="hidden flex-none flex-col items-end justify-between gap-2 sm:flex">
                <span className="tabular text-meta text-muted">
                  Saved {formatDate(job.date_saved)}
                </span>
                <Link
                  href={`/agents/job-prep?job=${job.id}`}
                  className="link-arrow"
                  aria-label={`Prepare for ${job.title}`}
                >
                  Prepare
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
