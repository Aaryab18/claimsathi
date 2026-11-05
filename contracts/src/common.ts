import { z } from "zod";

// Money is always whole rupees.
export const RupeesSchema = z.int().nonnegative();
export type Rupees = z.infer<typeof RupeesSchema>;

// A real calendar date written as YYYY-MM-DD.
export const IsoDateSchema = z.iso.date();
export type IsoDate = z.infer<typeof IsoDateSchema>;

export const DocumentTypeSchema = z.enum(["rejection_letter", "policy", "bill"]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// Where a fact was read from: the document, the page and the exact quote.
export const SourceSchema = z.object({
  document: DocumentTypeSchema,
  page: z.int().positive(),
  quote: z.string().min(1),
  // Set only by our own check of the file's text, never by the AI.
  verified: z.boolean().optional(),
});
export type Source = z.infer<typeof SourceSchema>;
