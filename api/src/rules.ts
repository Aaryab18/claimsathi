import type { CaseResult, ExtractedClaim, FactOverrides, IsoDate, ResultSource } from "@claimsathi/contracts";
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

export interface AssessInput {
  caseToken: string;
  extracted: ExtractedClaim;
  asOfDate: IsoDate;
  resultSource?: ResultSource;
}

// A freshly read claim has no saved result yet, so the rules make the whole assessment.
export function assessClaim({ caseToken, extracted, asOfDate, resultSource = "live" }: AssessInput): CaseResult {
  return { caseToken, extracted, resultSource, ...runRules({ extracted, asOfDate }) };
}
