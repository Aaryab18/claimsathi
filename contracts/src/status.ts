import { z } from "zod";

export const CaseStageSchema = z.enum(["queued", "reading", "checking", "drafting", "done", "failed"]);
export type CaseStage = z.infer<typeof CaseStageSchema>;

export const CaseStatusSchema = z.object({
  stage: CaseStageSchema,
  progressMessage: z.string().min(1),
  errorMessage: z.string().min(1).optional(),
});
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
