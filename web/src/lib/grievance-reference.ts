// The insurer's complaint number is kept in this browser only, per case, and sent along when drafting the
// Ombudsman complaint. Storage can be missing or blocked, so every access is guarded.
const key = (caseToken: string) => `claimsathi.reference.${caseToken}`;

export function readGrievanceReference(caseToken: string): string {
  try {
    return window.localStorage.getItem(key(caseToken)) ?? "";
  } catch {
    return "";
  }
}

export function saveGrievanceReference(caseToken: string, value: string): void {
  try {
    if (value.trim()) window.localStorage.setItem(key(caseToken), value.trim());
    else window.localStorage.removeItem(key(caseToken));
  } catch {
    // Nothing to do: the number still goes into this visit's letters.
  }
}
