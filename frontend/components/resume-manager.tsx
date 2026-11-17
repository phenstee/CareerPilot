"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { deleteResume, getResume, uploadResume } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, errorMessage } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading-state";

function getPreviewLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const numberFormat = new Intl.NumberFormat("en");

export function ResumeManager() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
          : "The upload didn't go through. Try again."
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      setError(null);
      setConfirmDelete(false);
      queryClient.setQueryData(["resume"], null);
    }
  });

  function handleFileChange(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("That file isn't a PDF. Upload your resume as a PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("That PDF is over 5 MB. Upload a smaller file.");
      return;
    }
    uploadMutation.mutate(file);
  }

  if (resumeQuery.isLoading) {
    return <LoadingState label="Loading your resume" rows={3} />;
  }

  if (resumeQuery.isError) {
    return (
      <ErrorState
        message="Your resume couldn't be loaded."
        onRetry={() => resumeQuery.refetch()}
      />
    );
  }

  const resume = resumeQuery.data ?? null;
  const previewLines = resume
    ? getPreviewLines(resume.extracted_text_preview)
    : [];

  const uploadButton = (
    <label
      className={`button cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
        resume ? "button-secondary" : "button-primary"
      } ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}`}
    >
      {uploadMutation.isPending ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <Upload aria-hidden="true" className="h-4 w-4" />
      )}
      {uploadMutation.isPending
        ? "Uploading…"
        : resume
          ? "Replace PDF"
          : "Upload PDF"}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={uploadMutation.isPending}
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />
    </label>
  );

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="callout-error">
          {error}
        </p>
      ) : null}

      {resume ? (
        <section aria-labelledby="resume-file" className="surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <PaperGlyph />
              <div className="min-w-0">
                <h2
                  id="resume-file"
                  className="break-words font-serif text-xl font-medium leading-tight text-ink sm:text-2xl"
                >
                  {resume.filename}
                </h2>
                <p className="tabular mt-1.5 text-meta text-muted">
                  Uploaded {formatDate(resume.uploaded_at)} ·{" "}
                  {formatSize(resume.size_bytes)} ·{" "}
                  {numberFormat.format(resume.extracted_text_length)} characters
                  of text read
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-none">
              {uploadButton}
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="button button-danger"
              >
                Delete
              </button>
            </div>
          </div>

          <figure className="mt-6">
            <figcaption className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-ink">
                What CareerPilot read
              </span>
              <span className="text-meta text-muted">Start of the text</span>
            </figcaption>
            <div className="rounded-xl border border-line bg-canvas">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                {previewLines.length > 0 ? (
                  <ol className="space-y-1.5">
                    {previewLines.map((line, index) => (
                      <li
                        key={`${line}-${index}`}
                        className="grid grid-cols-gutter gap-3 text-sm leading-6 text-ink"
                      >
                        <span
                          aria-hidden="true"
                          className="tabular text-right text-meta leading-6 text-muted"
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 break-words">{line}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted">
                    No preview to show, but the extracted text was saved.
                  </p>
                )}
              </div>
            </div>
            <p className="mt-2 text-meta text-muted">
              If this looks garbled, the PDF is probably a scan. Export it again
              from your editor so the text can be selected.
            </p>
          </figure>
        </section>
      ) : (
        <section
          aria-labelledby="resume-empty"
          className="rounded-2xl border border-dashed border-line-strong px-5 py-10 sm:px-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <PaperGlyph muted />
            <div className="min-w-0 flex-1">
              <h2
                id="resume-empty"
                className="font-serif text-2xl font-medium text-ink"
              >
                No resume yet
              </h2>
              <p className="mt-1 max-w-prose text-sm leading-6 text-muted">
                Upload a PDF whose text you can select. Scanned images
                won&apos;t work. 5 MB max.
              </p>
            </div>
            <div className="sm:flex-none">{uploadButton}</div>
          </div>
        </section>
      )}

      <p className="max-w-prose text-meta text-muted">
        CareerPilot stores the text it reads from your PDF, and only uses it for
        AI analysis when you ask for an AI feature.
      </p>

      {resume ? (
        <ConfirmDialog
          open={confirmDelete}
          title="Delete your resume?"
          description={
            <>
              <strong className="font-semibold text-ink">
                {resume.filename}
              </strong>{" "}
              and the text read from it will be removed. This can&apos;t be
              undone.
            </>
          }
          confirmLabel="Delete resume"
          pending={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? errorMessage(deleteMutation.error, "The resume wasn't deleted.")
              : null
          }
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => {
            deleteMutation.reset();
            setConfirmDelete(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** A small sheet of paper with a folded corner and text lines. */
function PaperGlyph({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-16 w-12 flex-none flex-col gap-1.5 overflow-hidden rounded-md border px-2 pt-4 ${
        muted ? "border-line-strong bg-canvas" : "border-line bg-surface"
      }`}
    >
      <span
        className={`absolute right-0 top-0 h-3.5 w-3.5 rounded-bl-md ${
          muted ? "bg-line-strong" : "bg-highlight"
        }`}
      />
      <span
        className={`h-1 w-6 rounded-full ${muted ? "bg-line-strong" : "bg-accent"}`}
      />
      <span className="h-1 w-full rounded-full bg-line" />
      <span className="h-1 w-full rounded-full bg-line" />
      <span className="h-1 w-5 rounded-full bg-line" />
    </span>
  );
}
