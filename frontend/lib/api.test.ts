import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createApplicationDraft,
  createPreparationPlan,
  createRoleAnalysis
} from "./api";

describe("agent API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends application draft generation requests to the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "analysis-1",
          job_posting_id: "job-1",
          job_title: "Developer",
          company: "Atlas",
          analysis_type: "application_draft",
          provider: "mock",
          provider_model: "mock-deterministic",
          result: {
            application_summary: "Summary",
            keywords: [],
            emphasis: [],
            missing_information_questions: [],
            cover_letter: "",
            autofill_preview: [],
            warnings: []
          },
          created_at: "2026-07-27T00:00:00Z",
          updated_at: "2026-07-27T00:00:00Z"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await createApplicationDraft("job-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/agents/application-draft"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ job_posting_id: "job-1" })
      })
    );
  });

  it("sends role analysis and preparation-plan generation requests", async () => {
    const responseBody = {
      id: "analysis-1",
      job_posting_id: "job-1",
      job_title: "Developer",
      company: "Atlas",
      analysis_type: "role_analysis",
      provider: "mock",
      provider_model: "mock-deterministic",
      result: {},
      created_at: "2026-07-27T00:00:00Z",
      updated_at: "2026-07-27T00:00:00Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await createRoleAnalysis("job-1");
    await createPreparationPlan({
      jobPostingId: "job-1",
      roleAnalysisId: "analysis-1"
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/v1/agents/role-analysis"),
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/v1/agents/preparation-plan"),
      expect.objectContaining({
        body: JSON.stringify({
          job_posting_id: "job-1",
          role_analysis_id: "analysis-1"
        })
      })
    );
  });
});
