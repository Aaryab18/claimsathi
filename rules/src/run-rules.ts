import type {
  AssessmentWarning,
  Evidence,
  ExtractedClaim,
  Finding,
  LineItem,
  Regulation,
  RejectionReason,
  RulesEngine,
  RulesEngineInput,
  RulesEngineResult,
  Totals,
  Verdict,
  Confidence,
} from "@claimsathi/contracts";

import { REGULATIONS } from "@claimsathi/contracts";
import { buildDeadlines } from "./deadlines.js";
import {
  buildPedExplanation,
  buildR3Explanation,
  buildR3IcuExplanation,
  buildR4QuestionableExplanation,
  buildR4WrongExplanation,
  buildR5Explanation,
  buildR6Explanation,
  buildR7Sentence,
  buildRoomRentValidExplanation,
  buildUndecidedExplanation,
} from "./templates.js";

function regulationFor(ruleIds: string[]): Regulation | null {
  for (const ruleId of ruleIds) {
    const regulation = REGULATIONS[ruleId];
    if (regulation) return regulation;
  }
  return null;
}

// The templates end by saying a reference is unchecked, which isn't how it stands any more.
const UNCHECKED_EN = /\s*The legal reference for (?:this rule|these rules|this deduction) has not been checked yet\./;
const UNCHECKED_HI = /\s*(?:इस नियम|इन नियमों|इस कटौती) के कानूनी संदर्भ की जाँच अभी बाकी है।|\s*इस नियम का कानूनी संदर्भ अभी जांचा नहीं गया है।/;

function withSourceStatus(
  explanations: { en: string; hi: string },
  ruleIds: string[]
): { en: string; hi: string } {
  const regulation = regulationFor(ruleIds);
  // An undecided deduction has no rule yet, so there's genuinely nothing checked to point to.
  if (!regulation && ruleIds.includes("UNDECIDED")) return explanations;
  const confirming = regulation && !regulation.verified;
  return {
    en: explanations.en.replace(UNCHECKED_EN, confirming ? " IRDAI's 2020 circular supports this, and we are confirming it still applies." : ""),
    hi: explanations.hi.replace(UNCHECKED_HI, confirming ? " IRDAI का 2020 का परिपत्र इसका समर्थन करता है, और हम पुष्टि कर रहे हैं कि यह अब भी लागू है।" : ""),
  };
}

// "Clause 6.3", "Cl. 6.3" and "6.3" are the same clause.
function clauseKey(clause: string): string {
  const number = /\d+(?:\.\d+)*(?:\s*\([a-z0-9]+\))*/i.exec(clause)?.[0];
  return (number ?? clause).toLowerCase().replace(/\s/g, "");
}

// R7. Code can only show that a clause wasn't found in what was read, so this never proves the insurer wrong.
function clauseIsMissing(clauseCited: string | null | undefined, extracted: ExtractedClaim): clauseCited is string {
  return Boolean(clauseCited) && !extracted.policyClauses.some((c) => clauseKey(c.clauseId) === clauseKey(clauseCited!));
}

interface R6Check {
  verdict: Verdict;
  allowed: number | null;
  limitName: string | null;
}

// R6 recomputes co-pay and sub-limits. A finding's amount must equal the item's whole deduction, so an excess
// can't be split off and is reported as questionable, which keeps the recoverable figure from being overstated.
function checkArithmetic(item: LineItem, extracted: ExtractedClaim): R6Check {
  const deducted = item.deducted ?? 0;
  const unknown: R6Check = { verdict: "questionable", allowed: null, limitName: null };

  if (item.deductionType === "copay") {
    const percent = extracted.policy.copayPercent;
    const items = extracted.lineItems;
    // A co-pay is often its own line with no bill amount, so only the other lines must be known.
    const billLines = items.filter((i) => i.deductionType !== "copay");
    if (percent === null || billLines.length === 0 || billLines.some((i) => i.billed === null)) return unknown;
    if (items.filter((i) => i.deductionType === "copay" && (i.deducted ?? 0) > 0).length !== 1) return unknown;
    // Co-pay belongs on what was admissible: the bill after the other deductions.
    const admissible = billLines.reduce((sum, i) => sum + (i.billed ?? 0) - (i.deducted ?? 0), 0);
    const allowed = Math.round((admissible * percent) / 100);
    return { verdict: deducted <= allowed ? "valid" : "questionable", allowed, limitName: null };
  }

  const text = `${item.description ?? ""} ${item.deductionReason ?? ""}`.toLowerCase();
  const matching = extracted.policy.subLimits.filter(
    (limit) =>
      limit.amount !== null &&
      (limit.name.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).some(
        (word) => word !== "limit" && text.includes(word)
      )
  );
  const limit = matching.length === 1 ? matching[0] : undefined;
  if (!limit || limit.amount === null || item.billed === null) return unknown;
  const allowed = Math.max(item.billed - limit.amount, 0);
  return { verdict: deducted <= allowed ? "valid" : "questionable", allowed, limitName: limit.name };
}

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
  effectiveAdmissionDate: string | null,
  insurerAskedForMissingDocument: boolean | undefined
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
    // The same 2020 circular bars this cut on ICU charges, as ICUs have no room categories.
    if (/\b(?:i?ccu|icu|intensive care)\b/i.test(item.description ?? "")) {
      return {
        item,
        ruleIds: ["R3-ICU"],
        verdict: "wrong",
        confidence: "strong",
      };
    }
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

  // R5 needs a fact only the person knows, so it stays questionable unless they confirm it.
  if (item.deductionType === "documentation") {
    return insurerAskedForMissingDocument === false
      ? { item, ruleIds: ["R5"], verdict: "wrong", confidence: "moderate" }
      : { item, ruleIds: ["R5"], verdict: "questionable", confidence: "moderate" };
  }

  if (item.deductionType === "copay" || item.deductionType === "sub_limit") {
    const { verdict } = checkArithmetic(item, extracted);
    return { item, ruleIds: ["R6"], verdict, confidence: "moderate" };
  }

  // Any other deductionType (other, or null)
  return {
    item,
    ruleIds: ["UNDECIDED"],
    verdict: "questionable",
    confidence: "moderate",
  };
}

