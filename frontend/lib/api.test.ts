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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(completedAnalysisTask("analysis-1"), 202)
      )
      .mockResolvedValueOnce(
        jsonResponse({
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
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await createApplicationDraft("job-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/agents/application-draft"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String)
        }),
        body: JSON.stringify({ job_posting_id: "job-1" })
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/analyses/analysis-1"),
      expect.objectContaining({ credentials: "include" })
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
        jsonResponse(completedAnalysisTask("analysis-1"), 202)
      )
      .mockResolvedValueOnce(jsonResponse(responseBody))
      .mockResolvedValueOnce(
        jsonResponse(completedAnalysisTask("analysis-2"), 202)
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...responseBody,
          id: "analysis-2",
          analysis_type: "preparation_plan"
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
      expect.stringContaining("/api/v1/analyses/analysis-1"),
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/api/v1/agents/preparation-plan"),
      expect.objectContaining({
        body: JSON.stringify({
          job_posting_id: "job-1",
          role_analysis_id: "analysis-1"
        })
      })
    );
  });

  it("surfaces backend generation errors without local fallback content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "AI analysis is temporarily unavailable."
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(createApplicationDraft("job-1")).rejects.toThrow(
      "AI analysis is temporarily unavailable."
    );
  });

  it("surfaces stale role-analysis conflicts from preparation-plan requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail:
              "The role analysis is outdated. Regenerate it before creating a preparation plan."
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(
      createPreparationPlan({
        jobPostingId: "job-1",
        roleAnalysisId: "analysis-1"
      })
    ).rejects.toThrow(
      "The role analysis is outdated. Regenerate it before creating a preparation plan."
    );
  });
});

function completedAnalysisTask(analysisId: string) {
  return {
    id: `task-${analysisId}`,
    task_type: "role_analysis",
    status: "SUCCEEDED",
    attempt_count: 1,
    max_attempts: 3,
    created_at: "2026-07-27T00:00:00Z",
    queued_at: "2026-07-27T00:00:00Z",
    started_at: "2026-07-27T00:00:00Z",
    finished_at: "2026-07-27T00:00:01Z",
    last_error_code: null,
    last_error_message: null,
    result_resource_type: "job_analysis",
    result_resource_id: analysisId
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
