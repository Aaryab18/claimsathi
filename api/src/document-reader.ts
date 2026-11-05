import {
  DeductionTypeSchema,
  DocumentTypeSchema,
  ExtractedClaimSchema,
  IsoDateSchema,
  LineItemCategorySchema,
  RejectionCategorySchema,
  RejectionTypeSchema,
  type ExtractedClaim,
} from "@claimsathi/contracts";
import type { StoredDocument } from "./case-store.js";

export interface DocumentReader {
  read(documents: StoredDocument[]): Promise<ExtractedClaim>;
}

export type ReadFailure = "busy" | "unreadable";

// The code is safe to log. It never holds document text or the AI key.
export class ReadError extends Error {
  override readonly name = "ReadError";
  readonly code: string;

  constructor(
    readonly failure: ReadFailure,
    code: string,
  ) {
    super(code);
    this.code = code;
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Handles 1,20,000 and ₹5000.50. Money in the contract is whole rupees, and never negative.
function wholeNumber(value: unknown): number | null {
  if (value === "" || value === null) {
    return null;
  }
  const parsed = typeof value === "string" ? Number(value.replace(/[₹,\s]|Rs\.?/gi, "")) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed);
}

function isoDate(value: unknown): string | null {
  return IsoDateSchema.safeParse(value).success ? (value as string) : null;
}

function oneOf<T>(schema: { safeParse(value: unknown): { success: boolean; data?: T } }, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data as T) : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function source(value: unknown) {
  if (!isObject(value)) {
    return null;
  }
  const document = oneOf(DocumentTypeSchema, value.document);
  const page = wholeNumber(value.page);
  const quote = text(value.quote);
  return document && page && quote ? { document, page, quote } : null;
}

// The AI's answer is never trusted. A value it got wrong becomes "unknown", which the
// rules treat as a reason to ask, so one bad value doesn't lose the whole document.
export function cleanExtraction(raw: unknown): ExtractedClaim {
  const answer = isObject(raw) ? raw : {};
  const claim = isObject(answer.claim) ? answer.claim : {};
  const patient = isObject(claim.patient) ? claim.patient : {};
  const policy = isObject(answer.policy) ? answer.policy : {};
  const rejection = isObject(answer.rejection) ? answer.rejection : {};
  const copay = wholeNumber(policy.copayPercent);

  return ExtractedClaimSchema.parse({
    claim: {
      claimId: text(claim.claimId),
      insurer: text(claim.insurer),
      policyNumber: text(claim.policyNumber),
      patient: { name: text(patient.name), age: wholeNumber(patient.age), city: text(patient.city) },
      admissionDate: isoDate(claim.admissionDate),
      dischargeDate: isoDate(claim.dischargeDate),
      diagnosis: text(claim.diagnosis),
      amountClaimed: wholeNumber(claim.amountClaimed),
      amountApproved: wholeNumber(claim.amountApproved),
    },
    policy: {
      planType: text(policy.planType),
      startDate: isoDate(policy.startDate),
      continuousCoverSince: isoDate(policy.continuousCoverSince),
      sumInsured: wholeNumber(policy.sumInsured),
      roomRentLimit: wholeNumber(policy.roomRentLimit),
      pedWaitingMonths: wholeNumber(policy.pedWaitingMonths),
      copayPercent: copay !== null && copay <= 100 ? copay : null,
      subLimits: list(policy.subLimits)
        .filter(isObject)
        .flatMap((item) => {
          const name = text(item.name);
          return name ? [{ name, amount: wholeNumber(item.amount), source: source(item.source) }] : [];
        }),
    },
    rejection: {
      type: oneOf(RejectionTypeSchema, rejection.type),
      letterDate: isoDate(rejection.letterDate),
      reasons: list(rejection.reasons)
        .filter(isObject)
        .flatMap((reason) => {
          const reasonText = text(reason.text);
          return reasonText
            ? [
                {
                  text: reasonText,
                  category: oneOf(RejectionCategorySchema, reason.category),
                  clauseCited: text(reason.clauseCited),
                  source: source(reason.source),
                },
              ]
            : [];
        }),
    },
    // Ids are ours, so a repeated id from the AI can't merge two bill items.
    lineItems: list(answer.lineItems)
      .filter(isObject)
      .map((item, index) => ({
        id: `L${index + 1}`,
        description: text(item.description),
        category: oneOf(LineItemCategorySchema, item.category),
        billed: wholeNumber(item.billed),
        approved: wholeNumber(item.approved),
        deducted: wholeNumber(item.deducted),
        deductionType: oneOf(DeductionTypeSchema, item.deductionType),
        deductionReason: text(item.deductionReason),
        partOfPackage: typeof item.partOfPackage === "boolean" ? item.partOfPackage : null,
        source: source(item.source),
      })),
    policyClauses: list(answer.policyClauses)
      .filter(isObject)
      .flatMap((clause) => {
        const clauseId = text(clause.clauseId);
        const clauseText = text(clause.text);
        const clauseSource = source(clause.source);
        return clauseId && clauseText && clauseSource
          ? [{ clauseId, title: text(clause.title), text: clauseText, source: clauseSource }]
          : [];
      }),
  });
}
