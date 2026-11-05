import { describe, expect, it } from "vitest";
import {
  API_ROUTES,
  ApplyFactsRequestSchema,
  AssessmentWarningSchema,
  CaseResultSchema,
  CaseStatusSchema,
  CreateCaseRequestSchema,
  CreateLetterRequestSchema,
  DeadlineSchema,
  ExtractedClaimSchema,
  FactOverridesSchema,
  FindingSchema,
  GetCaseResponseSchema,
  IsoDateSchema,
  PENDING_VERIFICATION,
  RupeesSchema,
  sampleCaseResult,
  sampleExtractedClaim,
  type RulesEngine,
  type RulesEngineResult,
} from "./index.js";

const sum = (values: (number | null)[]) => values.reduce<number>((total, value) => total + (value ?? 0), 0);
const copy = <T>(value: T): T => structuredClone(value);
const items = sampleExtractedClaim.lineItems;
const findings = sampleCaseResult.findings;

describe("fixtures", () => {
  it("pass their schemas", () => {
    expect(ExtractedClaimSchema.safeParse(sampleExtractedClaim).success).toBe(true);
    const parsed = CaseResultSchema.safeParse(sampleCaseResult);
    expect(parsed.error?.issues).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  it("line items add up to 210000 billed, 114000 approved and 96000 deducted", () => {
    expect(sum(items.map((item) => item.billed))).toBe(210000);
    expect(sum(items.map((item) => item.approved))).toBe(114000);
    expect(sum(items.map((item) => item.deducted))).toBe(96000);
  });

  it("every line item satisfies approved + deducted = billed", () => {
    for (const item of items) {
      expect(sum([item.approved, item.deducted]), item.id).toBe(item.billed);
    }
  });

  it("claim amounts agree with the line items", () => {
    expect(sampleExtractedClaim.claim.amountClaimed).toBe(210000);
    expect(sampleExtractedClaim.claim.amountApproved).toBe(114000);
  });

  it("finding amounts add up to 96000", () => {
    expect(sum(findings.map((finding) => finding.amount))).toBe(96000);
  });

  it("each finding's amount equals the deductions on its line items", () => {
    for (const finding of findings) {
      const covered = items.filter((item) => finding.lineItemIds.includes(item.id));
      expect(covered.length, finding.id).toBe(finding.lineItemIds.length);
      expect(sum(covered.map((item) => item.deducted)), finding.id).toBe(finding.amount);
    }
  });

  it("covers every deducted line item exactly once", () => {
    const coveredIds = findings.flatMap((finding) => finding.lineItemIds);
    const deductedIds = items.filter((item) => (item.deducted ?? 0) > 0).map((item) => item.id);
    expect(deductedIds.length).toBeGreaterThan(0);
    expect([...coveredIds].sort()).toEqual([...deductedIds].sort());
  });

  it("has the agreed findings", () => {
    expect(findings.map(({ ruleIds, verdict, amount }) => ({ ruleIds, verdict, amount }))).toEqual([
      { ruleIds: ["R3"], verdict: "wrong", amount: 38200 },
      { ruleIds: ["R4"], verdict: "wrong", amount: 12600 },
      { ruleIds: ["R1", "R2"], verdict: "wrong", amount: 20600 },
      { ruleIds: [], verdict: "valid", amount: 16800 },
      { ruleIds: ["R4"], verdict: "questionable", amount: 7800 },
    ]);
  });

  it("totals match the findings", () => {
    const amountFor = (verdict: string) =>
      sum(findings.filter((finding) => finding.verdict === verdict).map((finding) => finding.amount));
    expect(sampleCaseResult.totals).toEqual({
      totalDeducted: sum(findings.map((finding) => finding.amount)),
      recoverableStrong: amountFor("wrong"),
      questionable: amountFor("questionable"),
      validDeductions: amountFor("valid"),
    });
    expect(sampleCaseResult.totals).toEqual({
      totalDeducted: 96000,
      recoverableStrong: 71400,
      questionable: 7800,
      validDeductions: 16800,
    });
  });

  it("is labelled as a saved sample", () => {
    expect(sampleCaseResult.resultSource).toBe("saved_sample");
  });

  it("marks every regulation and deadline as unverified and pending", () => {
    expect(PENDING_VERIFICATION).toBe("Pending verification by Member C");
    for (const finding of findings) {
      expect(finding.evidence.regulation).toEqual({
        text: PENDING_VERIFICATION,
        sourceName: PENDING_VERIFICATION,
        verified: false,
      });
    }
    expect(sampleCaseResult.deadlines.length).toBeGreaterThan(0);
    for (const deadline of sampleCaseResult.deadlines) {
      expect(deadline.verified).toBe(false);
      expect(deadline.explanation).toBe(PENDING_VERIFICATION);
      expect(deadline.date).toBeNull();
    }
  });

  it("has English and Hindi explanations for every finding", () => {
    for (const finding of findings) {
      expect(finding.explanationEn, finding.id).toMatch(/[a-z]/i);
      expect(finding.explanationHi, finding.id).toMatch(/[ऀ-ॿ]/);
    }
  });
});

describe("money", () => {
  it("rejects decimal rupee amounts and negative amounts", () => {
    expect(RupeesSchema.safeParse(100).success).toBe(true);
    expect(RupeesSchema.safeParse(100.5).success).toBe(false);
    expect(RupeesSchema.safeParse(-1).success).toBe(false);
    expect(RupeesSchema.safeParse("100").success).toBe(false);
  });

  it("rejects a decimal amount on a line item, a finding and the totals", () => {
    const extracted = copy(sampleExtractedClaim);
    extracted.lineItems[0]!.billed = 41800.5;
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(false);

    expect(FindingSchema.safeParse({ ...findings[0], amount: 38200.5 }).success).toBe(false);

    const result = copy(sampleCaseResult);
    result.totals.totalDeducted = 96000.5;
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });
});

describe("dates", () => {
  it.each(["2025-11-10", "2024-02-29"])("accepts %s", (date) => {
    expect(IsoDateSchema.safeParse(date).success).toBe(true);
  });

  it.each(["10/11/2025", "2025-13-01", "2025-02-30", "2025-11-10T00:00:00Z", "March 2019"])("rejects %s", (date) => {
    expect(IsoDateSchema.safeParse(date).success).toBe(false);
  });
});

describe("missing facts", () => {
  it("accepts null for a fact missing from the documents", () => {
    const extracted = copy(sampleExtractedClaim);
    extracted.claim.diagnosis = null;
    extracted.policy.sumInsured = null;
    extracted.lineItems[0]!.source = null;
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(true);
  });

  it("rejects a fact that is left out instead of being null", () => {
    const { diagnosis: _diagnosis, ...claim } = sampleExtractedClaim.claim;
    expect(ExtractedClaimSchema.safeParse({ ...sampleExtractedClaim, claim }).success).toBe(false);
  });
});

describe("rule fields", () => {
  it("sample line items have the agreed deduction types and package flags", () => {
    expect(items.map(({ id, deductionType, partOfPackage }) => ({ id, deductionType, partOfPackage }))).toEqual([
      { id: "L1", deductionType: "room_rent_excess", partOfPackage: false },
      { id: "L2", deductionType: "proportionate", partOfPackage: null },
      { id: "L3", deductionType: "proportionate", partOfPackage: null },
      { id: "L4", deductionType: "non_payable", partOfPackage: true },
      { id: "L5", deductionType: "pre_existing_disease", partOfPackage: null },
      { id: "L6", deductionType: "non_payable", partOfPackage: null },
      { id: "L7", deductionType: "none", partOfPackage: null },
      { id: "L8", deductionType: "none", partOfPackage: null },
    ]);
  });

  it("uses the deduction type none exactly for items with no deduction", () => {
    for (const item of items) {
      expect(item.deductionType === "none", item.id).toBe(item.deducted === 0);
    }
  });

  it("sample rejection reasons have the agreed categories", () => {
    expect(sampleExtractedClaim.rejection.reasons.map((reason) => reason.category)).toEqual([
      "room_rent",
      "proportionate",
      "non_payable",
      "pre_existing_disease",
      "non_payable",
    ]);
  });

  it("every clause cited by a rejection reason exists in policyClauses, or is null", () => {
    const clauseIds = sampleExtractedClaim.policyClauses.map((clause) => clause.clauseId);
    expect(clauseIds).toEqual(["Clause 4.2", "Clause 5.1", "Clause 7.5"]);
    for (const { clauseCited } of sampleExtractedClaim.rejection.reasons) {
      if (clauseCited !== null) {
        expect(clauseIds).toContain(clauseCited);
      }
    }
    expect(sampleExtractedClaim.rejection.reasons.some((reason) => reason.clauseCited === null)).toBe(true);
  });

  it("sample clauses use the same wording the findings quote", () => {
    const clauses = sampleExtractedClaim.policyClauses;
    for (const clause of clauses) {
      expect(clause.source.document, clause.clauseId).toBe("policy");
      expect(clause.source.quote, clause.clauseId).toBe(clause.text);
    }
    const quoted = findings.flatMap((finding) => finding.evidence.policyClause ?? []);
    expect(quoted.length).toBeGreaterThan(0);
    for (const policyClause of quoted) {
      expect(clauses.map((clause) => `${clause.clauseId}: ${clause.text}`)).toContain(policyClause);
    }
  });

  it("sample has the fictional letter date and no sub-limits", () => {
    expect(sampleExtractedClaim.rejection.letterDate).toBe("2026-10-15");
    expect(sampleExtractedClaim.policy.subLimits).toEqual([]);
  });

  it("rejects unknown deductionType and category values", () => {
    const badType = copy(sampleExtractedClaim) as unknown as { lineItems: { deductionType: string }[] };
    badType.lineItems[0]!.deductionType = "made_up";
    expect(ExtractedClaimSchema.safeParse(badType).success).toBe(false);

    const badCategory = copy(sampleExtractedClaim) as unknown as { rejection: { reasons: { category: string }[] } };
    badCategory.rejection.reasons[0]!.category = "made_up";
    expect(ExtractedClaimSchema.safeParse(badCategory).success).toBe(false);
  });

  it.each(["deductionType", "partOfPackage"] as const)("rejects a line item missing %s, but accepts null", (field) => {
    const missing = copy(sampleExtractedClaim);
    delete (missing.lineItems[0] as Partial<(typeof items)[number]>)[field];
    expect(ExtractedClaimSchema.safeParse(missing).success).toBe(false);

    const stated = copy(sampleExtractedClaim);
    stated.lineItems[0]![field] = null;
    expect(ExtractedClaimSchema.safeParse(stated).success).toBe(true);
  });

  it("rejects a rejection reason missing its category, but accepts null", () => {
    const missing = copy(sampleExtractedClaim);
    delete (missing.rejection.reasons[0] as Partial<(typeof missing.rejection.reasons)[number]>).category;
    expect(ExtractedClaimSchema.safeParse(missing).success).toBe(false);

    const stated = copy(sampleExtractedClaim);
    stated.rejection.reasons[0]!.category = null;
    expect(ExtractedClaimSchema.safeParse(stated).success).toBe(true);
  });

  it("checks letterDate is a date or null", () => {
    const extracted = copy(sampleExtractedClaim);
    extracted.rejection.letterDate = null;
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(true);
    extracted.rejection.letterDate = "15/10/2026";
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(false);
  });

  it("checks sub-limit amounts are whole rupees or null", () => {
    const extracted = copy(sampleExtractedClaim);
    extracted.policy.subLimits = [{ name: "Cataract", amount: 40000, source: null }];
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(true);
    extracted.policy.subLimits[0]!.amount = null;
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(true);
    extracted.policy.subLimits[0]!.amount = 40000.5;
    expect(ExtractedClaimSchema.safeParse(extracted).success).toBe(false);
  });

  it("allows a null clause title, but requires clause text and source", () => {
    const clause = sampleExtractedClaim.policyClauses[0]!;
    const withClause = (policyClause: unknown) =>
      ExtractedClaimSchema.safeParse({ ...sampleExtractedClaim, policyClauses: [policyClause] }).success;
    expect(withClause({ ...clause, title: null })).toBe(true);
    expect(withClause({ ...clause, title: "Room rent" })).toBe(true);
    expect(withClause({ ...clause, text: null })).toBe(false);
    expect(withClause({ ...clause, source: null })).toBe(false);
  });
});

describe("findings", () => {
  it("rejects unknown verdicts and confidence levels", () => {
    expect(FindingSchema.safeParse({ ...findings[0], verdict: "maybe" }).success).toBe(false);
    expect(FindingSchema.safeParse({ ...findings[0], confidence: "certain" }).success).toBe(false);
  });

  it("allows an empty rule list only for a valid finding", () => {
    expect(FindingSchema.safeParse({ ...findings[3], ruleIds: [] }).success).toBe(true);
    expect(FindingSchema.safeParse({ ...findings[0], ruleIds: [] }).success).toBe(false);
    expect(FindingSchema.safeParse({ ...findings[4], ruleIds: [] }).success).toBe(false);
  });
});

describe("case result checks", () => {
  it("rejects a deducted line item that no finding covers", () => {
    const result = copy(sampleCaseResult);
    result.findings[0]!.lineItemIds = ["L2"];
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });

  it("rejects a line item covered by two findings", () => {
    const result = copy(sampleCaseResult);
    result.findings[1]!.lineItemIds = ["L4", "L2"];
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });

  it("rejects a finding that names an unknown line item", () => {
    const result = copy(sampleCaseResult);
    result.findings[1]!.lineItemIds = ["L4", "L99"];
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });

  it("rejects a finding amount that does not match its line items", () => {
    const result = copy(sampleCaseResult);
    result.findings[0]!.amount = 38000;
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });

  it("rejects totals that do not match the findings", () => {
    const result = copy(sampleCaseResult);
    result.totals.recoverableStrong = 79200;
    expect(CaseResultSchema.safeParse(result).success).toBe(false);
  });

  it("rejects an unknown result source", () => {
    expect(CaseResultSchema.safeParse({ ...sampleCaseResult, resultSource: "made_up" }).success).toBe(false);
  });
});

describe("deadlines", () => {
  const deadline = { label: "Example", date: null, explanation: "Example", verified: false };

  it("allows an unverified deadline with no date", () => {
    expect(DeadlineSchema.safeParse(deadline).success).toBe(true);
  });

  it("rejects a verified deadline with no date", () => {
    expect(DeadlineSchema.safeParse({ ...deadline, verified: true }).success).toBe(false);
    expect(DeadlineSchema.safeParse({ ...deadline, date: "2026-01-31", verified: true }).success).toBe(true);
  });
});

describe("fact overrides", () => {
  it("accepts no fields, or any of the fields", () => {
    expect(FactOverridesSchema.safeParse({}).success).toBe(true);
    expect(
      FactOverridesSchema.safeParse({
        policyStartDate: "2019-03-01",
        continuousCoverSince: "2019-03-01",
        admissionDate: "2025-11-10",
        lineItemCategories: [{ lineItemId: "L4", category: "procedure" }],
        insurerAskedForMissingDocument: false,
      }).success,
    ).toBe(true);
  });

  it("rejects misspelled fields, bad dates and unknown categories", () => {
    expect(FactOverridesSchema.safeParse({ admisionDate: "2025-11-10" }).success).toBe(false);
    expect(FactOverridesSchema.safeParse({ admissionDate: "10/11/2025" }).success).toBe(false);
    expect(
      FactOverridesSchema.safeParse({ lineItemCategories: [{ lineItemId: "L4", category: "food" }] }).success,
    ).toBe(false);
  });
});

describe("case status", () => {
  it("accepts each stage and rejects an unknown one", () => {
    for (const stage of ["queued", "reading", "checking", "drafting", "done", "failed"]) {
      expect(CaseStatusSchema.safeParse({ stage, progressMessage: "Working" }).success, stage).toBe(true);
    }
    expect(CaseStatusSchema.safeParse({ stage: "paused", progressMessage: "Working" }).success).toBe(false);
  });

  it("allows an error message", () => {
    expect(
      CaseStatusSchema.safeParse({ stage: "failed", progressMessage: "Stopped", errorMessage: "Unreadable file" })
        .success,
    ).toBe(true);
  });
});

describe("API contract", () => {
  it("lists every route", () => {
    expect(Object.values(API_ROUTES).map(({ method, path }) => `${method} ${path}`)).toEqual([
      "POST /cases",
      "POST /cases/sample",
      "GET /cases/:token",
      "PATCH /cases/:token/facts",
      "POST /cases/:token/letters",
    ]);
  });

  it("requires at least one uploaded document", () => {
    expect(CreateCaseRequestSchema.safeParse({ documents: [] }).success).toBe(false);
    expect(
      CreateCaseRequestSchema.safeParse({
        documents: [{ documentType: "bill", fileName: "bill.pdf", mimeType: "application/pdf", sizeBytes: 1000 }],
      }).success,
    ).toBe(true);
  });

  it("returns a result from GET /cases/:token when the case is done, and only then", () => {
    const done = { stage: "done", progressMessage: "Finished" };
    const reading = { stage: "reading", progressMessage: "Reading documents" };
    const base = { caseToken: "sample-case" };
    expect(GetCaseResponseSchema.safeParse({ ...base, status: done, result: sampleCaseResult }).success).toBe(true);
    expect(GetCaseResponseSchema.safeParse({ ...base, status: reading, result: null }).success).toBe(true);
    expect(GetCaseResponseSchema.safeParse({ ...base, status: done, result: null }).success).toBe(false);
    expect(GetCaseResponseSchema.safeParse({ ...base, status: reading, result: sampleCaseResult }).success).toBe(false);
  });

  it("uses FactOverrides as the PATCH request", () => {
    expect(ApplyFactsRequestSchema).toBe(FactOverridesSchema);
  });

  it("accepts only grievance and ombudsman letters", () => {
    expect(CreateLetterRequestSchema.safeParse({ letterType: "grievance" }).success).toBe(true);
    expect(CreateLetterRequestSchema.safeParse({ letterType: "ombudsman" }).success).toBe(true);
    expect(CreateLetterRequestSchema.safeParse({ letterType: "other" }).success).toBe(false);
  });
});

describe("assessment warnings", () => {
  const warning = { code: "no_line_items", messageEn: "No bill items were found.", messageHi: "बिल की कोई मद नहीं मिली।" };

  it("the sample passes with an empty warnings list", () => {
    expect(sampleCaseResult.warnings).toEqual([]);
    expect(CaseResultSchema.safeParse(sampleCaseResult).success).toBe(true);
  });

  it.each(["no_line_items", "missing_deduction_amount", "totals_do_not_match"])("accepts the code %s", (code) => {
    expect(AssessmentWarningSchema.safeParse({ ...warning, code }).success).toBe(true);
  });

  it("rejects unknown codes", () => {
    expect(AssessmentWarningSchema.safeParse({ ...warning, code: "made_up" }).success).toBe(false);
    expect(CaseResultSchema.safeParse({ ...sampleCaseResult, warnings: [{ ...warning, code: "made_up" }] }).success).toBe(
      false,
    );
  });

  it("rejects a warning with a missing or empty message", () => {
    const { messageHi: _messageHi, ...withoutHindi } = warning;
    expect(AssessmentWarningSchema.safeParse(withoutHindi).success).toBe(false);
    expect(AssessmentWarningSchema.safeParse({ ...warning, messageEn: "" }).success).toBe(false);
  });

  it("rejects a CaseResult with a missing warnings field", () => {
    const { warnings: _warnings, ...withoutWarnings } = sampleCaseResult;
    expect(CaseResultSchema.safeParse(withoutWarnings).success).toBe(false);
  });

  it("accepts a CaseResult that carries a warning", () => {
    expect(CaseResultSchema.safeParse({ ...sampleCaseResult, warnings: [warning] }).success).toBe(true);
  });

  it("requires warnings on RulesEngineResult", () => {
    // This one is checked by typecheck: it fails if warnings stops being required.
    // @ts-expect-error warnings is missing.
    const withoutWarnings: RulesEngineResult = {
      findings: [],
      deadlines: [],
      totals: { totalDeducted: 0, recoverableStrong: 0, questionable: 0, validDeductions: 0 },
    };
    expect(withoutWarnings).not.toHaveProperty("warnings");
  });
});

describe("rules engine type", () => {
  it("takes the extracted claim, optional overrides and an as-of date", () => {
    // A stand-in, only to prove the type's shape at compile time. It holds no rules.
    const engine: RulesEngine = ({ overrides }) => ({
      findings: overrides ? [] : sampleCaseResult.findings,
      deadlines: sampleCaseResult.deadlines,
      totals: sampleCaseResult.totals,
      warnings: [],
    });

    expect(engine({ extracted: sampleExtractedClaim, asOfDate: "2026-01-01" }).findings).toHaveLength(5);
    expect(engine({ extracted: sampleExtractedClaim, overrides: {}, asOfDate: "2026-01-01" }).findings).toHaveLength(0);
  });
});
