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

describe("the letters' voice", () => {
  const letter = buildLetter(result, "grievance", "2026-11-05");

  it("talks to the insurer, and never uses our internal rule names", () => {
    expect(letter).not.toMatch(/\brule R\d|\brules R\d|The insurer|Confirm the facts/);
    expect(letter).toContain("You cut");
    expect(letter).toContain("I believe");
  });

  it("reads as one person writing", () => {
    expect(letter).toContain("You reduced this in proportion");
    expect(letter).not.toMatch(/It reduced/);
  });

  it("marks R3's reference for checking, and leaves our status note out", () => {
    expect(letter).toContain("151/06/2020, 11.06.2020, paragraphs 4 and 5 [check this reference before sending]");
    expect(letter).not.toContain("confirming it still applies");
  });

  it("writes money the same way throughout", () => {
    expect(letter).not.toContain("₹");
  });
});

describe("letters in Hindi and Kannada", () => {
  for (const language of ["hi", "kn"] as const) {
    for (const letterType of ["grievance", "ombudsman"] as const) {
      const letter = buildLetter(result, letterType, "2026-11-05", language);

      it(`writes the ${letterType} letter in ${language} with the case's own facts`, () => {
        expect(letter).toMatch(language === "hi" ? /[ऀ-ॿ]/ : /[ಀ-೿]/);
        expect(letter).toContain(result.extracted.claim.claimId!);
        expect(letter).toContain(`Rs. ${result.totals.recoverableStrong.toLocaleString("en-IN")}`);
        expect(letter).not.toContain("₹");
        expect(letter).not.toContain("undefined");
      });

      it(`keeps the insurer's words and flags unchecked references in the ${language} ${letterType} letter`, () => {
        const quoted = result.findings.find(({ verdict, evidence }) => verdict !== "valid" && evidence.insurerText);
        if (quoted) expect(letter).toContain(quoted.evidence.insurerText!.replace(/\s+/g, " "));
        expect(letter).not.toMatch(/Pending verification/i);
      });
    }
  }

  it("asks rather than asserts when a package item is only questionable", () => {
    const unclear = result.findings.find(({ verdict, ruleIds }) => verdict === "questionable" && ruleIds.includes("R4"));
    expect(unclear).toBeDefined();
    const hindi = buildLetter({ ...result, findings: [unclear!] }, "grievance", "2026-11-05", "hi");
    expect(hindi).toContain("कृपया बताएं कि क्या यह मद पैकेज");
    expect(hindi).not.toContain("यह मद अनुमोदित पैकेज या प्रक्रिया का हिस्सा है");
  });

  it("keeps English as the default", () => {
    expect(buildLetter(result, "grievance", "2026-11-05")).toBe(buildLetter(result, "grievance", "2026-11-05", "en"));
  });
});

describe("the call script", () => {
  for (const language of ["en", "hi", "kn"] as const) {
    const script = buildLetter(result, "call_script", "2026-11-05", language);

    it(`gives the ${language} script the case's own numbers and every disputed item`, () => {
      expect(script).toContain(result.extracted.claim.policyNumber!);
      expect(script).toContain(result.extracted.claim.claimId!);
      for (const finding of result.findings.filter(({ verdict }) => verdict !== "valid")) {
        expect(script).toContain(`Rs. ${finding.amount.toLocaleString("en-IN")}`);
      }
      expect(script).toContain("OTP");
      expect(script).not.toContain("undefined");
    });
  }

  it("leaves out the valid deduction", () => {
    const valid = result.findings.find(({ verdict }) => verdict === "valid")!;
    expect(buildLetter(result, "call_script", "2026-11-05")).not.toContain(`Rs. ${valid.amount.toLocaleString("en-IN")}.`);
  });
});

describe("the complaint reference number", () => {
  it("goes into the Ombudsman complaint in each language when given", () => {
    expect(buildLetter(result, "ombudsman", "2026-11-05", "en", "GRV-12345")).toContain("The insurer's complaint reference number: GRV-12345");
    expect(buildLetter(result, "ombudsman", "2026-11-05", "hi", "GRV-12345")).toContain("GRV-12345");
    expect(buildLetter(result, "ombudsman", "2026-11-05", "kn", "GRV-12345")).toContain("GRV-12345");
  });

  it("is left out when not given", () => {
    expect(buildLetter(result, "ombudsman", "2026-11-05")).not.toContain("reference number:");
  });
});
