import { CaseResultSchema, type ExtractedClaim, type ResultSource } from "@claimsathi/contracts";
import type { CaseStore, StoredDocument } from "./case-store.js";
import { ReadError, type DocumentReader } from "./document-reader.js";
import { logSafely } from "./errors.js";
import { assessClaim } from "./rules.js";
import { savedReadingFor } from "./saved-readings.js";
import { markVerifiedQuotes } from "./verify-quotes.js";

const MESSAGES = {
  reading: "Reading your documents.",
  checking: "Checking each deduction against the rules.",
  done: "Your result is ready.",
  stopped: "Stopped.",
  busy: "The AI document reader is busy right now. Please try again in a few minutes, or try the sample case.",
  unreadable:
    "We could not read a claim from these files. Check that they are a rejection letter, a policy and a hospital bill, and that they are clear.",
} as const;

export interface CaseProcessor {
  // Returns straight away. Cases run one at a time, in order, so the AI's rate limit isn't hit all at once.
  enqueue(token: string): void;
  resumeUnfinished(): Promise<void>;
  // Resolves when everything queued so far has finished.
  idle(): Promise<void>;
}

export interface CaseProcessorOptions {
  store: CaseStore;
  reader: DocumentReader;
  today?: () => string;
}

function hasClaim({ lineItems, rejection }: ExtractedClaim): boolean {
  return lineItems.length > 0 || rejection.reasons.length > 0;
}

export function createCaseProcessor({
  store,
  reader,
  today = () => new Date().toISOString().slice(0, 10),
}: CaseProcessorOptions): CaseProcessor {
  let queue: Promise<void> = Promise.resolve();

  async function readClaim(
    documents: StoredDocument[],
  ): Promise<{ extracted: ExtractedClaim; resultSource: ResultSource }> {
    try {
      return { extracted: await reader.read(documents), resultSource: "live" };
    } catch (error) {
      const saved = error instanceof ReadError && error.failure === "busy" ? savedReadingFor(documents) : null;
      if (!saved) {
        throw error;
      }
      logSafely("The AI was busy, so a saved sample reading was used", error);
      return { extracted: saved, resultSource: "saved_sample" };
    }
  }

  async function process(token: string): Promise<void> {
    try {
      await store.setProgress(token, "reading", MESSAGES.reading);
      const documents = await store.findDocuments(token);
      const { extracted: read, resultSource } = await readClaim(documents);
      if (!hasClaim(read)) {
        throw new ReadError("unreadable", "no_claim_found");
      }

      await store.setProgress(token, "checking", MESSAGES.checking);
      const extracted = await markVerifiedQuotes(read, documents);
      const result = CaseResultSchema.parse(assessClaim({ caseToken: token, extracted, asOfDate: today(), resultSource }));
      await store.completeCase(token, MESSAGES.done, extracted, result);
    } catch (error) {
      logSafely("Reading a case failed", error);
      const message = error instanceof ReadError ? MESSAGES[error.failure] : MESSAGES.unreadable;
      await store.failCase(token, MESSAGES.stopped, message).catch((failure: unknown) => {
        logSafely("Saving a failed case failed", failure);
      });
    }
  }

  const enqueue = (token: string) => {
    queue = queue.then(() => process(token));
  };

  return {
    enqueue,
    async resumeUnfinished() {
      try {
        (await store.findUnfinished()).forEach(enqueue);
      } catch (error) {
        logSafely("Finding unfinished cases failed", error);
      }
    },
    idle: () => queue,
  };
}
