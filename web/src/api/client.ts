import {
  API_ROUTES,
  type CreateCaseResponse,
  type CreateLetterResponse,
  type CreateSampleCaseResponse,
  type LetterType,
  type GetCaseResponse,
  type FactOverrides,
  type CaseResult,
  type CaseStatus,
  sampleCaseResult,
} from "@claimsathi/contracts";

interface MockCaseRecord {
  token: string;
  forcedStatus?: CaseStatus;
}

const mockCases = new Map<string, MockCaseRecord>();

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL ?? "";
  return url.replace(/\/+$/, "");
}

export interface CreateCaseFiles {
  rejectionLetter: File;
  policyDocument: File;
  hospitalBill: File;
}

/**
 * POST /cases (API_ROUTES.createCase)
 * The field names must match the document types the API expects.
 */
export async function createCase(files: CreateCaseFiles): Promise<CreateCaseResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_ROUTES.createCase.path}`;
  const form = new FormData();
  form.append("rejection_letter", files.rejectionLetter);
  form.append("policy", files.policyDocument);
  form.append("bill", files.hospitalBill);

  const response = await fetch(url, {
    method: API_ROUTES.createCase.method,
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    throw new Error(typeof body?.error === "string" ? body.error : `Failed to create case: ${response.status}`);
  }
  return response.json();
}

/**
 * POST /cases/sample (API_ROUTES.createSampleCase)
 */
export async function createSampleCase(): Promise<CreateSampleCaseResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_ROUTES.createSampleCase.path}`;
  const response = await fetch(url, {
    method: API_ROUTES.createSampleCase.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create sample case: ${response.status}`);
  }

  return response.json();
}

/**
 * GET /cases/:token (API_ROUTES.getCase)
 */
export async function getCase(token: string): Promise<GetCaseResponse> {
  const mockRecord = mockCases.get(token);
  if (mockRecord?.forcedStatus) {
    const isDone = mockRecord.forcedStatus.stage === "done";
    return {
      caseToken: token,
      status: mockRecord.forcedStatus,
      result: isDone ? sampleCaseResult : null,
    };
  }

  const baseUrl = getBaseUrl();
  const path = API_ROUTES.getCase.path.replace(":token", encodeURIComponent(token));
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: API_ROUTES.getCase.method,
  });

  if (!response.ok) {
    throw new Error(`Failed to get case: ${response.status}`);
  }

  return response.json();
}

/**
 * PATCH /cases/:token/facts (API_ROUTES.applyFacts)
 */
export async function applyFacts(token: string, overrides: FactOverrides): Promise<CaseResult> {
  const baseUrl = getBaseUrl();
  const path = API_ROUTES.applyFacts.path.replace(":token", encodeURIComponent(token));
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: API_ROUTES.applyFacts.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(overrides),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply corrections: ${response.status}`);
  }

  return response.json();
}

/**
 * POST /cases/:token/letters (API_ROUTES.createLetter)
 */
export async function createLetter(token: string, letterType: LetterType): Promise<CreateLetterResponse> {
  const path = API_ROUTES.createLetter.path.replace(":token", encodeURIComponent(token));
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: API_ROUTES.createLetter.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ letterType }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create letter: ${response.status}`);
  }
  return response.json();
}

/**
 * For backwards compatibility with existing dashboard components/tests.
 */
export async function getCaseResult(caseToken?: string): Promise<CaseResult> {
  if (!caseToken || caseToken === "sample" || caseToken === "sample-case") {
    return sampleCaseResult;
  }
  try {
    const data = await getCase(caseToken);
    if (data.result) {
      return data.result;
    }
  } catch {
    // fallback
  }
  return sampleCaseResult;
}

/**
 * Test helpers to reset or manipulate mock case state in tests
 */
export function resetCaseProgress(token: string): void {
  const record = mockCases.get(token);
  if (record) {
    delete record.forcedStatus;
  }
}

export function setMockCaseStatus(token: string, status: CaseStatus): void {
  const record = mockCases.get(token) || { token };
  record.forcedStatus = status;
  mockCases.set(token, record);
}

export function clearMockCases(): void {
  mockCases.clear();
}
