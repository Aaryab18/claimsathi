// The insurer's complaint number is kept in this browser only, per case, and sent along when drafting the
// Ombudsman complaint. Storage can be missing or blocked, so every access is guarded.
const key = (caseToken: string) => `claimsathi.reference.${caseToken}`;
const insurerKey = (caseToken: string) => `claimsathi.insurer.${caseToken}`;

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

// The insurer the person picked when the letter's name didn't match one we have confirmed contacts for.
export function readChosenInsurer(caseToken: string): string {
  try {
    return window.localStorage.getItem(insurerKey(caseToken)) ?? "";
  } catch {
    return "";
  }
}

export function saveChosenInsurer(caseToken: string, name: string): void {
  try {
    if (name) window.localStorage.setItem(insurerKey(caseToken), name);
    else window.localStorage.removeItem(insurerKey(caseToken));
  } catch {
    // The choice still applies for this visit.
  }
}
