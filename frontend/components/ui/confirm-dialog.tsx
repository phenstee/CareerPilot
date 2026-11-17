"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Spinner } from "./loading-state";

/**
 * Native <dialog> confirmation for destructive actions. Focus starts on
 * Cancel; Escape and the backdrop close it.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  pending = false,
  error,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !pending) onCancel();
      }}
      className="m-auto w-11/12 max-w-md rounded-2xl bg-surface p-0 text-ink shadow-overlay backdrop:bg-ink/40 open:animate-rise"
    >
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-ink-2">{description}</div>
        {error ? (
          <p role="alert" className="callout-error mt-4">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger-solid"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