const CATEGORY_WORDS: Partial<Record<string, string>> = {
  admin: "admin",
  consumable: "consumable",
  pharmacy: "pharmacy",
  implant: "implant",
  diagnostic: "diagnostic",
};

// Too common on a bill to show that a reason is about one particular item.
const GENERIC_WORDS = new Set(["bill", "charge", "charges", "fees", "hospital", "item", "items", "payable", "treatment"]);

function reasonMentionsItem(reason: RejectionReason, item: LineItem): boolean {
  const reasonText = `${reason.text} ${reason.source?.quote ?? ""}`.toLowerCase();
  const descriptionWords = item.description?.toLowerCase().match(/[\p{L}\p{M}\p{N}]{4,}/gu) ?? [];
  const words = descriptionWords.filter((word) => !GENERIC_WORDS.has(word));
  // Too short for the word match above, but it names the item exactly.
  const shortName = item.description?.toLowerCase().match(/\b(?:i?ccu|icu)\b/)?.[0];
  if (shortName) words.push(shortName);
  const categoryWord = item.category ? CATEGORY_WORDS[item.category] : undefined;
  if (categoryWord) words.push(categoryWord);
  return words.some((word) => reasonText.includes(word));
}

function findMatchingReason(
  deductionType: string,
  items: LineItem[],
  extracted: ExtractedClaim
): RejectionReason | undefined {
  // Map deductionType to rejection category
  let targetCategory: string = deductionType;
  if (deductionType === "room_rent_excess") {
    targetCategory = "room_rent";
  } else if (deductionType === "documentation") {
    targetCategory = "documentation_missing";
  }

  const candidates = extracted.rejection.reasons.filter((r) => r.category === targetCategory);

  // "Non-payable" covers unrelated items, and several reasons can share a category. In those
  // cases a reason must name every item, so one item never gets another item's evidence.
  if (targetCategory === "non_payable" || candidates.length > 1) {
    return candidates.find((r) => items.every((item) => reasonMentionsItem(r, item)));
  }
  return candidates[0];
}

