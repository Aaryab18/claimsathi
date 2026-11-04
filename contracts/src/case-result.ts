import { z } from "zod";
import { IsoDateSchema, RupeesSchema } from "./common.js";
import { ExtractedClaimSchema } from "./extracted.js";
import { FindingSchema, type Verdict } from "./finding.js";

export const DeadlineSchema = z
  .object({
    label: z.string().min(1),
    // Null until the legal deadline has been checked. A date is never guessed.
    date: IsoDateSchema.nullable(),
    explanation: z.string().min(1),
    verified: z.boolean(),
  })
  .refine((deadline) => !deadline.verified || deadline.date !== null, {
    message: "A verified deadline must have a date",
    path: ["date"],
  });
export type Deadline = z.infer<typeof DeadlineSchema>;

export const TotalsSchema = z.object({
  totalDeducted: RupeesSchema,
  // The sum of findings with the verdict "wrong".
  recoverableStrong: RupeesSchema,
  // The sum of findings with the verdict "questionable".
  questionable: RupeesSchema,
  // The sum of findings with the verdict "valid".
  validDeductions: RupeesSchema,
});
export type Totals = z.infer<typeof TotalsSchema>;

export const ResultSourceSchema = z.enum(["live", "saved_sample"]);
export type ResultSource = z.infer<typeof ResultSourceSchema>;

export const CaseResultSchema = z
  .object({
    caseToken: z.string().min(1),
    extracted: ExtractedClaimSchema,
    findings: z.array(FindingSchema),
    deadlines: z.array(DeadlineSchema),
    totals: TotalsSchema,
    resultSource: ResultSourceSchema,
  })
  .superRefine(({ extracted, findings, totals }, ctx) => {
    const lineItems = new Map(extracted.lineItems.map((item) => [item.id, item]));
    const timesCovered = new Map<string, number>();

    findings.forEach((finding, index) => {
      let deducted = 0;
      for (const id of finding.lineItemIds) {
        const item = lineItems.get(id);
        if (!item) {
          ctx.addIssue({
            code: "custom",
            message: `Finding ${finding.id} names unknown line item ${id}`,
            path: ["findings", index, "lineItemIds"],
          });
          continue;
        }
        deducted += item.deducted ?? 0;
        timesCovered.set(id, (timesCovered.get(id) ?? 0) + 1);
      }
      if (finding.amount !== deducted) {
        ctx.addIssue({
          code: "custom",
          message: `Finding ${finding.id} amount ${finding.amount} does not match its line items' deductions of ${deducted}`,
          path: ["findings", index, "amount"],
        });
      }
    });

    // Each deducted rupee must belong to exactly one Finding.
    extracted.lineItems.forEach((item, index) => {
      const covered = timesCovered.get(item.id) ?? 0;
      if ((item.deducted ?? 0) > 0 && covered !== 1) {
        ctx.addIssue({
          code: "custom",
          message: `Deducted line item ${item.id} must belong to exactly one finding, but belongs to ${covered}`,
          path: ["extracted", "lineItems", index],
        });
      }
    });

    const sumFor = (verdict: Verdict) =>
      findings.filter((finding) => finding.verdict === verdict).reduce((sum, finding) => sum + finding.amount, 0);
    const expected = {
      totalDeducted: findings.reduce((sum, finding) => sum + finding.amount, 0),
      recoverableStrong: sumFor("wrong"),
      questionable: sumFor("questionable"),
      validDeductions: sumFor("valid"),
    };
    for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
      if (totals[key] !== expected[key]) {
        ctx.addIssue({
          code: "custom",
          message: `Total ${key} is ${totals[key]} but the findings add up to ${expected[key]}`,
          path: ["totals", key],
        });
      }
    }
  });
export type CaseResult = z.infer<typeof CaseResultSchema>;
