import type {
  Deadline,
  Evidence,
  ExtractedClaim,
  Finding,
  LineItem,
  Regulation,
  RulesEngine,
  RulesEngineInput,
  RulesEngineResult,
  Totals,
  Verdict,
  Confidence,
} from "@claimsathi/contracts";

import {
  buildPedExplanation,
  buildR3Explanation,
  buildR4QuestionableExplanation,
  buildR4WrongExplanation,
  buildRoomRentValidExplanation,
  buildUndecidedExplanation,
} from "./templates.js";

const PENDING_VERIFICATION = "Pending verification by Member C";

const pendingRegulation: Regulation = {
  text: PENDING_VERIFICATION,
  sourceName: PENDING_VERIFICATION,
  verified: false,
};

function differenceInMonths(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined
): number | null {
  if (!startDateStr || !endDateStr) return null;
  const [sy, sm, sd] = startDateStr.split("-").map(Number);
  const [ey, em, ed] = endDateStr.split("-").map(Number);
  if (
    sy === undefined || sm === undefined || sd === undefined ||
    ey === undefined || em === undefined || ed === undefined ||
    isNaN(sy) || isNaN(sm) || isNaN(sd) || isNaN(ey) || isNaN(em) || isNaN(ed)
  ) {
    return null;
  }
  let months = (ey - sy) * 12 + (em - sm);
  if (ed < sd) {
    months -= 1;
  }
  return months;
}

interface ItemDecision {
  item: LineItem;
  ruleIds: string[];
  verdict: Verdict;
  confidence: Confidence;
}

function evaluateLineItem(
  item: LineItem,
  effectiveCategory: string | null,
  extracted: ExtractedClaim,
  effectiveCoverStart: string | null,
  effectiveAdmissionDate: string | null
): ItemDecision {
  const deducted = item.deducted ?? 0;
  if (deducted <= 0) {
    return {
      item,
      ruleIds: [],
      verdict: "valid",
      confidence: "strong",
    };
  }

  // Room rent excess: valid, with empty ruleIds
  if (item.deductionType === "room_rent_excess") {
    return {
      item,
      ruleIds: [],
      verdict: "valid",
      confidence: "strong",
    };
  }

  // R3 Proportionate deduction: pharmacy, consumable, implant or diagnostic items is wrong
  if (item.deductionType === "proportionate") {
    if (
      effectiveCategory !== null &&
      ["pharmacy", "consumable", "implant", "diagnostic"].includes(effectiveCategory)
    ) {
      return {
        item,
        ruleIds: ["R3"],
        verdict: "wrong",
        confidence: "strong",
      };
    }
    // Proportionate deduction on other/unknown categories is undecided
    return {
      item,
      ruleIds: ["UNDECIDED"],
      verdict: "questionable",
      confidence: "moderate",
    };
  }

  // R4 Non-payable items: wrong if partOfPackage is true; questionable if partOfPackage is null or category is admin
  if (item.deductionType === "non_payable") {
    if (item.partOfPackage === true) {
      return {
        item,
        ruleIds: ["R4"],
        verdict: "wrong",
        confidence: "strong",
      };
    }
    if (item.partOfPackage === null || effectiveCategory === "admin") {
      return {
        item,
        ruleIds: ["R4"],
        verdict: "questionable",
        confidence: "moderate",
      };
    }
    return {
      item,
      ruleIds: ["UNDECIDED"],
      verdict: "questionable",
      confidence: "moderate",
    };
  }

  // Pre-existing disease: R1 Moratorium & R2 Waiting period
  if (item.deductionType === "pre_existing_disease") {
    const months = differenceInMonths(effectiveCoverStart, effectiveAdmissionDate);

    // If needed fact is null, cannot decide wrong
    const r1 = months !== null && months >= 60;
    const r2 =
      months !== null &&
      extracted.policy.pedWaitingMonths !== null &&
      months >= extracted.policy.pedWaitingMonths;

    if (r1 && r2) {
      return {
        item,
        ruleIds: ["R1", "R2"],
        verdict: "wrong",
        confidence: "strong",
      };
    }
    if (r1) {
      return {
        item,
        ruleIds: ["R1"],
        verdict: "wrong",
        confidence: "strong",
      };
    }
    if (r2) {
      return {
        item,
        ruleIds: ["R2"],
        verdict: "wrong",
        confidence: "strong",
      };
    }

    return {
      item,
      ruleIds: ["UNDECIDED"],
      verdict: "questionable",
      confidence: "moderate",
    };
  }

  // Any other deductionType (documentation, sub_limit, copay, other, or null)
  return {
    item,
    ruleIds: ["UNDECIDED"],
    verdict: "questionable",
    confidence: "moderate",
  };
}

