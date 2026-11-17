"use client";

/** Inline error at the top of the region that failed, with a retry. */
export function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  className = ""
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`callout-error flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="button button-sm button-danger flex-none"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
