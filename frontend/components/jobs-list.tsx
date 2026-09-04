"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { listJobs } from "@/lib/api";

export function JobsList() {
  const [search, setSearch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const params = useMemo(
    () => ({ search: search.trim(), employment_type: employmentType }),
    [employmentType, search]
  );
  const jobsQuery = useQuery({
    queryKey: ["jobs", params],
    queryFn: () => listJobs(params)
  });

  return (
    <section className="space-y-5">
      <div className="surface p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3.5 h-4 w-4 text-muted-subtle"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, company, or description"
              aria-label="Search saved jobs"
              className="form-control pl-9"
            />
          </label>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            aria-label="Filter by employment type"
            className="form-control"
          >
            <option value="">All types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </div>

      {jobsQuery.isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface">
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-brand-600"
          />
        </div>
      ) : null}

      {jobsQuery.isError ? (
        <div className="callout-error">Unable to load saved jobs.</div>
      ) : null}

      {jobsQuery.data && jobsQuery.data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No saved jobs match this view. Try clearing a filter.
        </div>
      ) : null}

      <div className="grid gap-3">
        {jobsQuery.data?.items.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="surface surface-hover group block p-5"
          >
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                {job.company?.trim().charAt(0).toUpperCase() || "C"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-ink transition group-hover:text-brand-700">
                      {job.title}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                      {job.company || "Company not set"}
                    </p>
                  </div>
                  <span className="badge badge-neutral shrink-0">
                    {job.employment_type || "Unspecified"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-subtle">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {job.location || "Location not set"}
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                  {job.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-subtle">
                <BriefcaseBusiness aria-hidden="true" className="h-3.5 w-3.5" />
                Saved job
              </span>
              <span className="text-sm font-semibold text-brand-700">
                View details
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
