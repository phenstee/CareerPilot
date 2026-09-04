import type { ReactNode } from "react";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  brand: "badge-brand",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger"
};

export function Badge({
  children,
  tone = "neutral",
  className = ""
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={`badge ${toneClass[tone]} ${className}`}>{children}</span>
  );
}
