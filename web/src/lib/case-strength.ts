import type { Finding } from "@claimsathi/contracts";

export type StrengthBand = "strong" | "fair" | "limited";

export interface CaseStrength {
  score: number;
  band: StrengthBand;
}

// Our own judgement of how much each kind of deduction is worth pursuing. No past outcomes stand behind these,
// so this is a summary of the rules' verdicts and must never be shown as a chance of winning.
const WRONG_WEIGHT = { strong: 1, moderate: 0.7, weak: 0.4 } as const;
const QUESTIONABLE_WEIGHT = 0.25;

export function caseStrength(findings: Finding[]): CaseStrength | null {
  const total = findings.reduce((sum, { amount }) => sum + amount, 0);
  if (total === 0) return null;

  const weighted = findings.reduce((sum, { amount, verdict, confidence }) => {
    if (verdict === "wrong") return sum + amount * WRONG_WEIGHT[confidence];
    if (verdict === "questionable") return sum + amount * QUESTIONABLE_WEIGHT;
    return sum;
  }, 0);

  const score = Math.round((weighted / total) * 100);
  return { score, band: score >= 60 ? "strong" : score >= 30 ? "fair" : "limited" };
}
