import { z } from "zod";
import { RupeesSchema } from "./common.js";

export const VerdictSchema = z.enum(["wrong", "questionable", "valid"]);
export type Verdict = z.infer<typeof VerdictSchema>;

export const ConfidenceSchema = z.enum(["strong", "moderate", "weak"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const RegulationSchema = z.object({
  text: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.url().optional(),
  verified: z.boolean(),
});
export type Regulation = z.infer<typeof RegulationSchema>;

export const EvidenceSchema = z.object({
  insurerText: z.string().min(1).nullable(),
  policyClause: z.string().min(1).nullable(),
  regulation: RegulationSchema.nullable(),
  quoteVerified: z.boolean(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingSchema = z
  .object({
    id: z.string().min(1),
    // Empty only for a valid deduction with no rule fired.
    ruleIds: z.array(z.string().min(1)),
    lineItemIds: z.array(z.string().min(1)).min(1),
    verdict: VerdictSchema,
    confidence: ConfidenceSchema,
    amount: RupeesSchema,
    explanationEn: z.string().min(1),
    explanationHi: z.string().min(1),
    evidence: EvidenceSchema,
  })
  .refine((finding) => finding.verdict === "valid" || finding.ruleIds.length > 0, {
    message: "A wrong or questionable finding must name the rule that fired",
    path: ["ruleIds"],
  });
export type Finding = z.infer<typeof FindingSchema>;
