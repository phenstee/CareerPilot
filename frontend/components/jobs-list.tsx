"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Loader2, Search } from "lucide-react";
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
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, company, or description"
              className="w-full rounded-md border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            aria-label="Filter by employment type"
            className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
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
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-lagoon"
          />
        </div>
      ) : null}

      {jobsQuery.isError ? (
        <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
          Unable to load saved jobs.
        </div>
      ) : null}

      {jobsQuery.data && jobsQuery.data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No saved jobs match this view.
        </div>
      ) : null}

      <div className="grid gap-4">
        {jobsQuery.data?.items.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-lagoon/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-lagoon/10 text-lagoon">
                  <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {job.company} · {job.location || "Location not set"}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {job.employment_type || "Unspecified"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
