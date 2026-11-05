import { z } from "zod";
import { IsoDateSchema, RupeesSchema, SourceSchema } from "./common.js";

// A fact missing from the documents must be null, never invented. Fact fields
// are nullable but not optional, so the reader has to state null on purpose.

export const PatientSchema = z.object({
  name: z.string().min(1).nullable(),
  age: z.int().nonnegative().nullable(),
  city: z.string().min(1).nullable(),
});
export type Patient = z.infer<typeof PatientSchema>;

export const ClaimDetailsSchema = z.object({
  claimId: z.string().min(1).nullable(),
  insurer: z.string().min(1).nullable(),
  policyNumber: z.string().min(1).nullable(),
  patient: PatientSchema,
  admissionDate: IsoDateSchema.nullable(),
  dischargeDate: IsoDateSchema.nullable(),
  diagnosis: z.string().min(1).nullable(),
  amountClaimed: RupeesSchema.nullable(),
  amountApproved: RupeesSchema.nullable(),
});
export type ClaimDetails = z.infer<typeof ClaimDetailsSchema>;

export const SubLimitSchema = z.object({
  name: z.string().min(1),
  amount: RupeesSchema.nullable(),
  source: SourceSchema.nullable(),
});
export type SubLimit = z.infer<typeof SubLimitSchema>;

export const PolicyDetailsSchema = z.object({
  planType: z.string().min(1).nullable(),
  startDate: IsoDateSchema.nullable(),
  continuousCoverSince: IsoDateSchema.nullable(),
  sumInsured: RupeesSchema.nullable(),
  // Rupees per day.
  roomRentLimit: RupeesSchema.nullable(),
  pedWaitingMonths: z.int().nonnegative().nullable(),
  copayPercent: z.number().min(0).max(100).nullable(),
  // Empty when the documents show no sub-limits.
  subLimits: z.array(SubLimitSchema),
});
export type PolicyDetails = z.infer<typeof PolicyDetailsSchema>;

export const RejectionTypeSchema = z.enum(["full", "partial"]);
export type RejectionType = z.infer<typeof RejectionTypeSchema>;

export const RejectionCategorySchema = z.enum([
  "documentation_missing",
  "pre_existing_disease",
  "non_payable",
  "proportionate",
  "room_rent",
  "sub_limit",
  "copay",
  "other",
]);
export type RejectionCategory = z.infer<typeof RejectionCategorySchema>;

export const RejectionReasonSchema = z.object({
  text: z.string().min(1),
  category: RejectionCategorySchema.nullable(),
  clauseCited: z.string().min(1).nullable(),
  source: SourceSchema.nullable(),
});
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;

export const RejectionSchema = z.object({
  type: RejectionTypeSchema.nullable(),
  letterDate: IsoDateSchema.nullable(),
  reasons: z.array(RejectionReasonSchema),
});
export type Rejection = z.infer<typeof RejectionSchema>;

export const LineItemCategorySchema = z.enum([
  "room",
  "pharmacy",
  "consumable",
  "implant",
  "diagnostic",
  "procedure",
  "admin",
  "other",
]);
export type LineItemCategory = z.infer<typeof LineItemCategorySchema>;

export const DeductionTypeSchema = z.enum([
  "none",
  "room_rent_excess",
  "proportionate",
  "non_payable",
  "pre_existing_disease",
  "documentation",
  "sub_limit",
  "copay",
  "other",
]);
export type DeductionType = z.infer<typeof DeductionTypeSchema>;

export const LineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).nullable(),
  category: LineItemCategorySchema.nullable(),
  billed: RupeesSchema.nullable(),
  approved: RupeesSchema.nullable(),
  deducted: RupeesSchema.nullable(),
  deductionType: DeductionTypeSchema.nullable(),
  deductionReason: z.string().min(1).nullable(),
  partOfPackage: z.boolean().nullable(),
  source: SourceSchema.nullable(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const PolicyClauseSchema = z.object({
  clauseId: z.string().min(1),
  title: z.string().min(1).nullable(),
  // The exact wording from the policy.
  text: z.string().min(1),
  source: SourceSchema,
});
export type PolicyClause = z.infer<typeof PolicyClauseSchema>;

export const ExtractedClaimSchema = z.object({
  claim: ClaimDetailsSchema,
  policy: PolicyDetailsSchema,
  rejection: RejectionSchema,
  lineItems: z.array(LineItemSchema),
  policyClauses: z.array(PolicyClauseSchema),
});
export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

// Tells the AI reader the exact shape to return, so it can never drift from the contract.
export function extractedClaimJsonSchema(): unknown {
  return z.toJSONSchema(ExtractedClaimSchema);
}
