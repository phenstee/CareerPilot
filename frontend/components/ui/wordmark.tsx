import Link from "next/link";

/** The one brand mark: "Career" in ink, "Pilot" in italic accent. */
export function Wordmark({
  href = "/",
  tone = "ink",
  className = ""
}: {
  href?: string;
  tone?: "ink" | "cream";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-baseline rounded-sm font-serif text-wordmark font-medium ${
        tone === "cream" ? "text-cream" : "text-ink"
      } ${className}`}
    >
      Career
      <span
        className={`italic ${tone === "cream" ? "text-highlight" : "text-accent"}`}
      >
        Pilot
      </span>
    </Link>
  );
}
