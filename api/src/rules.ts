import type { CaseResult, ExtractedClaim, FactOverrides, IsoDate } from "@claimsathi/contracts";

export interface RecalculateInput {
  saved: CaseResult;
  extracted: ExtractedClaim;
  overrides: FactOverrides;
  asOfDate: IsoDate;
}

// TEMPORARY: @claimsathi/rules does not export runRules yet, so facts are saved but change nothing.
// When it does, this becomes the only line to change:
//   return { ...saved, ...runRules({ extracted, overrides, asOfDate }) };
export function recalculateResult({ saved }: RecalculateInput): CaseResult {
  return saved;
}
