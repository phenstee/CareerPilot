import { dateParts } from "@/lib/format";

/** Calendar tile: month band over a serif day. Marigold band when soon. */
export function DateTile({
  date,
  soon = false
}: {
  date: string;
  soon?: boolean;
}) {
  const { month, day } = dateParts(date);
  return (
    <span
      aria-hidden="true"
      className={`flex w-12 flex-none flex-col overflow-hidden rounded-lg border bg-surface text-center ${
        soon ? "border-highlight" : "border-line"
      }`}
    >
      <span
        className={`py-0.5 text-micro font-semibold uppercase tracking-wide ${
          soon ? "bg-highlight text-ink" : "bg-sunken text-ink-2"
        }`}
      >
        {month}
      </span>
      <span className="tabular py-1 font-serif text-count font-medium text-ink">
        {day}
      </span>
    </span>
  );
}

/** Italic serif initial on a soft green tile, for rows without a logo. */
export function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-subtle font-serif text-xl italic text-accent"
    >
      {initial}
    </span>
  );
}
