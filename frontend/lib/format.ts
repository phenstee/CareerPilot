// One place for date formatting. Dates from the API are either ISO
// timestamps or plain `YYYY-MM-DD` strings; plain dates are parsed as local
// calendar dates so they never shift a day across time zones.

function toDate(value: string): Date {
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) {
    return new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]));
  }
  return new Date(value);
}

export function formatDate(
  value: string | null | undefined,
  fallback = "No date"
): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(toDate(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(toDate(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(toDate(value));
}

export function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(value);
}

export function dateParts(value: string): { month: string; day: string } {
  const date = toDate(value);
  return {
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    day: String(date.getDate())
  };
}

/** Whole calendar days from `today` until `value`. Negative when past. */
export function daysUntil(value: string, today: Date = new Date()): number {
  const target = toDate(value);
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const end = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function relativeDays(days: number): string {
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days === -1) return "Yesterday";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}

/** Deadlines within this many days get the "soon" treatment. */
export const SOON_DAYS = 3;
