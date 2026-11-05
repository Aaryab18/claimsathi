import { describe, expect, it } from "vitest";
import { sampleExtractedClaim, type ExtractedClaim, type FactOverrides, type LineItem } from "@claimsathi/contracts";
import { runRules } from "./index.js";

const item = (changes: Partial<LineItem>): LineItem => ({
  id: "A",
  description: "Some charge",
  category: "other",
  billed: 10000,
  approved: 0,
  deducted: 10000,
  deductionType: "other",
  deductionReason: null,
  partOfPackage: null,
  source: null,
  ...changes,
});

const claimWith = (lineItems: LineItem[], changes: Partial<ExtractedClaim> = {}): ExtractedClaim => ({
  ...sampleExtractedClaim,
  lineItems,
  rejection: { ...sampleExtractedClaim.rejection, reasons: [] },
  ...changes,
});

const run = (extracted: ExtractedClaim, overrides?: FactOverrides) =>
  runRules({ extracted, asOfDate: "2026-11-05", ...(overrides && { overrides }) });

describe("R5: rejected only for missing documents", () => {
  const document = item({ deductionType: "documentation" });

  it("stays questionable until the person answers, and asks them", () => {
    const finding = run(claimWith([document])).findings[0];

    expect(finding).toMatchObject({ verdict: "questionable", ruleIds: ["R5"] });
    expect(finding?.explanationEn).toContain("Did the insurer ever ask you");
    expect(finding?.explanationHi).toContain("क्या बीमा कंपनी ने आपसे");
  });

  it("is wrong once the person confirms the insurer never asked", () => {
    const result = run(claimWith([document]), { insurerAskedForMissingDocument: false });

    expect(result.findings[0]).toMatchObject({ verdict: "wrong", confidence: "moderate", ruleIds: ["R5"] });
    expect(result.totals.recoverableStrong).toBe(10000);
    expect(result.findings[0]?.explanationEn).toContain("never asked");
  });

  it("stays questionable when the insurer did ask", () => {
    const result = run(claimWith([document]), { insurerAskedForMissingDocument: true });

    expect(result.findings[0]?.verdict).toBe("questionable");
    expect(result.totals.recoverableStrong).toBe(0);
  });

  it("keeps its legal source marked as unverified", () => {
    const regulation = run(claimWith([document])).findings[0]?.evidence.regulation;

    expect(regulation?.sourceName).toContain("clause 17(c)");
    expect(regulation?.verified).toBe(false);
  });
});

describe("R6: co-pay and sub-limit arithmetic", () => {
  const base = claimWith([], {});
  const withCopay = (percent: number | null, lineItems: LineItem[]) =>
    claimWith(lineItems, { policy: { ...base.policy, copayPercent: percent } });
  const bill = item({ id: "B", billed: 100000, approved: 80000, deducted: 20000, deductionType: "other" });

  it("is valid when co-pay is on the admissible amount, not the gross bill", () => {
    // Admissible is 100,000 + 0 - 20,000 = 80,000, so 10% is 8,000.
    const copay = item({ id: "C", billed: 0, deducted: 8000, deductionType: "copay" });

    const finding = run(withCopay(10, [bill, copay])).findings.find((f) => f.lineItemIds.includes("C"));

    expect(finding).toMatchObject({ verdict: "valid", ruleIds: ["R6"] });
    expect(finding?.explanationEn).toContain("₹8,000");
  });

  it("states the excess when co-pay was taken on the gross bill, without overstating what's recoverable", () => {
    const copay = item({ id: "C", billed: 0, deducted: 10000, deductionType: "copay" });

    const result = run(withCopay(10, [bill, copay]));
    const finding = result.findings.find((f) => f.lineItemIds.includes("C"));

    expect(finding?.verdict).toBe("questionable");
    expect(finding?.explanationEn).toContain("₹2,000 too much");
    expect(finding?.explanationHi).toContain("₹2,000");
    expect(result.totals.recoverableStrong).toBe(0);
  });

  it("is questionable when the policy's co-pay is unknown", () => {
    const copay = item({ id: "C", billed: 0, deducted: 5000, deductionType: "copay" });

    const finding = run(withCopay(null, [bill, copay])).findings.find((f) => f.lineItemIds.includes("C"));

    expect(finding).toMatchObject({ verdict: "questionable", ruleIds: ["R6"] });
    expect(finding?.explanationEn).toContain("enough figures");
  });

  it("is questionable when a bill line's amount is unknown", () => {
    const copay = item({ id: "C", billed: 0, deducted: 5000, deductionType: "copay" });

    const result = run(withCopay(10, [item({ id: "B", billed: null, deducted: 0 }), copay]));

    expect(result.findings.find((f) => f.lineItemIds.includes("C"))?.verdict).toBe("questionable");
  });

  const withSubLimit = (lineItem: LineItem) =>
    claimWith([lineItem], {
      policy: { ...base.policy, subLimits: [{ name: "Cataract sub-limit", amount: 40000, source: null }] },
    });

  it("is valid when the cut matches the named sub-limit", () => {
    const cataract = item({ description: "Cataract surgery", billed: 60000, deducted: 20000, deductionType: "sub_limit" });

    expect(run(withSubLimit(cataract)).findings[0]).toMatchObject({ verdict: "valid", ruleIds: ["R6"] });
  });

  it("states the excess when the cut goes beyond the sub-limit", () => {
    const cataract = item({ description: "Cataract surgery", billed: 60000, deducted: 30000, deductionType: "sub_limit" });

    const finding = run(withSubLimit(cataract)).findings[0];

    expect(finding?.verdict).toBe("questionable");
    expect(finding?.explanationEn).toContain("₹10,000 too much");
  });

  it("is questionable when no sub-limit matches the item", () => {
    const knee = item({ description: "Knee replacement", deductionType: "sub_limit" });

    expect(run(withSubLimit(knee)).findings[0]?.verdict).toBe("questionable");
  });
});

