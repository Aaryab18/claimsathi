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
      warnings: result.warnings,
      resultSource: "saved_sample" as const,
    };

    const parsed = CaseResultSchema.safeParse(combinedCaseResult);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.error(parsed.error.issues);
    }
    expect(parsed.success).toBe(true);
  });

  it("sample case produces an empty warnings list", () => {
    const result = runRules({
      extracted: sampleExtractedClaim,
      asOfDate: "2026-11-05",
    });
    expect(result.warnings).toEqual([]);
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

    it("room_rent_excess is valid when average daily cost exceeds limit and deduction fits", () => {
      // 4 days (Oct 1-5), billed 28000, average 7000 > limit 5000, deducted 8000 <= 28000 - 5000*4 = 8000
      const claimRoom: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "RR-1",
            description: "Deluxe room excess",
            category: "room",
            billed: 28000,
            approved: 20000,
            deducted: 8000,
            deductionType: "room_rent_excess",
            deductionReason: "Over sub-limit",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Room excess" },
          },
        ],
      };

      const res = runRules({ extracted: claimRoom, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("valid");
      expect(res.findings[0]?.ruleIds).toEqual([]);
      expect(res.totals.validDeductions).toBe(8000);
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

  // ===== NEW TESTS FROM REVIEW =====

  describe("explanation text in English and Hindi", () => {
    const baseClaim: ExtractedClaim = {
      claim: {
        claimId: "TEXT-001",
        insurer: "Test Insurer",
        policyNumber: "TEST-POL-001",
        patient: { name: "Rahul Singh", age: 45, city: "Mumbai" },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-05",
        diagnosis: "Knee replacement",
        amountClaimed: 100000,
        amountApproved: 50000,
      },
      policy: {
        planType: "Individual",
        startDate: "2019-01-01",
        continuousCoverSince: "2019-01-01",
        sumInsured: 500000,
        roomRentLimit: 5000,
        pedWaitingMonths: 48,
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

    it("PED explanation uses the item's own description, not hypertension or diagnosis", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "PED-DESC",
            description: "Diabetes treatment",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Diabetes" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings[0]!;
      expect(finding.explanationEn).toContain("Diabetes treatment");
      expect(finding.explanationEn).not.toContain("hypertension");
      expect(finding.explanationEn).not.toContain("Knee replacement");
      expect(finding.explanationHi).toContain("Diabetes treatment");
      expect(finding.explanationHi).not.toContain("उच्च रक्तचाप");
    });

    it("PED explanation with hypertension item uses friendly Hindi wording", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "PED-HYP",
            description: "Hypertension monitoring and treatment",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Hypertension" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings[0]!;
      expect(finding.explanationEn).toContain("hypertension");
      expect(finding.explanationHi).toContain("हाइपरटेंशन (उच्च रक्तचाप)");
    });

    it("PED explanation uses neutral wording when description is null", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "PED-NULL",
            description: null,
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings[0]!;
      expect(finding.explanationEn).toContain("this condition");
      expect(finding.explanationEn).not.toContain("hypertension");
      expect(finding.explanationEn).not.toContain("Knee replacement");
    });

    it("R4 wrong explanation does not always say consumables or angioplasty", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "NP-CUSTOM",
            description: "Cardiac catheter",
            category: "consumable",
            billed: 8000,
            approved: 0,
            deducted: 8000,
            deductionType: "non_payable",
            deductionReason: "Non-payable",
            partOfPackage: true,
            source: { document: "bill", page: 1, quote: "Cardiac catheter" },
          },
          {
            id: "PKG",
            description: "Bypass surgery package",
            category: "procedure",
            billed: 50000,
            approved: 50000,
            deducted: 0,
            deductionType: "none",
            deductionReason: null,
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Bypass package" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("NP-CUSTOM"));
      expect(finding?.explanationEn).toContain("Cardiac catheter");
      expect(finding?.explanationEn).not.toContain("consumables");
      expect(finding?.explanationEn).toContain("Bypass surgery package");
    });

    it("R4 wrong does not say insurer approved the package when data does not show it", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "NP-NOPKG",
            description: "Sutures and bandages",
            category: "consumable",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "non_payable",
            deductionReason: "Non-payable",
            partOfPackage: true,
            source: { document: "bill", page: 1, quote: "Sutures" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("NP-NOPKG"));
      expect(finding?.explanationEn).not.toContain("insurer approved");
    });

    it("R4 questionable says 'without citing a policy clause' only when clauseCited is null", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        rejection: {
          ...baseClaim.rejection,
          reasons: [
            {
              text: "Admin charges not payable",
              category: "non_payable",
              clauseCited: "Clause 9.1",
              source: { document: "rejection_letter", page: 1, quote: "Admin charges not payable" },
            },
          ],
        },
        lineItems: [
          {
            id: "NP-CLAUSE",
            description: "Registration fee",
            category: "admin",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "non_payable",
            deductionReason: "Admin fee",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Registration fee" },
          },
        ],
        policyClauses: [
          {
            clauseId: "Clause 9.1",
            title: null,
            text: "Admin charges over Rs. 1000 are non-payable.",
            source: { document: "policy", page: 9, quote: "Admin charges over Rs. 1000 are non-payable." },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("NP-CLAUSE"));
      expect(finding?.explanationEn).not.toContain("without citing a policy clause");
      expect(finding?.explanationEn).toContain("Clause 9.1");
    });

    it("R3 explanation for non-pharmacy non-implant items does not say 'Medicines and a stent'", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "PROP-DIAG",
            description: "Blood test panel",
            category: "diagnostic",
            billed: 5000,
            approved: 3000,
            deducted: 2000,
            deductionType: "proportionate",
            deductionReason: "Room rent ratio",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Blood tests" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("PROP-DIAG"));
      expect(finding?.explanationEn).not.toContain("Medicines and a stent");
      expect(finding?.explanationEn).toContain("diagnostic");
    });

    it("grouped R4 items use their own descriptions, not just the first item's category", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "NP-ADMIN",
            description: "Administration charges",
            category: "admin",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "non_payable",
            deductionReason: "Admin",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Admin" },
          },
          {
            id: "NP-DIET",
            description: "Special dietary supplements",
            category: "admin",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "non_payable",
            deductionReason: "Diet",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Diet" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      // Both are admin + non_payable + partOfPackage false → both get R4 questionable
      // They should be grouped (same deductionType, verdict, ruleIds)
      const finding = res.findings.find((f) =>
        f.lineItemIds.includes("NP-ADMIN") && f.lineItemIds.includes("NP-DIET")
      );
      // If grouped together, description should say "administration charges" (all admin)
      expect(finding?.explanationEn).toContain("administration charges");
    });

    it("undecided explanation uses friendly deduction type names, not internal codes", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "UND-DOC",
            description: "Missing report",
            category: "other",
            billed: 5000,
            approved: 0,
            deducted: 5000,
            deductionType: "documentation",
            deductionReason: "Incomplete docs",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Missing report" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("UND-DOC"));
      expect(finding?.explanationEn).toContain("missing documentation");
      expect(finding?.explanationEn).not.toContain("under documentation");
      expect(finding?.explanationHi).toContain("दस्तावेज़ों की कमी");
    });

    it("undecided Hindi explanation includes the legal-check sentence", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "UND-HI",
            description: "Some charge",
            category: "other",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "copay",
            deductionReason: "Copay",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Copay" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("UND-HI"));
      expect(finding?.explanationHi).toContain("कानूनी संदर्भ की जाँच अभी बाकी है");
    });

    it("room rent valid explanation never says 'cannot be recovered'", () => {
      const res = runRules({ extracted: sampleExtractedClaim, asOfDate: "2026-11-05" });
      const roomFinding = res.findings.find((f) =>
        f.lineItemIds.includes("L1") && f.verdict === "valid"
      );
      expect(roomFinding).toBeDefined();
      expect(roomFinding?.explanationEn).not.toContain("cannot be recovered");
      expect(roomFinding?.explanationHi).not.toContain("वापस नहीं");
    });
  });

  describe("room rent: missing limit and room under the limit", () => {
    const baseClaim: ExtractedClaim = {
      claim: {
        claimId: "ROOM-TEST",
        insurer: "Test Insurer",
        policyNumber: "TEST-POL-001",
        patient: { name: "Patient A", age: 40, city: "Delhi" },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-05",
        diagnosis: "Test diagnosis",
        amountClaimed: 100000,
        amountApproved: 80000,
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

    it("room_rent_excess with missing roomRentLimit is questionable", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        policy: { ...baseClaim.policy, roomRentLimit: null },
        lineItems: [
          {
            id: "RR-NO-LIMIT",
            description: "Room rent excess",
            category: "room",
            billed: 20000,
            approved: 15000,
            deducted: 5000,
            deductionType: "room_rent_excess",
            deductionReason: "Over limit",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Room" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("questionable");
      expect(res.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
    });

    it("room_rent_excess with average cost at or below limit is questionable", () => {
      // 4 days, billed 16000, average 4000 < limit 5000 → questionable
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "RR-UNDER",
            description: "Room rent",
            category: "room",
            billed: 16000,
            approved: 12000,
            deducted: 4000,
            deductionType: "room_rent_excess",
            deductionReason: "Over limit",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Room" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res.findings[0]?.verdict).toBe("questionable");
    });
  });

  describe("full rejection and deducted: null", () => {
    it("full rejection with no line items produces no_line_items warning", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "FULL-REJ",
          insurer: "Test Insurer",
          policyNumber: "TEST-POL-001",
          patient: { name: "Patient A", age: 40, city: "Delhi" },
          admissionDate: "2025-10-01",
          dischargeDate: "2025-10-05",
          diagnosis: "Test diagnosis",
          amountClaimed: 100000,
          amountApproved: 0,
        },
        policy: {
          planType: "Individual",
          startDate: "2025-01-01",
          continuousCoverSince: "2025-01-01",
          sumInsured: 500000,
          roomRentLimit: null,
          pedWaitingMonths: null,
          copayPercent: null,
          subLimits: [],
        },
        rejection: {
          type: "full",
          letterDate: "2025-10-10",
          reasons: [
            {
              text: "Claim rejected in full.",
              category: "pre_existing_disease",
              clauseCited: null,
              source: { document: "rejection_letter", page: 1, quote: "Full rejection." },
            },
          ],
        },
        lineItems: [],
        policyClauses: [],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res.warnings.some((w) => w.code === "no_line_items")).toBe(true);
      expect(res.findings.length).toBe(0);
      expect(res.totals.totalDeducted).toBe(0);
    });

    it("deducted: null produces a questionable finding of amount 0 and missing_deduction_amount warning", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "NULL-DED",
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
        lineItems: [
          {
            id: "NULL-ITEM",
            description: "Some charge with unknown deduction",
            category: "other",
            billed: 5000,
            approved: 2000,
            deducted: null,
            deductionType: "non_payable",
            deductionReason: "Non payable",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Charge" },
          },
        ],
        policyClauses: [],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("NULL-ITEM"));
      expect(finding).toBeDefined();
      expect(finding?.verdict).toBe("questionable");
      expect(finding?.amount).toBe(0);
      expect(res.warnings.some((w) => w.code === "missing_deduction_amount")).toBe(true);
      // Must never show a complete-looking "Rs. 0" in the explanation
      expect(finding?.explanationEn).not.toMatch(/₹\s*0\b/);
    });

    it("totals_do_not_match warning fires when claimed - approved != total deducted", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "MISMATCH",
          insurer: "Test Insurer",
          policyNumber: "TEST-POL-001",
          patient: { name: "Patient A", age: 40, city: "Delhi" },
          admissionDate: "2025-10-01",
          dischargeDate: "2025-10-05",
          diagnosis: "Test",
          amountClaimed: 100000,
          amountApproved: 60000,
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
        lineItems: [
          {
            id: "MM-1",
            description: "Some item",
            category: "other",
            billed: 10000,
            approved: 5000,
            deducted: 5000,
            deductionType: "non_payable",
            deductionReason: "NP",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Item" },
          },
        ],
        policyClauses: [],
      };

      // claimed 100000 - approved 60000 = 40000, but totalDeducted = 5000
      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res.warnings.some((w) => w.code === "totals_do_not_match")).toBe(true);
    });
  });

  describe("evidence matching", () => {
    const baseClaim: ExtractedClaim = {
      claim: {
        claimId: "EV-001",
        insurer: "Test Insurer",
        policyNumber: "TEST-POL-001",
        patient: { name: "Patient A", age: 40, city: "Delhi" },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-05",
        diagnosis: "Test",
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
        reasons: [
          {
            text: "Registration charges are not payable",
            category: "non_payable",
            clauseCited: "Clause 7.5",
            source: { document: "rejection_letter", page: 1, quote: "Registration charges not payable." },
          },
          {
            text: "Consumables deducted as non-payable",
            category: "non_payable",
            clauseCited: null,
            source: { document: "rejection_letter", page: 1, quote: "Consumables of Rs. 5,000 are non-payable." },
          },
        ],
      },
      lineItems: [],
      policyClauses: [
        {
          clauseId: "Clause 7.5",
          title: null,
          text: "Non-medical items are not payable.",
          source: { document: "policy", page: 7, quote: "Non-medical items are not payable." },
        },
      ],
    };

    it("insurerText comes from rejection reason, not from bill text or deductionReason", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        lineItems: [
          {
            id: "EV-BILL",
            description: "Registration fee",
            category: "admin",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "non_payable",
            deductionReason: "THIS SHOULD NOT APPEAR AS insurerText",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "THIS BILL QUOTE SHOULD NOT APPEAR" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("EV-BILL"));
      expect(finding?.evidence.insurerText).not.toBe("THIS SHOULD NOT APPEAR AS insurerText");
      expect(finding?.evidence.insurerText).not.toBe("THIS BILL QUOTE SHOULD NOT APPEAR");
    });

    it("insurerText from a line item's source is used only if its document is rejection_letter", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        rejection: { ...baseClaim.rejection, reasons: [] },
        lineItems: [
          {
            id: "EV-REJ-SRC",
            description: "Some charge",
            category: "other",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "copay",
            deductionReason: "Copay applied",
            partOfPackage: null,
            source: { document: "rejection_letter", page: 1, quote: "Copay of 10% applied." },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("EV-REJ-SRC"));
      expect(finding?.evidence.insurerText).toBe("Copay of 10% applied.");
    });

    it("insurerText is null when no rejection reason matches and item source is not rejection_letter", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        rejection: { ...baseClaim.rejection, reasons: [] },
        lineItems: [
          {
            id: "EV-NO-MATCH",
            description: "Some charge",
            category: "other",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "sub_limit",
            deductionReason: "Sub limit applied",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Bill quote" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("EV-NO-MATCH"));
      expect(finding?.evidence.insurerText).toBeNull();
    });

    it("policyClause is null when clauseCited does not match any policyClauses entry", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        rejection: {
          ...baseClaim.rejection,
          reasons: [
            {
              text: "Deduction applied",
              category: "non_payable",
              clauseCited: "Clause 99.9",
              source: { document: "rejection_letter", page: 1, quote: "Deducted" },
            },
          ],
        },
        lineItems: [
          {
            id: "EV-BAD-CLAUSE",
            description: "Registration fee",
            category: "admin",
            billed: 2000,
            approved: 0,
            deducted: 2000,
            deductionType: "non_payable",
            deductionReason: "NP",
            partOfPackage: false,
            source: { document: "bill", page: 1, quote: "Reg fee" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("EV-BAD-CLAUSE"));
      expect(finding?.evidence.policyClause).toBeNull();
    });

    it("deductionType documentation maps to category documentation_missing for evidence", () => {
      const claim: ExtractedClaim = {
        ...baseClaim,
        rejection: {
          ...baseClaim.rejection,
          reasons: [
            {
              text: "Missing documentation for this item.",
              category: "documentation_missing",
              clauseCited: null,
              source: { document: "rejection_letter", page: 1, quote: "Missing documentation" },
            },
          ],
        },
        lineItems: [
          {
            id: "EV-DOC",
            description: "Lab report not submitted",
            category: "other",
            billed: 3000,
            approved: 0,
            deducted: 3000,
            deductionType: "documentation",
            deductionReason: "Missing docs",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Lab report" },
          },
        ],
      };

      const res = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      const finding = res.findings.find((f) => f.lineItemIds.includes("EV-DOC"));
      expect(finding?.evidence.insurerText).toBe("Missing documentation");
    });
  });

  describe("what-if overrides", () => {
    it("admissionDate override changes PED verdict", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "WHATIF-ADM",
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
          startDate: "2020-01-01",
          continuousCoverSince: "2020-01-01",
          sumInsured: 500000,
          roomRentLimit: 5000,
          pedWaitingMonths: 48,
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
            id: "WI-PED",
            description: "PED charge",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED" },
          },
        ],
        policyClauses: [],
      };

      // Without override: cover from 2020-01-01 to 2025-10-01 = 69 months → R1+R2
      const res1 = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res1.findings[0]?.verdict).toBe("wrong");

      // Override admissionDate to 2024-06-01: cover from 2020-01-01 to 2024-06-01 = 53 months → R2 only (>48)
      const res2 = runRules({
        extracted: claim,
        overrides: { admissionDate: "2024-06-01" },
        asOfDate: "2025-11-01",
      });
      const f2 = res2.findings[0]!;
      expect(f2.verdict).toBe("wrong");
      expect(f2.ruleIds).toEqual(["R2"]);

      // Override admissionDate to very recent: cover from 2020-01-01 to 2021-06-01 = 17 months → questionable
      const res3 = runRules({
        extracted: claim,
        overrides: { admissionDate: "2021-06-01" },
        asOfDate: "2025-11-01",
      });
      expect(res3.findings[0]?.verdict).toBe("questionable");
    });

    it("policyStartDate override changes PED verdict", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "WHATIF-PST",
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
          startDate: "2020-01-01",
          continuousCoverSince: null,
          sumInsured: 500000,
          roomRentLimit: 5000,
          pedWaitingMonths: 48,
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
            id: "WI-PED2",
            description: "PED charge",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED" },
          },
        ],
        policyClauses: [],
      };

      // Without override: cover from startDate 2020-01-01 to 2025-10-01 = 69 months → R1+R2
      const res1 = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res1.findings[0]?.verdict).toBe("wrong");

      // Override policyStartDate to 2025-01-01: 9 months → not enough for R1 or R2
      const res2 = runRules({
        extracted: claim,
        overrides: { policyStartDate: "2025-01-01" },
        asOfDate: "2025-11-01",
      });
      expect(res2.findings[0]?.verdict).toBe("questionable");
    });

    it("category override changes both verdict and wording", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "WHATIF-CAT",
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
        lineItems: [
          {
            id: "CAT-1",
            description: "Surgical supplies",
            category: "procedure",
            billed: 8000,
            approved: 5000,
            deducted: 3000,
            deductionType: "proportionate",
            deductionReason: "Room rent ratio",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "Supplies" },
          },
        ],
        policyClauses: [],
      };

      // Without override: category is "procedure", proportionate → UNDECIDED/questionable
      const res1 = runRules({ extracted: claim, asOfDate: "2025-11-01" });
      expect(res1.findings[0]?.verdict).toBe("questionable");

      // Override category to "consumable" → R3/wrong
      const res2 = runRules({
        extracted: claim,
        overrides: { lineItemCategories: [{ lineItemId: "CAT-1", category: "consumable" }] },
        asOfDate: "2025-11-01",
      });
      expect(res2.findings[0]?.verdict).toBe("wrong");
      expect(res2.findings[0]?.ruleIds).toEqual(["R3"]);
      // Wording should reflect R3 (proportionate) not the original undecided
      expect(res2.findings[0]?.explanationEn).toContain("R3");
      expect(res2.findings[0]?.explanationEn).toContain("wrong");
    });
  });

  describe("60-month boundary and PED timing", () => {
    it("exactly 60 months of cover fires R1", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "SIXTY-EXACT",
          insurer: "Test Insurer",
          policyNumber: "TEST-POL-001",
          patient: { name: "Patient A", age: 40, city: "Delhi" },
          admissionDate: "2025-01-01",
          dischargeDate: "2025-01-05",
          diagnosis: "Test diagnosis",
          amountClaimed: 100000,
          amountApproved: 50000,
        },
        policy: {
          planType: "Individual",
          startDate: "2020-01-01",
          continuousCoverSince: "2020-01-01",
          sumInsured: 500000,
          roomRentLimit: 5000,
          pedWaitingMonths: 99,
          copayPercent: null,
          subLimits: [],
        },
        rejection: {
          type: "partial",
          letterDate: "2025-01-10",
          reasons: [],
        },
        lineItems: [
          {
            id: "SIXTY-PED",
            description: "PED charge",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED" },
          },
        ],
        policyClauses: [],
      };

      // Exactly 60 months: 2020-01-01 to 2025-01-01
      const res = runRules({ extracted: claim, asOfDate: "2025-02-01" });
      expect(res.findings[0]?.verdict).toBe("wrong");
      expect(res.findings[0]?.ruleIds).toEqual(["R1"]);
    });

    it("one day short of 60 months does not fire R1", () => {
      const claim: ExtractedClaim = {
        claim: {
          claimId: "FIFTY-NINE",
          insurer: "Test Insurer",
          policyNumber: "TEST-POL-001",
          patient: { name: "Patient A", age: 40, city: "Delhi" },
          // Admission on Dec 31, cover since Jan 1: that is 59 months + 30 days → differenceInMonths rounds to 59
          admissionDate: "2024-12-31",
          dischargeDate: "2025-01-05",
          diagnosis: "Test diagnosis",
          amountClaimed: 100000,
          amountApproved: 50000,
        },
        policy: {
          planType: "Individual",
          startDate: "2020-01-01",
          continuousCoverSince: "2020-01-01",
          sumInsured: 500000,
          roomRentLimit: 5000,
          pedWaitingMonths: 99,
          copayPercent: null,
          subLimits: [],
        },
        rejection: {
          type: "partial",
          letterDate: "2025-01-10",
          reasons: [],
        },
        lineItems: [
          {
            id: "SHORT-PED",
            description: "PED charge",
            category: "other",
            billed: 10000,
            approved: 0,
            deducted: 10000,
            deductionType: "pre_existing_disease",
            deductionReason: "PED",
            partOfPackage: null,
            source: { document: "bill", page: 1, quote: "PED" },
          },
        ],
        policyClauses: [],
      };

      // 2020-01-01 to 2024-12-31: 12*4 + 11 = 59 months, ed(31) >= sd(1) so no -1. Still 59 < 60.
      const res = runRules({ extracted: claim, asOfDate: "2025-02-01" });
      expect(res.findings[0]?.verdict).toBe("questionable");
      expect(res.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
    });
  });

  describe("regulations stay unverified", () => {
    it("all regulations in sample case findings are verified: false", () => {
      const res = runRules({ extracted: sampleExtractedClaim, asOfDate: "2026-11-05" });
      for (const finding of res.findings) {
        expect(finding.evidence.regulation?.verified).toBe(false);
      }
    });

    it("all deadlines are verified: false", () => {
      const res = runRules({ extracted: sampleExtractedClaim, asOfDate: "2026-11-05" });
      for (const deadline of res.deadlines) {
        expect(deadline.verified).toBe(false);
      }
    });
  });

  describe("review follow-up", () => {
    const baseClaim: ExtractedClaim = {
      claim: {
        claimId: "REVIEW-001",
        insurer: "Test Insurer",
        policyNumber: "TEST-POL-001",
        patient: { name: "Asha Rao", age: 45, city: "Mumbai" },
        admissionDate: "2025-10-01",
        dischargeDate: "2025-10-06",
        diagnosis: "Knee replacement",
        amountClaimed: null,
        amountApproved: null,
      },
      policy: {
        planType: "Individual",
        startDate: "2015-01-01",
        continuousCoverSince: "2015-01-01",
        sumInsured: 500000,
        roomRentLimit: 5000,
        pedWaitingMonths: 24,
        copayPercent: null,
        subLimits: [],
      },
      rejection: { type: "partial", letterDate: "2025-10-10", reasons: [] },
      lineItems: [],
      policyClauses: [],
    };

    type Item = ExtractedClaim["lineItems"][number];
    type Reason = ExtractedClaim["rejection"]["reasons"][number];

    const item = (changes: Partial<Item>): Item => ({
      id: "A",
      description: "Item",
      category: "other",
      billed: 10000,
      approved: 0,
      deducted: 10000,
      deductionType: "other",
      deductionReason: "Reason",
      partOfPackage: null,
      source: { document: "bill", page: 1, quote: "Bill text" },
      ...changes,
    });
    const reason = (text: string, category: Reason["category"], clauseCited: string | null = null): Reason => ({
      text,
      category,
      clauseCited,
      source: { document: "rejection_letter", page: 1, quote: text },
    });
    const run = (lineItems: Item[], reasons: Reason[] = [], overrides?: FactOverrides) =>
      runRules({
        extracted: { ...baseClaim, lineItems, rejection: { ...baseClaim.rejection, reasons } },
        overrides,
        asOfDate: "2026-01-01",
      });
    const expectNoStent = (text: string | undefined) => {
      expect(text).not.toMatch(/stent/i);
      expect(text).not.toContain("स्टेंट");
    };

    describe("implants are not assumed to be stents", () => {
      it("uses the description of a knee implant, in English and Hindi", () => {
        const knee = item({ description: "Knee implant kit", category: "implant", deductionType: "proportionate" });

        const finding = run([knee]).findings[0];

        expect(finding?.ruleIds).toEqual(["R3"]);
        expect(finding?.explanationEn).toContain("from the bill for Knee implant kit");
        expect(finding?.explanationHi).toContain("Knee implant kit के बिल से");
        expectNoStent(finding?.explanationEn);
        expectNoStent(finding?.explanationHi);
      });

      it("uses the description when a knee implant is grouped with pharmacy", () => {
        const finding = run([
          item({ id: "A", description: "Medicines", category: "pharmacy", deductionType: "proportionate" }),
          item({ id: "B", description: "Knee implant kit", category: "implant", deductionType: "proportionate" }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("from the bill for Knee implant kit");
        expect(finding?.explanationEn).toContain("Medicines and implants cost the same");
        expect(finding?.explanationHi).toContain("Knee implant kit के बिल से");
        expect(finding?.explanationHi).toContain("दवाइयों और इम्प्लांट की कीमत");
        expectNoStent(finding?.explanationEn);
        expectNoStent(finding?.explanationHi);
      });

      it.each([null, "   "])("uses neutral wording when the description is %j", (description) => {
        const finding = run([item({ description, category: "implant", deductionType: "proportionate" })]).findings[0];

        expect(finding?.explanationEn).toContain("from the implant bill");
        expect(finding?.explanationHi).toContain("इम्प्लांट के बिल से");
        expectNoStent(finding?.explanationEn);
        expectNoStent(finding?.explanationHi);
      });

      it("still says stent when that is what the bill says", () => {
        const finding = runRules({ extracted: sampleExtractedClaim, asOfDate: "2026-11-05" }).findings.find((f) =>
          f.lineItemIds.includes("L3"),
        );

        expect(finding?.explanationEn).toContain("from the bill for Coronary stent, one unit");
      });
    });

    describe("grouped items", () => {
      it("R4 wrong names every item, not just the first", () => {
        const finding = run([
          item({ id: "A", description: "Gloves", category: "consumable", deductionType: "non_payable", partOfPackage: true }),
          item({ id: "B", description: "Syringes", category: "consumable", deductionType: "non_payable", partOfPackage: true }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("₹20,000 of Gloves and Syringes");
        expect(finding?.explanationHi).toContain("Gloves और Syringes");
      });

      it("R4 wrong uses neutral wording if any item has no description", () => {
        const finding = run([
          item({ id: "A", description: "Gloves", category: "consumable", deductionType: "non_payable", partOfPackage: true }),
          item({ id: "B", description: null, category: "consumable", deductionType: "non_payable", partOfPackage: true }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("₹20,000 of these charges");
      });

      it("PED names every condition, not just the first", () => {
        const finding = run([
          item({ id: "A", description: "Diabetes treatment", deductionType: "pre_existing_disease" }),
          item({ id: "B", description: "Thyroid medicines", deductionType: "pre_existing_disease" }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("treated Diabetes treatment and Thyroid medicines as");
        expect(finding?.explanationHi).toContain("Diabetes treatment और Thyroid medicines को");
      });

      it("grouped room items do not state one item's daily figures", () => {
        const finding = run([
          item({ id: "A", billed: 50000, approved: 25000, deducted: 25000, category: "room", deductionType: "room_rent_excess" }),
          item({ id: "B", billed: 30000, approved: 25000, deducted: 5000, category: "room", deductionType: "room_rent_excess" }),
        ]).findings[0];

        expect(finding?.verdict).toBe("valid");
        expect(finding?.explanationEn).not.toContain("a day");
        expect(finding?.explanationHi).not.toContain("प्रतिदिन");
      });
    });

    describe("room rent figures", () => {
      it("does not state an excess that differs from the deduction", () => {
        const finding = run([
          item({ billed: 50000, approved: 40000, deducted: 10000, category: "room", deductionType: "room_rent_excess" }),
        ]).findings[0];

        expect(finding?.verdict).toBe("valid");
        expect(finding?.explanationEn).not.toContain("the excess is");
      });

      it("states the figures when they exactly explain the deduction", () => {
        const finding = run([
          item({ billed: 50000, approved: 25000, deducted: 25000, category: "room", deductionType: "room_rent_excess" }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("The room cost ₹10,000 a day");
        expect(finding?.explanationEn).toContain("Over 5 days the excess is ₹25,000");
      });
    });

    describe("package wording", () => {
      const gloves = item({ id: "A", description: "Gloves", category: "consumable", deductionType: "non_payable", partOfPackage: true });

      it("keeps the package name's original casing", () => {
        const finding = run([
          gloves,
          item({ id: "P", description: "PTCA Package", category: "procedure", approved: 10000, deducted: 0, deductionType: "none" }),
        ]).findings[0];

        expect(finding?.explanationEn).toContain("PTCA package");
        expect(finding?.explanationEn).toContain("the insurer approved that package");
        expect(finding?.explanationHi).toContain("PTCA पैकेज");
      });

      it("does not treat an approved procedure as a package", () => {
        const finding = run([
          gloves,
          item({ id: "P", description: "Appendix surgery", category: "procedure", approved: 10000, deducted: 0, deductionType: "none" }),
        ]).findings[0];

        expect(finding?.explanationEn).not.toContain("Appendix surgery");
        expect(finding?.explanationEn).not.toContain("the insurer approved");
        expect(finding?.explanationHi).not.toContain("Appendix surgery");
      });

      it("does not treat a deducted item as the approved package", () => {
        const finding = run([
          item({ id: "A", description: "Package gloves", category: "consumable", approved: 500, deductionType: "non_payable", partOfPackage: true }),
        ]).findings[0];

        expect(finding?.explanationEn).not.toContain("the insurer approved");
      });
    });

    describe("evidence and clause wording", () => {
      const diet = item({ description: "Diet meals", deductionType: "non_payable" });
      const consumablesReason = reason("Consumables of Rs. 500 are not payable.", "non_payable", "Clause 7");

      it("does not give a diet charge the reason about consumables", () => {
        const finding = run([diet], [consumablesReason]).findings[0];

        expect(finding?.evidence.insurerText).toBeNull();
        expect(finding?.explanationEn).not.toContain("Clause 7");
        expect(finding?.explanationHi).not.toContain("Clause 7");
      });

      it("does not match on a word every bill uses", () => {
        const finding = run(
          [item({ description: "Registration charges", deductionType: "non_payable" })],
          [reason("Consumable charges are not payable.", "non_payable", "Clause 7")],
        ).findings[0];

        expect(finding?.evidence.insurerText).toBeNull();
      });

      it("uses a non-payable reason that names the item", () => {
        const finding = run([diet], [consumablesReason, reason("Diet is excluded.", "non_payable", "Clause 8")]).findings[0];

        expect(finding?.evidence.insurerText).toBe("Diet is excluded.");
        expect(finding?.explanationEn).toContain("citing Clause 8");
      });

      it("does not spread a reason about one grouped item over the others", () => {
        const finding = run(
          [
            item({ id: "A", description: "Admin", category: "admin", deductionType: "non_payable" }),
            item({ id: "B", description: "Diet", deductionType: "non_payable" }),
          ],
          [reason("Admin charges are not payable.", "non_payable", "Clause 9")],
        ).findings[0];

        expect(finding?.evidence.insurerText).toBeNull();
        expect(finding?.explanationEn).not.toContain("Clause 9");
      });

      it("picks the matching reason when a category has several", () => {
        const finding = run(
          [item({ description: "Diabetes treatment", deductionType: "pre_existing_disease" })],
          [reason("Hypertension is pre-existing.", "pre_existing_disease"), reason("Diabetes is pre-existing.", "pre_existing_disease")],
        ).findings[0];

        expect(finding?.evidence.insurerText).toBe("Diabetes is pre-existing.");
      });

      it("uses a category's only reason even if it names no item", () => {
        const finding = run(
          [item({ description: "Diabetes treatment", deductionType: "pre_existing_disease" })],
          [reason("Excluded as a pre-existing disease.", "pre_existing_disease")],
        ).findings[0];

        expect(finding?.evidence.insurerText).toBe("Excluded as a pre-existing disease.");
      });

      it("says 'without citing' only when the matched reason cites no clause", () => {
        const admin = item({ description: "Admin", category: "admin", deductionType: "non_payable" });

        const noClause = run([admin], [reason("Admin charges are not payable.", "non_payable")]).findings[0];
        const noReason = run([admin]).findings[0];

        expect(noClause?.explanationEn).toContain("without citing a policy clause");
        expect(noClause?.explanationHi).toContain("पॉलिसी की कोई धारा बताए बिना");
        expect(noReason?.explanationEn).not.toContain("citing");
        expect(noReason?.explanationHi).not.toContain("धारा");
      });

      it("does not call the package unclear when the documents say it is outside", () => {
        const outside = run([item({ category: "admin", deductionType: "non_payable", partOfPackage: false })]).findings[0];
        const unknown = run([item({ category: "admin", deductionType: "non_payable", partOfPackage: null })]).findings[0];

        expect(outside?.explanationEn).not.toContain("belong to the package");
        expect(outside?.explanationHi).not.toContain("पैकेज");
        expect(unknown?.explanationEn).toContain("belong to the package");
      });
    });

    describe("insurerAskedForMissingDocument", () => {
      const document = item({ deductionType: "documentation" });

      it("records that the insurer did not ask", () => {
        const finding = run([document], [], { insurerAskedForMissingDocument: false }).findings[0];

        expect(finding?.explanationEn).toContain("the insurer did not ask you for the missing document");
        expect(finding?.explanationHi).toContain("दस्तावेज़ नहीं माँगा");
      });

      it("records that the insurer did ask", () => {
        const finding = run([document], [], { insurerAskedForMissingDocument: true }).findings[0];

        expect(finding?.explanationEn).toContain("the insurer asked you for the missing document");
        expect(finding?.explanationHi).toContain("दस्तावेज़ माँगा था");
      });

      it("says nothing when the person has not answered", () => {
        const finding = run([document]).findings[0];

        expect(finding?.explanationEn).not.toContain("You confirmed");
        expect(finding?.explanationHi).not.toContain("आपने पुष्टि");
      });

      it("changes no verdict or total, because no agreed rule covers it yet", () => {
        for (const answer of [true, false]) {
          const result = run([document], [], { insurerAskedForMissingDocument: answer });

          expect(result.findings[0]?.verdict).toBe("questionable");
          expect(result.findings[0]?.ruleIds).toEqual(["UNDECIDED"]);
          expect(result.totals).toEqual(run([document]).totals);
        }
      });

      it("does not appear on other kinds of deduction", () => {
        const finding = run([item({ deductionType: "copay" })], [], { insurerAskedForMissingDocument: false }).findings[0];

        expect(finding?.explanationEn).not.toContain("You confirmed");
      });
    });

    it("does not use English in Hindi when the patient's name is missing", () => {
      const finding = runRules({
        extracted: {
          ...baseClaim,
          claim: { ...baseClaim.claim, patient: { name: null, age: null, city: null } },
          lineItems: [item({ description: "Diabetes treatment", deductionType: "pre_existing_disease" })],
        },
        asOfDate: "2026-01-01",
      }).findings[0];

      expect(finding?.explanationEn).toContain("the insured");
      expect(finding?.explanationHi).not.toContain("the insured");
      expect(finding?.explanationHi).toContain("बीमित व्यक्ति");
    });

    it.each(["full", "partial", null] as const)("warns about no line items when the rejection type is %j", (type) => {
      const result = runRules({
        extracted: { ...baseClaim, rejection: { ...baseClaim.rejection, type } },
        asOfDate: "2026-01-01",
      });

      expect(result.warnings.map((warning) => warning.code)).toEqual(["no_line_items"]);
      expect(result.warnings[0]?.messageHi).toMatch(/[ऀ-ॿ]/);
    });

    it("keeps regulations unverified on every kind of finding", () => {
      const result = run([
        item({ id: "A", deductionType: "proportionate", category: "pharmacy" }),
        item({ id: "B", deductionType: "non_payable" }),
        item({ id: "C", deductionType: "pre_existing_disease" }),
        item({ id: "D", deductionType: "room_rent_excess", category: "room", billed: 50000, approved: 25000, deducted: 25000 }),
        item({ id: "E", deductionType: "documentation" }),
      ]);

      expect(result.findings.length).toBe(5);
      for (const finding of result.findings) {
        expect(finding.evidence.regulation).toEqual({
          text: "Pending verification by Member C",
          sourceName: "Pending verification by Member C",
          verified: false,
        });
      }
    });
  });
});
