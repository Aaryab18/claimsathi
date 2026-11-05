import type { CaseResult, ExtractedClaim, FactOverrides, IsoDate, ResultSource } from "@claimsathi/contracts";
import { runRules } from "@claimsathi/rules";

export interface RecalculateInput {
  saved: CaseResult;
  extracted: ExtractedClaim;
  overrides: FactOverrides;
  asOfDate: IsoDate;
}

// What the person corrected replaces what was read, so screens and letters don't show the old facts.
function withCorrections(extracted: ExtractedClaim, overrides: FactOverrides): ExtractedClaim {
  const categories = new Map(overrides.lineItemCategories?.map((item) => [item.lineItemId, item.category]));
  return {
    ...extracted,
    claim: { ...extracted.claim, admissionDate: overrides.admissionDate ?? extracted.claim.admissionDate },
    policy: {
      ...extracted.policy,
      startDate: overrides.policyStartDate ?? extracted.policy.startDate,
      continuousCoverSince: overrides.continuousCoverSince ?? extracted.policy.continuousCoverSince,
    },
    lineItems: extracted.lineItems.map((item) => ({ ...item, category: categories.get(item.id) ?? item.category })),
  };
}

// The saved result keeps caseToken and resultSource. Everything the rules decide is replaced.
export function recalculateResult({ saved, extracted, overrides, asOfDate }: RecalculateInput): CaseResult {
  return {
    ...saved,
    ...runRules({ extracted, overrides, asOfDate }),
    extracted: withCorrections(extracted, overrides),
  };
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
