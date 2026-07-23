"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  FileCheck2,
  Loader2,
  Trash2,
  Upload
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { deleteResume, getResume, uploadResume } from "@/lib/api";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getPreviewLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function ResumeManager() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumeQuery = useQuery({ queryKey: ["resume"], queryFn: getResume });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (resume) => {
      setError(null);
      queryClient.setQueryData(["resume"], resume);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to upload resume."
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      setError(null);
      queryClient.setQueryData(["resume"], null);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to delete resume."
      );
    }
  });

  function handleFileChange(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Upload a PDF resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume PDF must be 5 MB or smaller.");
      return;
    }
    uploadMutation.mutate(file);
  }

  if (resumeQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  const resume = resumeQuery.data ?? null;
  const previewLines = resume
    ? getPreviewLines(resume.extracted_text_preview)
    : [];

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Uploaded resume</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload a text-readable PDF. CareerPilot stores extracted text for
              later AI analysis only when you explicitly request AI features.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-within:ring-2 focus-within:ring-lagoon focus-within:ring-offset-2">
            {uploadMutation.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="h-4 w-4" />
            )}
            {resume ? "Replace PDF" : "Upload PDF"}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
            {error}
          </div>
        ) : null}

        {resume ? (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-md bg-lagoon/10 text-lagoon">
                    <FileCheck2 aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-normal text-lagoon">
                      PDF ready
                    </p>
                    <h3 className="mt-1 break-words text-xl font-semibold text-ink">
                      {resume.filename}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Text extraction completed. This preview is stored for
                      later matching and resume-tailoring workflows.
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:max-w-xs">
                  <ResumeMetric
                    icon={
                      <CalendarClock aria-hidden="true" className="h-4 w-4" />
                    }
                    label="Uploaded"
                    value={formatDate(resume.uploaded_at)}
                  />
                </dl>

                <div className="mt-5 rounded-md border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">
                      Extracted text preview
                    </p>
                    <span className="text-xs font-medium text-slate-500">
                      First readable lines
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-4 py-4">
                    {previewLines.length > 0 ? (
                      <ol className="space-y-2">
                        {previewLines.map((line, index) => (
                          <li
                            key={`${line}-${index}`}
                            className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-slate-700"
                          >
                            <span className="font-mono text-xs text-slate-400">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Preview unavailable, but extracted text was stored.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 xl:flex-none"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No resume uploaded yet.
          </div>
        )}
      </div>
    </section>
  );
}

function ResumeMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-slate-500">
        <span className="text-lagoon">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
