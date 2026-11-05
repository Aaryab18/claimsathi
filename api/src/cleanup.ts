import type { CaseStore } from "./case-store.js";
import { logSafely } from "./errors.js";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export async function deleteExpiredCases(store: CaseStore): Promise<void> {
  try {
    await store.deleteExpired(new Date());
  } catch (error) {
    logSafely("Deleting expired cases failed", error);
  }
}

// A free Render service sleeps when idle, so this also runs every time the service wakes up.
export function startCleanup(store: CaseStore): void {
  void deleteExpiredCases(store);
  setInterval(() => void deleteExpiredCases(store), CLEANUP_INTERVAL_MS).unref();
}
