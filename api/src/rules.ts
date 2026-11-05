import type { CaseResult, ExtractedClaim, FactOverrides, IsoDate } from "@claimsathi/contracts";
import { runRules } from "@claimsathi/rules";

export interface RecalculateInput {
  saved: CaseResult;
  extracted: ExtractedClaim;
  overrides: FactOverrides;
  asOfDate: IsoDate;
}

// The saved result keeps caseToken, extracted and resultSource. Everything the rules decide is replaced.
export function recalculateResult({ saved, extracted, overrides, asOfDate }: RecalculateInput): CaseResult {
  return { ...saved, ...runRules({ extracted, overrides, asOfDate }) };
}
