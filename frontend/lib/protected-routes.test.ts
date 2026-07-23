import { describe, expect, it } from "vitest";

import { isProtectedPath } from "./protected-routes";

describe("isProtectedPath", () => {
  it("matches protected route roots and nested pages", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/jobs/123")).toBe(true);
    expect(isProtectedPath("/applications/abc/interview")).toBe(true);
  });

  it("does not match public or similarly prefixed routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
    expect(isProtectedPath("/jobs-board")).toBe(false);
  });
});
