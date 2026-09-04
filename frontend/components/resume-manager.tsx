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
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-brand-600"
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
      <div className="surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Uploaded resume</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Upload a text-readable PDF. CareerPilot stores extracted text for
              later AI analysis only when you explicitly request AI features.
            </p>
          </div>
          <label className="button button-primary cursor-pointer">
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
          <div className="callout-error mt-4">
            {error}
          </div>
        ) : null}

        {resume ? (
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <FileCheck2 aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="page-eyebrow">
                      PDF ready
                    </p>
                    <h3 className="mt-1 break-words text-xl font-semibold text-ink">
                      {resume.filename}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
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

                <div className="mt-5 rounded-lg border border-border bg-surface-muted">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-ink">
                      Extracted text preview
                    </p>
                    <span className="text-xs font-medium text-muted-subtle">
                      First readable lines
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-4 py-4">
                    {previewLines.length > 0 ? (
                      <ol className="space-y-2">
                        {previewLines.map((line, index) => (
                          <li
                            key={`${line}-${index}`}
                            className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-ink"
                          >
                            <span className="font-mono text-xs text-muted-subtle">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted">
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
                className="button button-danger xl:flex-none"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border-strong bg-surface-muted p-6 text-sm text-muted">
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
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-3">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-subtle">
        <span className="text-brand-600">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
