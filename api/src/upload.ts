import { CreateCaseRequestSchema, DocumentTypeSchema } from "@claimsathi/contracts";
import type { Request, RequestHandler } from "express";
import multer from "multer";
import type { StoredDocument } from "./case-store.js";
import { HttpError } from "./errors.js";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Gemini takes at most 20 MB per request, and sending files as text makes them a third bigger.
export const MAX_TOTAL_BYTES = 14 * 1024 * 1024;

const DOCUMENT_TYPES = DocumentTypeSchema.options;
const WRONG_FILES_MESSAGE = "Upload exactly three files, one each of rejection_letter, policy and bill.";

const upload = multer({
  storage: multer.memoryStorage(),
  defParamCharset: "utf8",
  limits: { fileSize: MAX_FILE_BYTES, files: DOCUMENT_TYPES.length, parts: DOCUMENT_TYPES.length, fields: 0 },
}).fields(DOCUMENT_TYPES.map((name) => ({ name, maxCount: 1 })));

export const receiveUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
    } else if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, "Each file must be 10 MB or smaller."));
    } else {
      next(new HttpError(400, WRONG_FILES_MESSAGE));
    }
  });
};

// A browser's stated file type can be false, so the file's first bytes must agree with it.
function detectFileType(contents: Buffer): string | null {
  if (contents.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "application/pdf";
  }
  if (contents.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return "image/jpeg";
  }
  if (contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  return null;
}

function cleanFileName(originalName: string): string {
  const baseName = originalName.split(/[\\/]/).pop() ?? "";
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned.slice(0, 255) || "upload";
}

export function readUploadedDocuments(req: Request): StoredDocument[] {
  const files = (req.files ?? {}) as Partial<Record<string, Express.Multer.File[]>>;

  const missing = DOCUMENT_TYPES.filter((documentType) => !files[documentType]?.[0]);
  if (missing.length > 0) {
    throw new HttpError(400, `${WRONG_FILES_MESSAGE} Missing: ${missing.join(", ")}.`);
  }

  const documents = DOCUMENT_TYPES.map((documentType): StoredDocument => {
    const file = files[documentType]![0]!;
    if (file.size === 0) {
      throw new HttpError(400, `The ${documentType} file is empty.`);
    }
    const fileType = detectFileType(file.buffer);
    if (!fileType || fileType !== file.mimetype.toLowerCase()) {
      throw new HttpError(415, `The ${documentType} file must be a PDF, JPG or PNG.`);
    }
    return { documentType, fileName: cleanFileName(file.originalname), fileType, contents: file.buffer };
  });

  if (documents.reduce((total, { contents }) => total + contents.length, 0) > MAX_TOTAL_BYTES) {
    throw new HttpError(413, "The three files together must be 14 MB or smaller.");
  }

  const described = CreateCaseRequestSchema.safeParse({
    documents: documents.map(({ documentType, fileName, fileType, contents }) => ({
      documentType,
      fileName,
      mimeType: fileType,
      sizeBytes: contents.length,
    })),
  });
  if (!described.success) {
    throw new HttpError(400, WRONG_FILES_MESSAGE);
  }

  return documents;
}
