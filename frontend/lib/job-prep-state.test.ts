import { describe, expect, it } from "vitest";

import {
  analysisQueryKey,
  canGeneratePreparationPlan,
  preparationPlanDisabledReason
} from "./job-prep-state";

describe("job preparation UI state", () => {
  it("disables plan generation for stale role analyses", () => {
    expect(
      canGeneratePreparationPlan({
        selectedJobId: "job-1",
        hasRoleAnalysis: true,
        roleAnalysisIsStale: true,
        isPending: false
      })
    ).toBe(false);
    expect(
      preparationPlanDisabledReason({
        hasRoleAnalysis: true,
        roleAnalysisIsStale: true
      })
    ).toBe(
      "The role analysis is outdated. Regenerate it before creating a preparation plan."
    );
  });

  it("allows plan generation for current role analyses", () => {
    expect(
      canGeneratePreparationPlan({
        selectedJobId: "job-1",
        hasRoleAnalysis: true,
        roleAnalysisIsStale: false,
        isPending: false
      })
    ).toBe(true);
    expect(
      preparationPlanDisabledReason({
        hasRoleAnalysis: true,
        roleAnalysisIsStale: false
      })
    ).toBeNull();
  });

  it("uses stable query keys for invalidating role analysis and plans", () => {
    expect(analysisQueryKey("job-1", "role_analysis")).toEqual([
      "analyses",
      "job-1",
      "role_analysis"
    ]);
    expect(analysisQueryKey("job-1", "preparation_plan")).toEqual([
      "analyses",
      "job-1",
      "preparation_plan"
    ]);
  });
});
