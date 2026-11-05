import {
  API_ROUTES,
  type CreateCaseResponse,
  type CreateSampleCaseResponse,
  type GetCaseResponse,
  type FactOverrides,
  type CaseResult,
  type CaseStatus,
  type CaseStage,
  sampleCaseResult,
} from "@claimsathi/contracts";

/**
 * In-memory state for mock cases while transitioning between stages.
 * When connected to the real API, all of these functions will call fetch()
 * using the endpoints defined in API_ROUTES from @claimsathi/contracts.
 */
interface MockCaseRecord {
  token: string;
  createdAt: number;
  forcedStatus?: CaseStatus;
  overrides?: FactOverrides;
}

const mockCases = new Map<string, MockCaseRecord>();

export interface CreateCaseFiles {
  rejectionLetter: File;
  policyDocument: File;
  hospitalBill: File;
}

/**
 * POST /cases (API_ROUTES.createCase)
 * In real API: sends multipart/form-data with documents to the backend.
 * In mock mode: registers a new case token and returns an initial queued status.
 */
export async function createCase(files: CreateCaseFiles): Promise<CreateCaseResponse> {
  const caseToken = "case-" + Math.random().toString(36).substring(2, 9);
  mockCases.set(caseToken, {
    token: caseToken,
    createdAt: Date.now(),
  });

  return {
    caseToken,
    status: {
      stage: "queued",
      progressMessage: "Case submitted and queued for review",
    },
  };
}

/**
 * POST /cases/sample (API_ROUTES.createSampleCase)
 * In real API: triggers processing of the bundled sample claim without uploading files.
 * In mock mode: registers a sample case token and moves through stages.
 */
export async function createSampleCase(): Promise<CreateSampleCaseResponse> {
  const caseToken = "sample-" + Math.random().toString(36).substring(2, 9);
  mockCases.set(caseToken, {
    token: caseToken,
    createdAt: Date.now(),
  });

  return {
    caseToken,
    status: {
      stage: "queued",
      progressMessage: "Sample case queued for review",
    },
  };
}

/**
 * GET /cases/:token (API_ROUTES.getCase)
 * In real API: fetches the current status and (when stage === "done") the CaseResult.
 * In mock mode: moves through queued -> reading -> checking -> drafting -> done over ~3 seconds.
 */
export async function getCase(token: string): Promise<GetCaseResponse> {
  const record = mockCases.get(token);

  // Forced status for testing specific stages
  if (record?.forcedStatus) {
    const isDone = record.forcedStatus.stage === "done";
    return {
      caseToken: token,
      status: record.forcedStatus,
      result: isDone ? await getCaseResult(token) : null,
    };
  }

  // Handle deliberate failure tokens for testing
  if (token.includes("fail")) {
    return {
      caseToken: token,
      status: {
        stage: "failed",
        progressMessage: "Stopped",
        errorMessage: "This file could not be read",
      },
      result: null,
    };
  }

  // If token is "sample" and was not created via createSampleCase (e.g. direct load or test),
  // return done immediately with sampleCaseResult so tests and direct links work instantly.
  if (!record && (token === "sample" || token === "sample-case")) {
    return {
      caseToken: token,
      status: {
        stage: "done",
        progressMessage: "Analysis complete",
      },
      result: await getCaseResult(token),
    };
  }

  const createdAt = record ? record.createdAt : Date.now();
  if (!record) {
    mockCases.set(token, { token, createdAt });
  }

  const elapsed = Date.now() - createdAt;
  let stage: CaseStage = "queued";
  let progressMessage = "Queued for analysis";

  if (elapsed >= 3200) {
    stage = "done";
    progressMessage = "Analysis complete";
  } else if (elapsed >= 2400) {
    stage = "drafting";
    progressMessage = "Drafting findings";
  } else if (elapsed >= 1600) {
    stage = "checking";
    progressMessage = "Checking rules";
  } else if (elapsed >= 800) {
    stage = "reading";
    progressMessage = "Reading documents";
  }

  return {
    caseToken: token,
    status: {
      stage,
      progressMessage,
    },
    result: stage === "done" ? await getCaseResult(token) : null,
  };
}

/**
 * PATCH /cases/:token/facts (API_ROUTES.applyFacts)
 * In real API: re-runs the rules engine with the user overrides, with no AI call.
 * In mock mode: records the overrides and returns the sample unchanged.
 * The UI must honestly show that corrections are preview-only.
 */
export async function applyFacts(token: string, overrides: FactOverrides): Promise<CaseResult> {
  const record = mockCases.get(token);
  if (record) {
    record.overrides = overrides;
  }
  // For now the mock returns the sample unchanged.
  // Never pretend a correction changed the result.
  return Promise.resolve(sampleCaseResult);
}

/**
 * For backwards compatibility with existing dashboard components/tests.
 */
export async function getCaseResult(_caseToken?: string): Promise<CaseResult> {
  return Promise.resolve(sampleCaseResult);
}

/**
 * Test helpers to reset or manipulate mock case state in tests
 */
export function resetCaseProgress(token: string): void {
  const record = mockCases.get(token);
  if (record) {
    record.createdAt = Date.now();
    delete record.forcedStatus;
  } else {
    mockCases.set(token, { token, createdAt: Date.now() });
  }
}

export function setMockCaseStatus(token: string, status: CaseStatus): void {
  const record = mockCases.get(token) || { token, createdAt: Date.now() };
  record.forcedStatus = status;
  mockCases.set(token, record);
}

export function clearMockCases(): void {
  mockCases.clear();
}
