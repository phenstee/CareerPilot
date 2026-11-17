/** Skeleton rows in the shape of a list. Announced to screen readers. */
export function LoadingState({
  label = "Loading",
  rows = 3,
  className = ""
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`surface p-4 ${className}`}
    >
      <span className="sr-only">{label}…</span>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 flex-none" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/5" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`animate-spin ${className}`}
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
