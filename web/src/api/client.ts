import { sampleCaseResult, type CaseResult } from "@claimsathi/contracts";

export async function getCaseResult(_caseToken?: string): Promise<CaseResult> {
  // In the future, this will call GET /cases/:token from VITE_API_URL.
  // For now, it returns the sample case result from @claimsathi/contracts.
  return Promise.resolve(sampleCaseResult);
}
