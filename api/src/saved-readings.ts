import { createHash } from "node:crypto";
import { sampleExtractedClaim, type ExtractedClaim } from "@claimsathi/contracts";
import type { StoredDocument } from "./case-store.js";

// Fingerprints of the made-up PDFs in web/public/samples. A test checks these against the files.
export const SAMPLE_DOCUMENT_HASHES: Record<StoredDocument["documentType"], string> = {
  rejection_letter: "eebb2e64197f7ae6a19dacb7db01fc4dabe5674d5dd8bc5294925dfebca012d0",
  policy: "82f64b48055a79bba6d8b9f0f668e1029c32c2c243ca5cfe3ac1ec6891246d8d",
  bill: "4a86e05ebcae3a36162eda0a35f61798592b6307eb78e3d694e8f84dc377786d",
};

// Lets the demo keep working when the free AI is overloaded. It only ever matches our own made-up
// files, so a real document can't get someone else's result, and the result is labelled as a sample.
export function savedReadingFor(documents: StoredDocument[]): ExtractedClaim | null {
  const allMatch =
    documents.length === Object.keys(SAMPLE_DOCUMENT_HASHES).length &&
    documents.every(
      ({ documentType, contents }) =>
        createHash("sha256").update(contents).digest("hex") === SAMPLE_DOCUMENT_HASHES[documentType],
    );
  return allMatch ? sampleExtractedClaim : null;
}
