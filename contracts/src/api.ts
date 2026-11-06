import { z } from "zod";
import { CaseResultSchema } from "./case-result.js";
import { DocumentTypeSchema } from "./common.js";
import { FactOverridesSchema } from "./overrides.js";
import { CaseStatusSchema } from "./status.js";

export const API_ROUTES = {
  createCase: { method: "POST", path: "/cases" },
  createSampleCase: { method: "POST", path: "/cases/sample" },
  getCase: { method: "GET", path: "/cases/:token" },
  applyFacts: { method: "PATCH", path: "/cases/:token/facts" },
  createLetter: { method: "POST", path: "/cases/:token/letters" },
} as const;

// Used by every route with :token in its path.
export const CaseTokenParamsSchema = z.object({
  token: z.string().min(1),
});
export type CaseTokenParams = z.infer<typeof CaseTokenParamsSchema>;

// POST /cases
// The files themselves arrive as a multipart upload. This describes each one.
export const UploadedDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.int().positive(),
});
export type UploadedDocument = z.infer<typeof UploadedDocumentSchema>;

export const CreateCaseRequestSchema = z.object({
  documents: z.array(UploadedDocumentSchema).min(1),
});
export type CreateCaseRequest = z.infer<typeof CreateCaseRequestSchema>;

export const CreateCaseResponseSchema = z.object({
  caseToken: z.string().min(1),
  status: CaseStatusSchema,
});
export type CreateCaseResponse = z.infer<typeof CreateCaseResponseSchema>;

// POST /cases/sample
export const CreateSampleCaseRequestSchema = z.strictObject({});
export type CreateSampleCaseRequest = z.infer<typeof CreateSampleCaseRequestSchema>;

export const CreateSampleCaseResponseSchema = CreateCaseResponseSchema;
export type CreateSampleCaseResponse = z.infer<typeof CreateSampleCaseResponseSchema>;

// GET /cases/:token
export const GetCaseResponseSchema = z
  .object({
    caseToken: z.string().min(1),
    status: CaseStatusSchema,
    result: CaseResultSchema.nullable(),
  })
  .refine(({ status, result }) => (status.stage === "done") === (result !== null), {
    message: "A result must be present when the case is done, and only then",
    path: ["result"],
  });
export type GetCaseResponse = z.infer<typeof GetCaseResponseSchema>;

// PATCH /cases/:token/facts
// Re-runs the rules on the saved facts, with no AI call.
export const ApplyFactsRequestSchema = FactOverridesSchema;
export type ApplyFactsRequest = z.infer<typeof ApplyFactsRequestSchema>;

export const ApplyFactsResponseSchema = CaseResultSchema;
export type ApplyFactsResponse = z.infer<typeof ApplyFactsResponseSchema>;

// POST /cases/:token/letters
// call_script is what to say on the phone to the insurer, built from the same findings as the letters.
export const LetterTypeSchema = z.enum(["grievance", "ombudsman", "call_script"]);
export type LetterType = z.infer<typeof LetterTypeSchema>;

export const LetterLanguageSchema = z.enum(["en", "hi", "kn"]);
export type LetterLanguage = z.infer<typeof LetterLanguageSchema>;

export const CreateLetterRequestSchema = z.object({
  letterType: LetterTypeSchema,
  language: LetterLanguageSchema.default("en"),
  // The number the insurer gave when the person complained, so the Ombudsman complaint can quote it.
  grievanceReference: z.string().trim().min(1).max(60).optional(),
  // The insurer's grievance email, from the contacts the person chose, so the letter is ready to send.
  insurerEmail: z.string().trim().max(100).email().optional(),
});
export type CreateLetterRequest = z.infer<typeof CreateLetterRequestSchema>;

export const CreateLetterResponseSchema = z.object({
  letterType: LetterTypeSchema,
  text: z.string().min(1),
});
export type CreateLetterResponse = z.infer<typeof CreateLetterResponseSchema>;
