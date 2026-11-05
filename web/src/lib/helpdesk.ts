import type { CaseResult } from "@claimsathi/contracts";

export type HelpdeskStatus = "new" | "complained" | "ombudsman" | "resolved";

// No patient names or documents: this stays in one browser, which may be a shared help desk computer.
export interface HelpdeskCase {
  id: string;
  reference: string;
  insurer: string | null;
  deducted: number;
  recoverable: number;
  lastDate: string | null;
  status: HelpdeskStatus;
  isDemo: boolean;
  addedAt: string;
}

const STORAGE_KEY = "claimsathi.helpdesk";
const CASE_LINK_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function loadCases(): HelpdeskCase[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? (stored as HelpdeskCase[]) : [];
  } catch {
    return [];
  }
}

export function saveCases(cases: HelpdeskCase[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // Private windows can refuse storage. The dashboard simply starts empty next time.
  }
}

// Samples aren't anyone's real case, so only documents that were really read are added.
export function recordCase(result: CaseResult): void {
  if (result.resultSource !== "live") return;
  const cases = loadCases();
  const existing = cases.find(({ id }) => id === result.caseToken);
  const ombudsman = result.deadlines.find(({ label }) => label === "Complaint to the ombudsman");
  const entry: HelpdeskCase = {
    id: result.caseToken,
    reference: existing?.reference ?? `Case ${cases.filter(({ isDemo }) => !isDemo).length + 1}`,
    insurer: result.extracted.claim.insurer,
    deducted: result.totals.totalDeducted,
    recoverable: result.totals.recoverableStrong,
    lastDate: ombudsman?.date ?? null,
    status: existing?.status ?? "new",
    isDemo: false,
    addedAt: existing?.addedAt ?? new Date().toISOString(),
  };
  saveCases(existing ? cases.map((item) => (item.id === entry.id ? entry : item)) : [...cases, entry]);
}

// The API deletes a case after 24 hours, after which its link can't open.
export function canOpenCase({ isDemo, addedAt }: HelpdeskCase, now = Date.now()): boolean {
  return !isDemo && now - new Date(addedAt).getTime() < CASE_LINK_LIFETIME_MS;
}

const demo = (
  reference: string,
  insurer: string,
  deducted: number,
  recoverable: number,
  lastDate: string,
  status: HelpdeskStatus,
): HelpdeskCase => ({
  id: `demo-${reference}`,
  reference,
  insurer,
  deducted,
  recoverable,
  lastDate,
  status,
  isDemo: true,
  addedAt: "2026-11-01T00:00:00.000Z",
});

// Made up to show how the dashboard works. These aren't results, and the insurers don't exist.
export const DEMO_CASES: HelpdeskCase[] = [
  demo("Demo 1", "Meridian Care", 101500, 8000, "2027-09-02", "new"),
  demo("Demo 2", "Sample Health", 96000, 71400, "2027-10-15", "complained"),
  demo("Demo 3", "Asha Shield", 120000, 120000, "2027-08-12", "ombudsman"),
  demo("Demo 4", "Suraksha Health", 18000, 18000, "2027-10-05", "resolved"),
  demo("Demo 5", "Meridian Care", 64000, 22500, "2027-03-18", "complained"),
  demo("Demo 6", "Sample Health", 42000, 12600, "2027-01-30", "new"),
  demo("Demo 7", "Asha Shield", 75500, 40200, "2027-06-11", "complained"),
  demo("Demo 8", "Suraksha Health", 33000, 9000, "2027-02-22", "new"),
];
