import type {
  AssessmentWarning,
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

function differenceInDays(
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
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const diffMs = endUtc - startUtc;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
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
  if (item.deducted === null) {
    return {
      item,
      ruleIds: ["UNDECIDED"],
      verdict: "questionable",
      confidence: "moderate",
    };
  }

  const deducted = item.deducted;
  if (deducted <= 0) {
    return {
      item,
      ruleIds: [],
      verdict: "valid",
      confidence: "strong",
    };
  }

  // Room rent excess: valid only if limit and both dates exist, average > limit, and deduction <= billed - limit * days
  if (item.deductionType === "room_rent_excess") {
    const limit = extracted.policy.roomRentLimit;
    const dischargeDate = extracted.claim.dischargeDate;
    const days = differenceInDays(effectiveAdmissionDate, dischargeDate);
    const billed = item.billed;

    const hasLimit = limit !== null && limit !== undefined;
    const hasDates =
      effectiveAdmissionDate !== null &&
      effectiveAdmissionDate !== undefined &&
      dischargeDate !== null &&
      dischargeDate !== undefined &&
      days !== null &&
      days > 0;
    const hasBilled = billed !== null && billed !== undefined;

    if (hasLimit && hasDates && hasBilled) {
      const averageDailyCost = billed / days;
      const maxDeduction = billed - limit * days;
      if (averageDailyCost > limit && deducted <= maxDeduction) {
        return {
          item,
          ruleIds: [],
          verdict: "valid",
          confidence: "strong",
        };
      }
    }

    return {
      item,
      ruleIds: ["UNDECIDED"],
      verdict: "questionable",
      confidence: "moderate",
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
  // Map deductionType to rejection category
  let targetCategory: string = deductionType;
  if (deductionType === "room_rent_excess") {
    targetCategory = "room_rent";
  } else if (deductionType === "documentation") {
    targetCategory = "documentation_missing";
  }

  const categories = new Set(items.map((i) => i.category));

  const matchedReason = extracted.rejection.reasons.find((r) => {
    if (r.category !== targetCategory) return false;
    if (targetCategory === "non_payable") {
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
    return true;
  });

  // insurerText may only come from a rejection reason, or from a line item's source when its document is rejection_letter. Otherwise it is null.
  let insurerText: string | null = null;
  if (matchedReason) {
    insurerText = matchedReason.source?.quote ?? matchedReason.text ?? null;
  } else {
    const itemWithRejection = items.find((i) => i.source?.document === "rejection_letter");
    if (itemWithRejection?.source?.quote) {
      insurerText = itemWithRejection.source.quote;
    }
  }

  // Only use a clause found in policyClauses, otherwise policyClause is null.
  let policyClause: string | null = null;
  const clauseCited = matchedReason?.clauseCited;
  if (clauseCited) {
    const clauseObj = extracted.policyClauses.find((c) => c.clauseId === clauseCited);
    if (clauseObj) {
      policyClause = clauseObj.text ? `${clauseObj.clauseId}: ${clauseObj.text}` : clauseObj.clauseId;
    } else {
      policyClause = null;
    }
  }

  return {
    insurerText,
    policyClause,
    regulation: pendingRegulation,
    quoteVerified: false,
  };
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

  // Assess line items that have positive deductions or deducted: null
  const assessableItems = extracted.lineItems.filter(
    (item) => (item.deducted ?? 0) > 0 || item.deducted === null
  );

  // Apply category overrides creating effective items (not mutating original items)
  const effectiveItems: LineItem[] = assessableItems.map((item) => {
    const overrideCategory = categoryOverrideMap.get(item.id);
    if (overrideCategory !== undefined) {
      return { ...item, category: overrideCategory };
    }
    return item;
  });

  // Evaluate each line item
  const decisions: ItemDecision[] = effectiveItems.map((item) => {
    return evaluateLineItem(
      item,
      item.category,
      extracted,
      effectiveCoverStart,
      effectiveAdmissionDate
    );
  });

  // Group line items into findings
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
    if (d.item.deducted === null) {
      groups.push({
        deductionType: d.item.deductionType ?? "other",
        verdict: "questionable",
        confidence: "moderate",
        ruleIds: ["UNDECIDED"],
        items: [d.item],
      });
      continue;
    }

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
      const pkgItem = extracted.lineItems.find(
        (i) =>
          (i.category === "procedure" || /package/i.test(i.description ?? "")) &&
          (i.approved ?? 0) > 0
      );
      const pkgName = pkgItem?.description
        ? pkgItem.description.replace(/package/i, "").trim()
        : null;
      const insurerApprovedPackage = pkgItem !== undefined;
      const firstItem = g.items[0];
      explanations = buildR4WrongExplanation({
        amount,
        itemDescription: firstItem?.description,
        packageName: pkgName,
        insurerApprovedPackage,
      });
    } else if (g.ruleIds.includes("R4") && g.verdict === "questionable") {
      const matchedReason = extracted.rejection.reasons.find((r) => {
        if (r.category !== "non_payable") return false;
        const categories = new Set(g.items.map((i) => i.category));
        if (categories.has("admin")) {
          return (
            r.text.toLowerCase().includes("admin") ||
            (r.source?.quote?.toLowerCase().includes("admin") ?? false)
          );
        }
        return true;
      });
      const clauseCited = matchedReason?.clauseCited ?? null;
      explanations = buildR4QuestionableExplanation(amount, g.items, clauseCited);
    } else if (g.ruleIds.includes("R1") || g.ruleIds.includes("R2")) {
      const rawDesc = g.items[0]?.description?.trim();
      let conditionNameEn: string;
      let conditionNameHi: string;

      if (rawDesc) {
        if (/hypertension/i.test(rawDesc)) {
          conditionNameEn = "hypertension";
          conditionNameHi = "हाइपरटेंशन (उच्च रक्तचाप)";
        } else {
          conditionNameEn = rawDesc;
          conditionNameHi = rawDesc;
        }
      } else {
        conditionNameEn = "this condition";
        conditionNameHi = "इस स्थिति";
      }

      explanations = buildPedExplanation({
        amount,
        conditionNameEn,
        conditionNameHi,
        patientName: extracted.claim.patient.name ?? "the insured",
        waitingMonths: extracted.policy.pedWaitingMonths,
        coverStartDate: effectiveCoverStart,
        ruleIds: g.ruleIds,
      });
    } else if (g.deductionType === "room_rent_excess" && g.verdict === "valid") {
      const days = differenceInDays(effectiveAdmissionDate, extracted.claim.dischargeDate);
      const firstItem = g.items[0];
      const perDay = firstItem?.billed && days ? Math.round(firstItem.billed / days) : null;
      explanations = buildRoomRentValidExplanation(
        amount,
        extracted.policy.roomRentLimit,
        perDay,
        days
      );
    } else {
      explanations = buildUndecidedExplanation(amount, g.deductionType, g.items[0]?.description);
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

  // Assessment warnings
  const warnings: AssessmentWarning[] = [];

  // 1. Full rejection with no line items
  if (extracted.rejection.type === "full" && extracted.lineItems.length === 0) {
    warnings.push({
      code: "no_line_items",
      messageEn: "The claim was fully rejected, but no line items were found in the bill.",
      messageHi: "दावा पूरी तरह खारिज कर दिया गया था, लेकिन बिल में कोई मद नहीं मिली।",
    });
  }

  // 2. Line item with missing deduction amount
  if (extracted.lineItems.some((item) => item.deducted === null)) {
    warnings.push({
      code: "missing_deduction_amount",
      messageEn: "One or more line items have a missing deduction amount.",
      messageHi: "एक या अधिक मदों में कटौती की राशि दर्ज नहीं है।",
    });
  }

  // 3. Claimed minus approved does not equal total deducted
  if (
    extracted.claim.amountClaimed !== null &&
    extracted.claim.amountApproved !== null
  ) {
    const diff = extracted.claim.amountClaimed - extracted.claim.amountApproved;
    if (diff !== totalDeducted) {
      warnings.push({
        code: "totals_do_not_match",
        messageEn: "The claimed amount minus approved amount does not equal the total deducted amount.",
        messageHi: "दावा की गई राशि और स्वीकृत राशि का अंतर कुल कटौती राशि के बराबर नहीं है।",
      });
    }
  }

  return {
    findings,
    deadlines,
    totals,
    warnings,
  };
};
