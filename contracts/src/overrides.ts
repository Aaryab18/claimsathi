import { z } from "zod";
import { IsoDateSchema } from "./common.js";
import { LineItemCategorySchema } from "./extracted.js";

export const LineItemCategoryOverrideSchema = z.strictObject({
  lineItemId: z.string().min(1),
  category: LineItemCategorySchema,
});
export type LineItemCategoryOverride = z.infer<typeof LineItemCategoryOverrideSchema>;

// Corrections from the "Confirm the facts" screen. Strict, so that a misspelled
// field is rejected instead of being silently ignored.
export const FactOverridesSchema = z.strictObject({
  policyStartDate: IsoDateSchema.optional(),
  continuousCoverSince: IsoDateSchema.optional(),
  admissionDate: IsoDateSchema.optional(),
  lineItemCategories: z.array(LineItemCategoryOverrideSchema).optional(),
  insurerAskedForMissingDocument: z.boolean().optional(),
  grievanceSentDate: IsoDateSchema.optional(),
});
export type FactOverrides = z.infer<typeof FactOverridesSchema>;