describe("R7: the clause the insurer cites", () => {
  const roomLine = item({
    description: "Room rent",
    category: "room",
    billed: 41800,
    deducted: 16800,
    deductionType: "room_rent_excess",
  });
  const reasonCiting = (clauseCited: string): ExtractedClaim["rejection"]["reasons"][number] => ({
    text: "Room rent is above the limit.",
    category: "room_rent",
    clauseCited,
    source: null,
  });
  const claimCiting = (clauseCited: string) =>
    claimWith([roomLine], {
      rejection: { ...sampleExtractedClaim.rejection, reasons: [reasonCiting(clauseCited)] },
    });

  it("takes a valid deduction down to questionable when the clause isn't found", () => {
    const finding = run(claimCiting("Clause 9.9")).findings[0];

    expect(finding?.verdict).toBe("questionable");
    expect(finding?.ruleIds).toContain("R7");
    expect(finding?.explanationEn).toContain("Clause 9.9");
    expect(finding?.explanationHi).toContain("Clause 9.9");
  });

  it("never calls a deduction wrong for this alone", () => {
    const result = run(claimCiting("Clause 9.9"));

    expect(result.totals.recoverableStrong).toBe(0);
  });

  it("matches clause names written differently", () => {
    expect(run(claimCiting("clause 4.2")).findings[0]?.ruleIds).not.toContain("R7");
    expect(run(claimCiting("4.2")).findings[0]?.ruleIds).not.toContain("R7");
  });

  it("does not fire on the sample case", () => {
    for (const finding of run(sampleExtractedClaim).findings) {
      expect(finding.ruleIds).not.toContain("R7");
    }
  });
});

describe("R8: deadlines", () => {
  const dates = (extracted: ExtractedClaim, overrides?: FactOverrides) =>
    run(extracted, overrides).deadlines.map(({ date, verified }) => ({ date, verified }));

  it("gives one year from the letter as the safest date, and no made-up grievance date", () => {
    expect(dates(sampleExtractedClaim)).toEqual([
      { date: null, verified: false },
      { date: "2027-10-15", verified: true },
    ]);
  });

  it("works out both dates from the day the complaint was sent", () => {
    expect(dates(sampleExtractedClaim, { grievanceSentDate: "2026-11-05" })).toEqual([
      { date: "2026-12-05", verified: true },
      { date: "2027-12-05", verified: true },
    ]);
  });

  it("never rolls a date into the wrong month", () => {
    expect(dates(sampleExtractedClaim, { grievanceSentDate: "2027-01-31" })[0]?.date).toBe("2027-02-28");
  });

  it("gives no date when the letter's date is unknown", () => {
    const noDate = {
      ...sampleExtractedClaim,
      rejection: { ...sampleExtractedClaim.rejection, letterDate: null },
    };

    expect(dates(noDate)[1]).toEqual({ date: null, verified: false });
  });

  it("names the rule and explains in Hindi too", () => {
    for (const deadline of run(sampleExtractedClaim).deadlines) {
      expect(deadline.explanation).toContain("Rule 14");
      expect(deadline.explanationHi).toContain("नियम 14");
    }
  });
});
