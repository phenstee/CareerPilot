import { Loader2 } from "lucide-react";

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <Loader2
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-brand-600"
      />
      {message ? (
        <p className="mt-3 text-sm text-muted">{message}</p>
      ) : null}
    </div>
  );
}
