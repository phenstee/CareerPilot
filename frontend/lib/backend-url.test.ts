import { afterEach, describe, expect, it, vi } from "vitest";

import { getConfiguredBackendUrl } from "./backend-url";

describe("backend URL configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the browser-visible backend URL for local dev when the internal Docker hostname is present", () => {
    vi.stubEnv("BACKEND_INTERNAL_URL", "http://backend:8000");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

    expect(getConfiguredBackendUrl()).toBe("http://localhost:8000");
  });

  it("uses the internal backend URL inside Docker", () => {
    vi.stubEnv("CAREERPILOT_DOCKER", "true");
    vi.stubEnv("BACKEND_INTERNAL_URL", "http://backend:8000");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

    expect(getConfiguredBackendUrl()).toBe("http://backend:8000");
  });

  it("allows a non-Docker internal backend URL for production deployments", () => {
    vi.stubEnv("BACKEND_INTERNAL_URL", "https://api.careerpilot.example");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://public-api.example");

    expect(getConfiguredBackendUrl()).toBe("https://api.careerpilot.example");
  });
});
