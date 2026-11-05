import type { ErrorRequestHandler } from "express";

export interface ValidationIssue {
  path: string;
  message: string;
}

// Only errors of this type choose their own message, so nothing else can reach the response.
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly publicMessage: string,
    readonly issues?: ValidationIssue[],
  ) {
    super(publicMessage);
  }
}

// Error messages can contain connection details or user data, so only the name and code are logged.
export function logSafely(context: string, error: unknown): void {
  const { name, code } = error as { name?: unknown; code?: unknown };
  const details = [name, code].filter((part) => typeof part === "string").join(" ");
  console.error(details ? `${context}: ${details}` : context);
}

function requestErrorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" && status >= 400 && status < 500 ? status : undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.publicMessage,
      ...(error.issues && { issues: error.issues }),
    });
    return;
  }

  // Errors from Express itself, such as unreadable JSON or a body that is too large.
  const status = requestErrorStatus(error);
  if (status === 413) {
    res.status(413).json({ error: "The request is too large." });
    return;
  }
  if (status !== undefined) {
    res.status(status).json({ error: "The request could not be read." });
    return;
  }

  logSafely("Request failed", error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