function findEvidence(
  deductionType: string,
  items: LineItem[],
  extracted: ExtractedClaim
): Evidence {
  const categories = new Set(items.map((i) => i.category));

  let matchedReason = extracted.rejection.reasons.find((r) => {
    if (deductionType === "room_rent_excess" && r.category === "room_rent") return true;
    if (deductionType === "proportionate" && r.category === "proportionate") return true;
    if (deductionType === "pre_existing_disease" && r.category === "pre_existing_disease") return true;
    if (deductionType === "non_payable" && r.category === "non_payable") {
      if (categories.has("admin")) {
        return (
          r.text.toLowerCase().includes("admin") ||
          (r.source?.quote?.toLowerCase().includes("admin") ?? false)
        );
      }
      if (categories.has("consumable")) {
        return (
          r.text.toLowerCase().includes("consumable") ||
          (r.source?.quote?.toLowerCase().includes("consumable") ?? false)
        );
      }
      return true;
    }
    return false;
  });

  if (!matchedReason) {
    matchedReason = extracted.rejection.reasons.find((r) => r.category === deductionType);
  }

  const insurerText =
    matchedReason?.source?.quote ??
    matchedReason?.text ??
    items[0]?.deductionReason ??
    items[0]?.source?.quote ??
    null;

  let policyClause: string | null = null;
  const clauseCited = matchedReason?.clauseCited;
  if (clauseCited) {
    const clauseObj = extracted.policyClauses.find((c) => c.clauseId === clauseCited);
    if (clauseObj) {
      policyClause = clauseObj.text ? `${clauseObj.clauseId}: ${clauseObj.text}` : clauseObj.clauseId;
    } else {
      policyClause = clauseCited;
    }
  }

  return {
    insurerText,
    policyClause,
    regulation: pendingRegulation,
    quoteVerified: false,
  };
}

function parseRoomDetails(item: LineItem): { perDay: number | null; days: number | null } {
  const quote = item.source?.quote ?? item.description ?? "";
  const daysMatch = quote.match(/(\d+)\s*days?/i);
  const rateMatch = quote.match(/(?:@|at)\s*Rs\.?\s*([\d,]+)/i);

  const days = daysMatch?.[1] ? parseInt(daysMatch[1], 10) : null;
  const perDay = rateMatch?.[1] ? parseInt(rateMatch[1].replace(/,/g, ""), 10) : null;
  return { perDay, days };
}

