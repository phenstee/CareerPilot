import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "./redirects";

describe("sanitizeRedirectPath", () => {
  it("keeps local app paths with search and hash", () => {
    expect(sanitizeRedirectPath("/jobs?stage=Applied#top")).toBe(
      "/jobs?stage=Applied#top"
    );
  });

  it("rejects absolute, protocol-relative, and blank redirects", () => {
    expect(sanitizeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//example.com/path")).toBe("/dashboard");
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
  });
});
