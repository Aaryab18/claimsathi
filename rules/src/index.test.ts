import { describe, expect, it } from "vitest";
import {
  CaseResultSchema,
  sampleCaseResult,
  sampleExtractedClaim,
  type ExtractedClaim,
  type FactOverrides,
} from "@claimsathi/contracts";
import { runRules } from "./index.js";

describe("ClaimSathi rules engine - member-c/rules", () => {
  it("matches sampleCaseResult verdicts and amounts on sampleExtractedClaim", () => {
    const result = runRules({
      extracted: sampleExtractedClaim,
      asOfDate: "2026-11-05",
    });

    // Check totals
    expect(result.totals).toEqual({
      totalDeducted: 96000,
      recoverableStrong: 71400,
      questionable: 7800,
      validDeductions: 16800,
    });

    // Check findings verdicts and amounts match sampleCaseResult
    expect(result.findings.length).toBe(sampleCaseResult.findings.length);
    for (let i = 0; i < sampleCaseResult.findings.length; i++) {
      const actual = result.findings[i]!;
      const expected = sampleCaseResult.findings[i]!;
      expect(actual.verdict).toBe(expected.verdict);
      expect(actual.amount).toBe(expected.amount);
      expect(actual.lineItemIds).toEqual(expected.lineItemIds);
      expect(actual.ruleIds).toEqual(expected.ruleIds);
    }
  });

  it("passes CaseResultSchema when combined with sample's other fields", () => {
    const result = runRules({
      extracted: sampleExtractedClaim,
      asOfDate: "2026-11-05",
    });

    const combinedCaseResult = {
      caseToken: "sample-case",
      extracted: sampleExtractedClaim,
      findings: result.findings,
      deadlines: result.deadlines,
      totals: result.totals,
      resultSource: "saved_sample" as const,
    };

    const parsed = CaseResultSchema.safeParse(combinedCaseResult);
    expect(parsed.success).toBe(true);
  });

  it("handles what-if: continuousCoverSince set to 2024-01-01 falls recoverableStrong by 20600", () => {
    const whatIf = runRules({
      extracted: sampleExtractedClaim,
      overrides: { continuousCoverSince: "2024-01-01" },
      asOfDate: "2026-11-05",
    });

    // ₹20,600 finding (L5) is no longer "wrong"
    const l5Finding = whatIf.findings.find((f) => f.lineItemIds.includes("L5"));
    expect(l5Finding).toBeDefined();
    expect(l5Finding?.verdict).not.toBe("wrong");
    expect(l5Finding?.verdict).toBe("questionable");
    expect(l5Finding?.amount).toBe(20600);

    // recoverableStrong falls by 20600
    expect(whatIf.totals.recoverableStrong).toBe(71400 - 20600);
    expect(whatIf.totals.questionable).toBe(7800 + 20600);
    expect(whatIf.totals.totalDeducted).toBe(96000);
  });

  describe("rule passing and failing cases", () => {
    const baseClaim: ExtractedClaim = {
      claim: {
        claimId: "TEST-CLM-001",
        insurer: "Test Insurer",
        policyNumber: "TEST-POL-001",
        patient: { name: "Patient A", age: 40, city: "Delhi" },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-05",
        diagnosis: "Test diagnosis",
        amountClaimed: 100000,
        amountApproved: 50000,
      },
      policy: {
        planType: "Individual",
        startDate: "2025-01-01",
        continuousCoverSince: "2025-01-01",
        sumInsured: 500000,
        roomRentLimit: 5000,
        pedWaitingMonths: 24,
        copayPercent: null,
        subLimits: [],
      },
      rejection: {
        type: "partial",
        letterDate: "2025-10-10",
        reasons: [],
      },
      lineItems: [],
      policyClauses: [],
    };

    it("R1 Moratorium: passing (>= 60 months) is wrong, failing (< 60 months) is not wrong", () => {
      // Passing: cover 70 months (since 2019-12-01 to 2025-10-01), pedWaitingMonths is high (99) so R2 does not fire
      const claimPassing: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, continuousCoverSince: "2019-12-01", pedWaitingMonths: 99 },
        lineItems: [
          {
            id: "PED-1",
            description: "PED item",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED - Rs. 10,000" },
          },
        ],
      };

      const resPass = runRules({ extracted: claimPassing, asOfDate: "2025-11-01" });
      expect(resPass.findings[0]?.verdict).toBe("wrong");
      expect(resPass.findings[0]?.ruleIds).toEqual(["R1"]);

      // Failing: cover 40 months (< 60), pedWaitingMonths 99
      const claimFailing: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, continuousCoverSince: "2022-06-01", pedWaitingMonths: 99 },
        lineItems: [
          {
            id: "PED-1",
            description: "PED item",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED - Rs. 10,000" },
          },
        ],
      };

      const resFail = runRules({ extracted: claimFailing, asOfDate: "2025-11-01" });
      expect(resFail.findings[0]?.verdict).toBe("questionable");
      expect(resFail.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
    });

    it("R2 Waiting period: passing (ended before admission) is wrong, failing is not wrong", () => {
      // Passing: cover 30 months (< 60 so R1 doesn't fire), waiting period 24 months (passed)
      const claimPassing: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, continuousCoverSince: "2023-04-01", pedWaitingMonths: 24 },
        lineItems: [
          {
            id: "PED-2",
            description: "PED item",
            category: "other",
            billed: 15000,
            approved: 0,
            deducted: 15000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED - Rs. 15,000" },
          },
        ],
      };

      const resPass = runRules({ extracted: claimPassing, asOfDate: "2025-11-01" });
      expect(resPass.findings[0]?.verdict).toBe("wrong");
      expect(resPass.findings[0]?.ruleIds).toEqual(["R2"]);

      // Failing: cover 10 months, waiting period 24 months
      const claimFailing: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, continuousCoverSince: "2024-12-01", pedWaitingMonths: 24 },
        lineItems: [
          {
            id: "PED-2",
            description: "PED item",
            category: "other",
            billed: 15000,
            approved: 0,
            deducted: 15000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED - Rs. 15,000" },
          },
        ],
      };

      const resFail = runRules({ extracted: claimFailing, asOfDate: "2025-11-01" });
      expect(resFail.findings[0]?.verdict).toBe("questionable");
      expect(resFail.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
    });

    it("R1 and R2: groups both into one finding when both apply", () => {
      // Cover 80 months (>= 60) and waiting period 48 months (ended)
      const claimBoth: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, continuousCoverSince: "2019-01-01", pedWaitingMonths: 48 },
        lineItems: [
          {
            id: "PED-3",
            description: "PED item",
            category: "other",
            billed: 20000,
            approved: 0,
            deducted: 20000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED - Rs. 20,000" },
          },
        ],
      };

      const res = runRules({ extracted: claimBoth, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("wrong");
      expect(res.findings[0]?.ruleIds).toEqual(["R1", "R2"]);
    });

    it("R3 Proportionate deduction: pharmacy/consumable/implant/diagnostic is wrong, others are questionable", () => {
      const claimR3: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "PROP-1",
            description: "Diagnostic scan",
            category: "diagnostic",
            billed: 8000,
            approved: 5000,
            deducted: 3000,
            deductionType: "proportionate",
            deductionReason: "Room rent ratio",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Scan - Rs. 8,000" },
          },
          {
            id: "PROP-2",
            description: "Procedure fee",
            category: "procedure",
            billed: 20000,
            approved: 12000,
            deducted: 8000,
            deductionType: "proportionate",
            deductionReason: "Room rent ratio",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Procedure - Rs. 20,000" },
          },
        ],
      };

      const res = runRules({ extracted: claimR3, asOfDate: "2025-11-01" });
      const f1 = res.findings.find((f) => f.lineItemIds.includes("PROP-1"));
      const f2 = res.findings.find((f) => f.lineItemIds.includes("PROP-2"));

      expect(f1?.verdict).toBe("wrong");
      expect(f1?.ruleIds).toEqual(["R3"]);

      expect(f2?.verdict).toBe("questionable");
      expect(f2?.ruleIds).toEqual(["UNDECIDED"]);
    });

    it("R4 Non-payable: partOfPackage true is wrong, admin or partOfPackage null is questionable", () => {
      const claimR4: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "NP-1",
            description: "Surgical gloves",
            category: "consumable",
            billed: 5000,
            approved: 0,
            deducted: 5000,
            deductionType: "non_payable",
            deductionReason: "Non-medical",
            partOfPackage: true,
            source: { document: "bill", page: 1, quote: "Gloves - Rs. 5,000" },
          },
          {
            id: "NP-2",
            description: "Hospital admin surcharge",
            category: "admin",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "non_payable",
            deductionReason: "Admin fee",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Admin fee - Rs. 3,000" },
          },
          {
            id: "NP-3",
            description: "Special diet meal",
            category: "other",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "non_payable",
            deductionReason: "Food",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Diet - Rs. 2,000" },
          },
        ],
      };

      const res = runRules({ extracted: claimR4, asOfDate: "2025-11-01" });
      const f1 = res.findings.find((f) => f.lineItemIds.includes("NP-1"));
      const f2 = res.findings.find((f) => f.lineItemIds.includes("NP-2"));
      const f3 = res.findings.find((f) => f.lineItemIds.includes("NP-3"));

      expect(f1?.verdict).toBe("wrong");
      expect(f1?.ruleIds).toEqual(["R4"]);

      expect(f2?.verdict).toBe("questionable");
      expect(f2?.ruleIds).toEqual(["R4"]);

      expect(f3?.verdict).toBe("questionable");
      expect(f3?.ruleIds).toEqual(["R4"]);
    });

    it("room_rent_excess is valid with empty ruleIds", () => {
      const claimRoom: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "RR-1",
            description: "Deluxe room excess",
            category: "room",
            billed: 20000,
            approved: 15000,
            deducted: 5000,
            deductionType: "room_rent_excess",
            deductionReason: "Over sub-limit",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Room excess - Rs. 5,000" },
          },
        ],
      };

      const res = runRules({ extracted: claimRoom, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("valid");
      expect(res.findings[0]?.ruleIds).toEqual([]);
      expect(res.totals.validDeductions).toBe(5000);
    });

    it("undecided deductions are questionable with ruleId UNDECIDED and never wrong", () => {
      const claimUnknown: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "UNK-1",
            description: "Co-pay deduction",
            category: "other",
            billed: 10000,
            approved: 8000,
            deducted: 2000,
            deductionType: "copay",
            deductionReason: "10% copay applied",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Copay - Rs. 2,000" },
          },
        ],
      };

      const res = runRules({ extracted: claimUnknown, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("questionable");
      expect(res.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
      expect(res.findings[0]?.verdict).not.toBe("wrong");
    });
  });

  it("never produces 'wrong' when needed facts are null", () => {
    const claimWithNulls: ExtractedClaim = {
      claim: {
        claimId: "NULL-TEST",
        insurer: "Test Insurer",
        policyNumber: "POL-NULL",
        patient: { name: "Patient B", age: 50, city: null },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-05",
        diagnosis: "Observation",
        amountClaimed: 50000,
        amountApproved: 10000,
      },
      policy: {
        planType: null,
        startDate: null,
        continuousCoverSince: null,
        sumInsured: 500000,
        roomRentLimit: null,
        pedWaitingMonths: null,
        copayPercent: null,
        subLimits: [],
      },
      rejection: {
        type: "partial",
        letterDate: "2025-10-10",
        reasons: [],
      },
      lineItems: [
        {
          id: "NULL-PED",
          description: "PED item with null dates",
          category: "other",
          billed: 15000,
          approved: 0,
          deducted: 15000,
          deductionType: "pre_existing_disease",
          deductionReason: "PED",
          partOfPackage: null,
          source: { document: "bill", page: 1, quote: "PED - Rs. 15,000" },
        },
        {
          id: "NULL-PROP",
          description: "Proportionate with null category",
          category: null,
          billed: 10000,
          approved: 6000,
          deducted: 4000,
          deductionType: "proportionate",
          deductionReason: "Room limit ratio",
          partOfPackage: null,
          source: { document: "bill", page: 1, quote: "Prop - Rs. 4,000" },
        },
        {
          id: "NULL-NP",
          description: "Non-payable with null package",
          category: null,
          billed: 5000,
          approved: 0,
          deducted: 5000,
          deductionType: "non_payable",
          deductionReason: "Non payable",
          partOfPackage: null,
          source: { document: "bill", page: 1, quote: "NP - Rs. 5,000" },
        },
      ],
      policyClauses: [],
    };

    const res = runRules({ extracted: claimWithNulls, asOfDate: "2025-11-01" });

    // None of the findings should be "wrong"
    for (const finding of res.findings) {
      expect(finding.verdict).not.toBe("wrong");
      expect(finding.verdict).toBe("questionable");
    }
    expect(res.totals.recoverableStrong).toBe(0);
  });

  it("does not mutate the input object or overrides", () => {
    const originalClaim = JSON.parse(JSON.stringify(sampleExtractedClaim));
    const overrides: FactOverrides = {
      continuousCoverSince: "2024-01-01",
      lineItemCategories: [{ lineItemId: "L4", category: "procedure" }],
    };
    const originalOverrides = JSON.parse(JSON.stringify(overrides));

    runRules({
      extracted: sampleExtractedClaim,
      overrides,
      asOfDate: "2026-11-05",
    });

    expect(sampleExtractedClaim).toEqual(originalClaim);
    expect(overrides).toEqual(originalOverrides);
  });
});