function findEvidence(
  items: LineItem[],
  matchedReason: RejectionReason | undefined,
  extracted: ExtractedClaim
): Evidence {
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
    const clauseObj = extracted.policyClauses.find((c) => clauseKey(c.clauseId) === clauseKey(clauseCited));
    if (clauseObj) {
      policyClause = clauseObj.text ? `${clauseObj.clauseId}: ${clauseObj.text}` : clauseObj.clauseId;
    } else {
      policyClause = null;
    }
  }

  return {
    insurerText,
    policyClause,
    regulation: null,
    // Only a quote we found in the file's own text counts, and only when it's the quote being shown.
    quoteVerified:
      insurerText !== null &&
      [matchedReason?.source, ...items.map((i) => i.source)].some(
        (source) => source?.quote === insurerText && source.verified === true
      ),
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
      effectiveAdmissionDate,
      overrides?.insurerAskedForMissingDocument
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

  // R7 runs after the other rules, and can only ever take a "valid" down to "questionable".
  for (const group of groups) {
    const reason = findMatchingReason(group.deductionType, group.items, extracted);
    if (clauseIsMissing(reason?.clauseCited, extracted)) {
      group.ruleIds = [...group.ruleIds.filter((id) => id !== "UNDECIDED"), "R7"];
      if (group.verdict === "valid") {
        group.verdict = "questionable";
        group.confidence = "moderate";
      }
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
    const matchedReason = findMatchingReason(g.deductionType, g.items, extracted);
    const evidence = findEvidence(g.items, matchedReason, extracted);

    let explanations: { en: string; hi: string };

    if (g.ruleIds.includes("R3-ICU")) {
      explanations = buildR3IcuExplanation(amount, g.items);
    } else if (g.ruleIds.includes("R3")) {
      explanations = buildR3Explanation(g.items, amount);
    } else if (g.ruleIds.includes("R4") && g.verdict === "wrong") {
      // A package is only named when the bill calls it one, and never from the deducted items themselves.
      const pkgItem = extracted.lineItems.find(
        (i) =>
          /package/i.test(i.description ?? "") &&
          (i.approved ?? 0) > 0 &&
          !g.items.some((item) => item.id === i.id)
      );
      const pkgName = pkgItem?.description
        ? pkgItem.description.replace(/package/i, "").trim()
        : null;
      const insurerApprovedPackage = pkgItem !== undefined;
      explanations = buildR4WrongExplanation({
        amount,
        itemDescriptions: g.items.map((i) => i.description),
        packageName: pkgName,
        insurerApprovedPackage,
      });
    } else if (g.ruleIds.includes("R4") && g.verdict === "questionable") {
      const clauseCited = matchedReason ? matchedReason.clauseCited : undefined;
      explanations = buildR4QuestionableExplanation(amount, g.items, clauseCited);
    } else if (g.ruleIds.includes("R1") || g.ruleIds.includes("R2")) {
      const descriptions = g.items.flatMap((i) => i.description?.trim() || []);
      // A line for rooms, medicines or tests names a charge, not an illness.
      const conditions =
        descriptions.length === g.items.length && g.items.every((i) => !i.category || i.category === "other")
          ? descriptions.map((description) =>
              /hypertension/i.test(description)
                ? { en: "hypertension", hi: "हाइपरटेंशन (उच्च रक्तचाप)" }
                : { en: description, hi: description }
            )
          : null;

      explanations = buildPedExplanation({
        amount,
        conditions,
        patientName: extracted.claim.patient.name,
        waitingMonths: extracted.policy.pedWaitingMonths,
        coverStartDate: effectiveCoverStart,
        ruleIds: g.ruleIds,
      });
    } else if (g.ruleIds.includes("R5")) {
      explanations = buildR5Explanation(amount, g.verdict === "wrong", overrides?.insurerAskedForMissingDocument);
    } else if (g.ruleIds.includes("R6")) {
      const check = g.items.length === 1 ? checkArithmetic(g.items[0]!, extracted) : null;
      explanations = buildR6Explanation(amount, g.deductionType, check?.allowed ?? null, check?.limitName ?? null);
    } else if (g.deductionType === "room_rent_excess" && g.verdict === "valid") {
      const days = differenceInDays(effectiveAdmissionDate, extracted.claim.dischargeDate);
      const limit = extracted.policy.roomRentLimit;
      const billed = g.items.length === 1 ? g.items[0]?.billed : null;
      // The daily figures are only stated when they exactly explain this one deduction.
      const figuresExplainDeduction =
        billed && days && limit && billed % days === 0 && amount === billed - limit * days;
      explanations = buildRoomRentValidExplanation(
        amount,
        limit,
        figuresExplainDeduction ? billed / days : null,
        days
      );
    } else {
      explanations = buildUndecidedExplanation(
        amount,
        g.deductionType,
        g.items[0]?.description,
        overrides?.insurerAskedForMissingDocument
      );
    }

    explanations = withSourceStatus(explanations, g.ruleIds);

    const missingClause = matchedReason?.clauseCited;
    if (clauseIsMissing(missingClause, extracted)) {
      const sentence = buildR7Sentence(missingClause);
      explanations = { en: `${explanations.en} ${sentence.en}`, hi: `${explanations.hi} ${sentence.hi}` };
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
      evidence: { ...evidence, regulation: regulationFor(g.ruleIds) },
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

  const deadlines = buildDeadlines(extracted, overrides);

  // Assessment warnings
  const warnings: AssessmentWarning[] = [];

  // 1. No line items, whatever the type of rejection
  if (extracted.lineItems.length === 0) {
    warnings.push({
      code: "no_line_items",
      messageEn: "No bill items were found in the documents, so the deductions could not be assessed.",
      messageHi: "दस्तावेज़ों में बिल की कोई मद नहीं मिली, इसलिए कटौतियों का आकलन नहीं हो सका।",
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
