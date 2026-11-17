import { describe, expect, it } from "vitest";

import { daysUntil, formatDate, relativeDays } from "./format";

describe("format", () => {
  it("parses plain dates as local calendar dates", () => {
    expect(formatDate("2026-11-20")).toBe("Nov 20, 2026");
  });

  it("falls back when there is no date", () => {
    expect(formatDate(null)).toBe("No date");
    expect(formatDate(null, "No deadline")).toBe("No deadline");
  });

  it("counts calendar days", () => {
    const today = new Date(2026, 10, 17, 23, 30);
    expect(daysUntil("2026-11-20", today)).toBe(3);
    expect(daysUntil("2026-11-17", today)).toBe(0);
    expect(daysUntil("2026-11-16", today)).toBe(-1);
  });

  it("describes relative days", () => {
    expect(relativeDays(0)).toBe("Today");
    expect(relativeDays(1)).toBe("Tomorrow");
    expect(relativeDays(3)).toBe("In 3 days");
    expect(relativeDays(21)).toBe("In 3 weeks");
    expect(relativeDays(-4)).toBe("4 days ago");
  });
});
