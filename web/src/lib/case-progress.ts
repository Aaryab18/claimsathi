// Which steps the person has taken on a case, kept in this browser only. Storage can be missing or blocked,
// so every access is guarded and the page still works without it.
export interface CaseProgressFlags {
  facts: boolean;
  letter: boolean;
}

const key = (caseToken: string) => `claimsathi.progress.${caseToken}`;

export function readProgress(caseToken: string): CaseProgressFlags {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key(caseToken)) ?? "{}") as Partial<CaseProgressFlags>;
    return { facts: saved.facts === true, letter: saved.letter === true };
  } catch {
    return { facts: false, letter: false };
  }
}

export function saveProgress(caseToken: string, flags: CaseProgressFlags): void {
  try {
    window.localStorage.setItem(key(caseToken), JSON.stringify(flags));
  } catch {
    // The ticks still show for this visit.
  }
}