export const runRules: RulesEngine = (input: RulesEngineInput): RulesEngineResult => {
  const { extracted, overrides } = input;

  // Resolve effective facts without modifying input
  const effectiveAdmissionDate = overrides?.admissionDate ?? extracted.claim.admissionDate;
  const effectivePolicyStartDate = overrides?.policyStartDate ?? extracted.policy.startDate;
  const effectiveContinuousCoverSince =
    overrides?.continuousCoverSince !== undefined
      ? overrides.continuousCoverSince
      : extracted.policy.continuousCoverSince;
  const effectiveCoverStart = effectiveContinuousCoverSince ?? effectivePolicyStartDate;

  const categoryOverrideMap = new Map(
    overrides?.lineItemCategories?.map((o) => [o.lineItemId, o.category])
  );

  // Filter only deducted line items
  const deductedItems = extracted.lineItems.filter((item) => (item.deducted ?? 0) > 0);

  // Evaluate each line item
  const decisions: ItemDecision[] = deductedItems.map((item) => {
    const effectiveCategory = categoryOverrideMap.get(item.id) ?? item.category;
    return evaluateLineItem(
      item,
      effectiveCategory,
      extracted,
      effectiveCoverStart,
      effectiveAdmissionDate
    );
  });

  // Group line items into findings: group by deductionType + verdict + ruleIds
  type Group = {
    deductionType: string;
    verdict: Verdict;
    confidence: Confidence;
    ruleIds: string[];
    items: LineItem[];
  };

  const groups: Group[] = [];
  const groupIndexMap = new Map<string, number>();

  for (const d of decisions) {
    const itemDeductionType = d.item.deductionType ?? "other";
    const key = `${itemDeductionType}::${d.verdict}::${d.ruleIds.join(",")}`;
    const existingIndex = groupIndexMap.get(key);
    if (existingIndex !== undefined) {
      groups[existingIndex]!.items.push(d.item);
    } else {
      groupIndexMap.set(key, groups.length);
      groups.push({
        deductionType: itemDeductionType,
        verdict: d.verdict,
        confidence: d.confidence,
        ruleIds: d.ruleIds,
        items: [d.item],
      });
    }
  }

  // Sort groups: wrong first, then valid, then questionable
  const verdictRank: Record<Verdict, number> = {
    wrong: 0,
    valid: 1,
    questionable: 2,
  };

  groups.sort((a, b) => verdictRank[a.verdict] - verdictRank[b.verdict]);

  // Build findings
  const findings: Finding[] = groups.map((g, index) => {
    const id = `F${index + 1}`;
    const lineItemIds = g.items.map((i) => i.id);
    const amount = g.items.reduce((sum, i) => sum + (i.deducted ?? 0), 0);
    const evidence = findEvidence(g.deductionType, g.items, extracted);

    let explanations: { en: string; hi: string };

    if (g.ruleIds.includes("R3")) {
      explanations = buildR3Explanation(g.items, amount);
    } else if (g.ruleIds.includes("R4") && g.verdict === "wrong") {
      const pkgItem = extracted.lineItems.find((i) => i.category === "procedure");
      const pkgName = pkgItem?.description
        ? pkgItem.description.toLowerCase().replace(/package/i, "").trim()
        : "angioplasty";
      explanations = buildR4WrongExplanation(amount, pkgName);
    } else if (g.ruleIds.includes("R4") && g.verdict === "questionable") {
      explanations = buildR4QuestionableExplanation(amount, g.items[0]?.category ?? null);
    } else if (g.ruleIds.includes("R1") || g.ruleIds.includes("R2")) {
      let condition = "hypertension";
      const desc = g.items[0]?.description?.toLowerCase() ?? "";
      if (desc.includes("hypertension")) condition = "hypertension";
      else if (extracted.claim.diagnosis) condition = extracted.claim.diagnosis;

      explanations = buildPedExplanation({
        amount,
        conditionName: condition,
        patientName: extracted.claim.patient.name ?? "the insured",
        waitingMonths: extracted.policy.pedWaitingMonths,
        coverStartDate: effectiveCoverStart,
        ruleIds: g.ruleIds,
      });
    } else if (g.deductionType === "room_rent_excess" && g.verdict === "valid") {
      const firstItem = g.items[0];
      const { perDay, days } = firstItem ? parseRoomDetails(firstItem) : { perDay: null, days: null };
      explanations = buildRoomRentValidExplanation(
        amount,
        extracted.policy.roomRentLimit,
        perDay,
        days
      );
    } else {
      explanations = buildUndecidedExplanation(amount, g.deductionType);
    }

    return {
      id,
      ruleIds: g.ruleIds,
      lineItemIds,
      verdict: g.verdict,
      confidence: g.confidence,
      amount,
      explanationEn: explanations.en,
      explanationHi: explanations.hi,
      evidence,
    };
  });

  // Calculate totals
  const totalDeducted = findings.reduce((sum, f) => sum + f.amount, 0);
  const recoverableStrong = findings
    .filter((f) => f.verdict === "wrong")
    .reduce((sum, f) => sum + f.amount, 0);
  const questionable = findings
    .filter((f) => f.verdict === "questionable")
    .reduce((sum, f) => sum + f.amount, 0);
  const validDeductions = findings
    .filter((f) => f.verdict === "valid")
    .reduce((sum, f) => sum + f.amount, 0);

  const totals: Totals = {
    totalDeducted,
    recoverableStrong,
    questionable,
    validDeductions,
  };

  const deadlines: Deadline[] = [
    {
      label: "Grievance to the insurer",
      date: null,
      explanation: PENDING_VERIFICATION,
      verified: false,
    },
    {
      label: "Complaint to the ombudsman",
      date: null,
      explanation: PENDING_VERIFICATION,
      verified: false,
    },
  ];

  return {
    findings,
    deadlines,
    totals,
  };
};
