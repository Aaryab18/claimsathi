import type { CaseResult, CaseStage, DocumentType, ExtractedClaim, FactOverrides } from "@claimsathi/contracts";

export interface StoredDocument {
  documentType: DocumentType;
  fileName: string;
  fileType: string;
  contents: Buffer;
}

export interface NewCase {
  token: string;
  stage: CaseStage;
  progressMessage: string;
  extracted: ExtractedClaim | null;
  result: CaseResult | null;
  deleteAfter: Date;
  documents: StoredDocument[];
}

// JSON columns come back as unknown, so routes must check them against the contract before use.
export interface CaseRecord {
  token: string;
  stage: CaseStage;
  progressMessage: string;
  errorMessage: string | null;
  extracted: unknown;
  overrides: unknown;
  result: unknown;
  deleteAfter: Date;
}

export interface CaseStore {
  createCase(newCase: NewCase): Promise<void>;
  // The only method that loads file contents.
  findDocuments(token: string): Promise<StoredDocument[]>;
  // Tokens of uploads that were not finished, for example after a restart.
  findUnfinished(): Promise<string[]>;
  setProgress(token: string, stage: CaseStage, progressMessage: string): Promise<void>;
  completeCase(token: string, progressMessage: string, extracted: ExtractedClaim, result: CaseResult): Promise<void>;
  failCase(token: string, progressMessage: string, errorMessage: string): Promise<void>;
  // Never loads file contents.
  findCase(token: string): Promise<CaseRecord | null>;
  // Returns false if the case no longer exists.
  saveFacts(token: string, overrides: FactOverrides, result: CaseResult): Promise<boolean>;
  deleteExpired(now: Date): Promise<number>;
}
