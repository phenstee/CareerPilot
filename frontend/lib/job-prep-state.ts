import { type AnalysisType } from "./api";

export function analysisQueryKey(jobId: string, analysisType: AnalysisType) {
  return ["analyses", jobId, analysisType] as const;
}

export function canGeneratePreparationPlan({
  selectedJobId,
  hasRoleAnalysis,
  roleAnalysisIsStale,
  isPending
}: {
  selectedJobId: string;
  hasRoleAnalysis: boolean;
  roleAnalysisIsStale: boolean;
  isPending: boolean;
}): boolean {
  return (
    Boolean(selectedJobId) &&
    hasRoleAnalysis &&
    !roleAnalysisIsStale &&
    !isPending
  );
}

export function preparationPlanDisabledReason({
  hasRoleAnalysis,
  roleAnalysisIsStale
}: {
  hasRoleAnalysis: boolean;
  roleAnalysisIsStale: boolean;
}): string | null {
  if (!hasRoleAnalysis) {
    return "Generate role analysis first.";
  }
  if (roleAnalysisIsStale) {
    return "The role analysis is outdated. Regenerate it before creating a preparation plan.";
  }
  return null;
}
