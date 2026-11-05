import { extractText, getDocumentProxy } from "unpdf";
import type { ExtractedClaim, Source } from "@claimsathi/contracts";
import type { StoredDocument } from "./case-store.js";
import { logSafely } from "./errors.js";

const normalise = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

async function readPages(document: StoredDocument): Promise<string[] | null> {
  if (document.fileType !== "application/pdf") {
    return null;
  }
  try {
    const pdf = await getDocumentProxy(new Uint8Array(document.contents));
    const { text } = await extractText(pdf, { mergePages: false });
    return text.map(normalise);
  } catch (error) {
    logSafely("Reading a PDF's text failed", error);
    return null;
  }
}

// Checks each quote the AI gave against the file's own text, without using any AI. A photo or a scanned
// PDF has no text to check against, so its quotes stay unverified rather than being called wrong.
export async function markVerifiedQuotes(
  extracted: ExtractedClaim,
  documents: StoredDocument[],
): Promise<ExtractedClaim> {
  const pages = new Map<string, string[] | null>();
  for (const document of documents) {
    pages.set(document.documentType, await readPages(document));
  }

  const check = <T extends Source | null>(source: T): T => {
    if (!source) return source;
    const page = pages.get(source.document)?.[source.page - 1];
    const quote = normalise(source.quote);
    return { ...source, verified: Boolean(page && quote && page.includes(quote)) };
  };

  return {
    ...extracted,
    policy: {
      ...extracted.policy,
      subLimits: extracted.policy.subLimits.map((limit) => ({ ...limit, source: check(limit.source) })),
    },
    rejection: {
      ...extracted.rejection,
      reasons: extracted.rejection.reasons.map((reason) => ({ ...reason, source: check(reason.source) })),
    },
    lineItems: extracted.lineItems.map((item) => ({ ...item, source: check(item.source) })),
    policyClauses: extracted.policyClauses.map((clause) => ({ ...clause, source: check(clause.source) })),
  };
}
