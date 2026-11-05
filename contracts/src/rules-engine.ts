import type { AssessmentWarning, Deadline, Totals } from "./case-result.js";
import type { IsoDate } from "./common.js";
import type { ExtractedClaim } from "./extracted.js";
import type { Finding } from "./finding.js";
import type { FactOverrides } from "./overrides.js";

export interface RulesEngineInput {
  extracted: ExtractedClaim;
  overrides?: FactOverrides;
  asOfDate: IsoDate;
}

export interface RulesEngineResult {
  findings: Finding[];
  deadlines: Deadline[];
  totals: Totals;
  warnings: AssessmentWarning[];
}

// The rules themselves live in rules/.
export type RulesEngine = (input: RulesEngineInput) => RulesEngineResult;
