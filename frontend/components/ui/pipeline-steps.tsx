import Link from "next/link";

export type PipelineStep = {
  key: string;
  label: string;
  /** Large serif value inside the node, e.g. a count or step number. */
  value: string | number;
  /** Tailwind classes for the node fill and the caption dot. */
  tint: string;
  dot: string;
  /** Muted when the step is empty or not started. */
  muted?: boolean;
  href?: string;
  caption?: string;
};

/**
 * Connected circular nodes: the dashboard pipeline and the job-prep
 * steps. Each node is a link when it has an href.
 */
export function PipelineSteps({
  steps,
  label
}: {
  steps: PipelineStep[];
  label: string;
}) {
  // The connector runs from the centre of the first node to the last.
  const inset = 50 / steps.length;
  return (
    <ol
      aria-label={label}
      className="relative grid gap-y-4"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute top-6 h-0.5 rounded-full bg-gradient-to-r from-stage-prep via-stage-interview to-stage-offer opacity-40"
        style={{ left: `${inset}%`, right: `${inset}%` }}
      />
      {steps.map((step) => {
        const body = (
          <>
            <span
              className={`tabular relative flex h-12 w-12 items-center justify-center rounded-full border font-serif text-count font-medium ${
                step.muted
                  ? "border-line-ui bg-surface text-muted"
                  : `border-transparent ${step.tint} text-ink`
              }`}
            >
              {step.value}
            </span>
            <span className="flex items-center gap-1.5 text-meta font-medium text-ink-2">
              <span
                aria-hidden="true"
                className={`hidden h-2 w-2 flex-none rounded-full sm:inline-block ${step.dot}`}
              />
              {step.label}
            </span>
            {step.caption ? (
              <span className="-mt-1 text-meta text-muted">{step.caption}</span>
            ) : null}
          </>
        );
        const className =
          "relative flex flex-col items-center gap-2 rounded-xl px-1 py-1 text-center";
        return (
          <li key={step.key} className="min-w-0">
            {step.href ? (
              <Link
                href={step.href}
                className={`${className} transition-colors duration-150 hover:bg-sunken`}
              >
                {body}
              </Link>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
