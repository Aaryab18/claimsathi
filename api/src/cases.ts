import { randomBytes } from "node:crypto";
import {
  API_ROUTES,
  ApplyFactsRequestSchema,
  ApplyFactsResponseSchema,
  CaseResultSchema,
  CaseTokenParamsSchema,
  CreateCaseResponseSchema,
  CreateSampleCaseRequestSchema,
  CreateSampleCaseResponseSchema,
  ExtractedClaimSchema,
  FactOverridesSchema,
  GetCaseResponseSchema,
  sampleCaseResult,
  sampleExtractedClaim,
  type CaseStatus,
  type FactOverrides,
} from "@claimsathi/contracts";
import express, { Router, type RequestHandler } from "express";
import type { CaseRecord, CaseStore } from "./case-store.js";
import { HttpError, type ValidationIssue } from "./errors.js";
import { recalculateResult } from "./rules.js";
import { readUploadedDocuments, receiveUpload } from "./upload.js";

const CASE_LIFETIME_MS = 24 * 60 * 60 * 1000;
// 32 random bytes, written as 43 URL-safe characters.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const SAMPLE_STATUS: CaseStatus = { stage: "done", progressMessage: "The sample case is ready." };
const QUEUED_STATUS: CaseStatus = { stage: "queued", progressMessage: "Waiting to read your documents." };

const readJson = express.json({ limit: "100kb" });

const preventCaching: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function toIssues(issues: { path: PropertyKey[]; message: string }[]): ValidationIssue[] {
  return issues.map(({ path, message }) => ({ path: path.map(String).join("."), message }));
}

function statusOf({ stage, progressMessage, errorMessage }: CaseRecord): CaseStatus {
  return { stage, progressMessage, ...(errorMessage && { errorMessage }) };
}

// Corrections add up: each request only sends what the person just changed.
function mergeOverrides(saved: FactOverrides, changed: FactOverrides): FactOverrides {
  const merged: FactOverrides = { ...saved, ...changed };
  if (saved.lineItemCategories && changed.lineItemCategories) {
    const byLineItem = new Map(
      [...saved.lineItemCategories, ...changed.lineItemCategories].map((item) => [item.lineItemId, item]),
    );
    merged.lineItemCategories = [...byLineItem.values()];
  }
  return merged;
}

export function createCasesRouter(store: CaseStore): Router {
  const router = Router();

  async function loadCase(params: unknown): Promise<CaseRecord> {
    const { token } = CaseTokenParamsSchema.parse(params);
    // A token we could never have issued is not looked up.
    const found = TOKEN_PATTERN.test(token) ? await store.findCase(token) : null;
    if (!found || found.deleteAfter <= new Date()) {
      throw new HttpError(404, "Case not found.");
    }
    return found;
  }

  router.use(API_ROUTES.createCase.path, preventCaching);

  router.post(API_ROUTES.createSampleCase.path, readJson, async (req, res) => {
    const parsed = CreateSampleCaseRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new HttpError(400, "This request does not take any fields.", toIssues(parsed.error.issues));
    }

    const token = createToken();
    await store.createCase({
      token,
      stage: SAMPLE_STATUS.stage,
      progressMessage: SAMPLE_STATUS.progressMessage,
      extracted: ExtractedClaimSchema.parse(sampleExtractedClaim),
      result: CaseResultSchema.parse({ ...sampleCaseResult, caseToken: token }),
      deleteAfter: new Date(Date.now() + CASE_LIFETIME_MS),
      documents: [],
    });

    res.status(201).json(CreateSampleCaseResponseSchema.parse({ caseToken: token, status: SAMPLE_STATUS }));
  });

  router.post(API_ROUTES.createCase.path, receiveUpload, async (req, res) => {
    const documents = readUploadedDocuments(req);

    const token = createToken();
    await store.createCase({
      token,
      stage: QUEUED_STATUS.stage,
      progressMessage: QUEUED_STATUS.progressMessage,
      extracted: null,
      result: null,
      deleteAfter: new Date(Date.now() + CASE_LIFETIME_MS),
      documents,
    });

    res.status(201).json(CreateCaseResponseSchema.parse({ caseToken: token, status: QUEUED_STATUS }));
  });

  router.get(API_ROUTES.getCase.path, async (req, res) => {
    const found = await loadCase(req.params);
    res.json(
      GetCaseResponseSchema.parse({
        caseToken: found.token,
        status: statusOf(found),
        result: found.stage === "done" ? found.result : null,
      }),
    );
  });

  router.patch(API_ROUTES.applyFacts.path, readJson, async (req, res) => {
    const changed = ApplyFactsRequestSchema.safeParse(req.body);
    if (!changed.success) {
      throw new HttpError(400, "The facts are not valid.", toIssues(changed.error.issues));
    }

    const found = await loadCase(req.params);
    if (found.stage !== "done") {
      throw new HttpError(409, "This case is not ready for corrections yet.");
    }

    const extracted = ExtractedClaimSchema.parse(found.extracted);
    const knownLineItems = new Set(extracted.lineItems.map((item) => item.id));
    const unknownItem = changed.data.lineItemCategories?.findIndex((item) => !knownLineItems.has(item.lineItemId)) ?? -1;
    if (unknownItem >= 0) {
      throw new HttpError(400, "The facts are not valid.", [
        { path: `lineItemCategories.${unknownItem}.lineItemId`, message: "This line item is not in the case." },
      ]);
    }

    const overrides = mergeOverrides(FactOverridesSchema.parse(found.overrides ?? {}), changed.data);
    const result = ApplyFactsResponseSchema.parse(
      recalculateResult({
        saved: CaseResultSchema.parse(found.result),
        extracted,
        overrides,
        asOfDate: new Date().toISOString().slice(0, 10),
      }),
    );

    if (!(await store.saveFacts(found.token, overrides, result))) {
      throw new HttpError(404, "Case not found.");
    }
    res.json(result);
  });

  return router;
}
