import type { ApplicationStage } from "@/lib/api";

type StageStyle = {
  /** Dot, card edge. */
  dot: string;
  /** Column header band, pipeline node. */
  tint: string;
  /** Left edge on record cards. */
  edge: string;
};

const neutral: StageStyle = {
  dot: "bg-stage-prep",
  tint: "bg-stage-prep-tint",
  edge: "before:bg-stage-prep"
};

export const stageStyle: Record<ApplicationStage, StageStyle> = {
  Saved: neutral,
  Preparing: neutral,
  Withdrawn: neutral,
  Applied: {
    dot: "bg-stage-applied",
    tint: "bg-stage-applied-tint",
    edge: "before:bg-stage-applied"
  },
  "Online Assessment": {
    dot: "bg-stage-interview",
    tint: "bg-stage-interview-tint",
    edge: "before:bg-stage-interview"
  },
  Interview: {
    dot: "bg-stage-interview",
    tint: "bg-stage-interview-tint",
    edge: "before:bg-stage-interview"
  },
  Offer: {
    dot: "bg-stage-offer",
    tint: "bg-stage-offer-tint",
    edge: "before:bg-stage-offer"
  },
  Rejected: {
    dot: "bg-stage-rejected",
    tint: "bg-stage-rejected-tint",
    edge: "before:bg-stage-rejected"
  }
};

export function StageDot({ stage }: { stage: ApplicationStage }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 flex-none rounded-full ${stageStyle[stage].dot}`}
    />
  );
}

/** Stage shown as a dot plus its name, never a filled pill. */
export function StageLabel({
  stage,
  className = ""
}: {
  stage: ApplicationStage;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-meta font-medium text-ink-2 ${className}`}
    >
      <StageDot stage={stage} />
      {stage}
    </span>
  );
}
