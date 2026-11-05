import { describe, expect, it } from "vitest";
import { sampleCaseResult, sampleExtractedClaim, type CaseResult } from "@claimsathi/contracts";
import { runRules } from "./index.js";
import { buildLetter } from "./letters.js";

const result: CaseResult = { ...sampleCaseResult, ...runRules({ extracted: sampleExtractedClaim, asOfDate: "2026-11-05" }) };

describe("the grievance letter", () => {
  const letter = buildLetter(result, "grievance", "2026-11-05");

  it("addresses the insurer's grievance officer with the claim's details", () => {
    expect(letter).toContain("Grievance Redressal Officer");
    expect(letter).toContain("Sample Health Insurance Ltd");
    expect(letter).toContain("SAMPLE-CLM-0001");
    expect(letter).toContain("5 November 2026");
  });

  it("asks for exactly what the rules found", () => {
    expect(letter).toContain("pay Rs. 71,400");
    expect(letter).toContain("the Rs. 7,800 marked above");
  });

  it("leaves out valid deductions", () => {
    expect(letter).not.toContain("Private room rent");
  });

  it("quotes the insurer's own words", () => {
    expect(letter).toContain("Your letter says:");
  });

  it("marks an unchecked legal reference, and drops our internal note", () => {
    expect(letter).not.toContain("has not been checked yet");
    expect(letter).not.toContain("Pending verification");
  });

  it("uses blanks for missing facts, never a guess", () => {
    const blank: CaseResult = {
      ...result,
      extracted: {
        ...result.extracted,
        claim: {
          ...result.extracted.claim,
          insurer: null,
          claimId: null,
          amountClaimed: null,
          patient: { name: null, age: null, city: null },
        },
      },
    };

    const text = buildLetter(blank, "grievance", "2026-11-05");

    expect(text).toContain("[Insurer name]");
    expect(text).toContain("[claim number]");
    expect(text).toContain("[Your name]");
  });

  it("asks for no payment when the rules found nothing wrong", () => {
    const none: CaseResult = { ...result, totals: { ...result.totals, recoverableStrong: 0 } };

    expect(buildLetter(none, "grievance", "2026-11-05")).not.toContain("and pay");
  });
});

describe("the Ombudsman complaint", () => {
  const complaint = buildLetter(result, "ombudsman", "2026-11-05");

  it("cites the rule and seeks the amount the rules found", () => {
    expect(complaint).toContain("Rule 14 of the Insurance Ombudsman Rules, 2017");
    expect(complaint).toContain("payment of Rs. 71,400");
  });

  it("includes the annexure checklist and requires the earlier complaint", () => {
    expect(complaint).toContain("Annexures to attach");
    expect(complaint).toContain("My written complaint to the insurer");
  });

  it("does not assert the declaration for them without a prompt to check it", () => {
    expect(complaint).toContain("Remove or correct this if it isn't true");
  });
});
