import type { LineItem } from "@claimsathi/contracts";

export function formatRupees(amount: number): string {
  return amount.toLocaleString("en-IN");
}

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HI_MONTHS = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function formatMonthYear(isoDate: string): { en: string; hi: string } {
  const parts = isoDate.split("-");
  const year = parts[0];
  const monthIdx = Number(parts[1]) - 1;
  const enMonth = EN_MONTHS[monthIdx] ?? "";
  const hiMonth = HI_MONTHS[monthIdx] ?? "";
  return {
    en: `${enMonth} ${year}`,
    hi: `${hiMonth} ${year}`,
  };
}

export function friendlyCategoryEn(category: string | null | undefined): string {
  switch (category) {
    case "room": return "room rent";
    case "pharmacy": return "pharmacy";
    case "consumable": return "consumables";
    case "implant": return "implants";
    case "diagnostic": return "diagnostic tests";
    case "procedure": return "procedure";
    case "admin": return "administration charges";
    case "other": return "other charges";
    default: return "charges";
  }
}

export function friendlyCategoryHi(category: string | null | undefined): string {
  switch (category) {
    case "room": return "कमरे का किराया";
    case "pharmacy": return "दवाइयों";
    case "consumable": return "उपभोग्य सामग्री";
    case "implant": return "इम्प्लांट";
    case "diagnostic": return "जांच";
    case "procedure": return "प्रक्रिया";
    case "admin": return "प्रशासनिक शुल्क";
    case "other": return "अन्य शुल्क";
    default: return "मदों";
  }
}

export function friendlyDeductionTypeEn(type: string | null | undefined): string {
  switch (type) {
    case "room_rent_excess": return "room rent excess";
    case "room_rent": return "room rent";
    case "proportionate": return "proportionate deduction";
    case "non_payable": return "non-payable items";
    case "pre_existing_disease": return "pre-existing disease";
    case "documentation":
    case "documentation_missing": return "missing documentation";
    case "sub_limit": return "sub-limit";
    case "copay": return "co-payment";
    case "other": return "other deductions";
    default: return "unspecified deduction";
  }
}

export function friendlyDeductionTypeHi(type: string | null | undefined): string {
  switch (type) {
    case "room_rent_excess": return "कमरे के अतिरिक्त किराए";
    case "room_rent": return "कमरे के किराए";
    case "proportionate": return "आनुपातिक कटौती";
    case "non_payable": return "गैर-देय मदों";
    case "pre_existing_disease": return "पहले से मौजूद बीमारी";
    case "documentation":
    case "documentation_missing": return "दस्तावेज़ों की कमी";
    case "sub_limit": return "उप-सीमा (सब-लिमिट)";
    case "copay": return "सह-भुगतान (को-पे)";
    case "other": return "अन्य कटौती";
    default: return "अनिर्दिष्ट कटौती";
  }
}

function joinNames(names: string[], lastJoiner: string): string {
  if (names.length < 2) return names[0] ?? "";
  return names.slice(0, -1).join(", ") + lastJoiner + names[names.length - 1];
}

// An implant can be anything, so it is named from the bill, never assumed to be a stent.
function billPhraseEn(item: LineItem): string {
  if (item.category === "implant") {
    const description = item.description?.trim();
    return description ? `the bill for ${description}` : "the implant bill";
  }
  return `the ${friendlyCategoryEn(item.category)} bill`;
}

function billNameHi(item: LineItem): string {
  if (item.category === "implant") {
    return item.description?.trim() || friendlyCategoryHi(item.category);
  }
  return friendlyCategoryHi(item.category);
}

export function buildR3Explanation(
  items: LineItem[],
  totalAmount: number
): { en: string; hi: string } {
  if (items.length > 1) {
    const enBreakdown = joinNames(
      items.map((i) => `₹${formatRupees(i.deducted ?? 0)} from ${billPhraseEn(i)}`),
      " and "
    );
    const hiBreakdown = joinNames(
      items.map((i) => `${billNameHi(i)} के बिल से ₹${formatRupees(i.deducted ?? 0)}`),
      " और "
    );

    // Determine subject based on actual categories
    const distinctCats = [...new Set(items.map((i) => i.category).filter(Boolean))];
    const enSubjects = distinctCats.map((c) => {
      if (c === "pharmacy") return "medicines";
      if (c === "implant") return "implants";
      if (c === "consumable") return "consumables";
      if (c === "diagnostic") return "diagnostic tests";
      return "these items";
    });
    const enSubject = joinNames(enSubjects, " and ") || "these items";
    const subjectEn = enSubject.charAt(0).toUpperCase() + enSubject.slice(1);

    const hiSubjects = distinctCats.map((c) => {
      if (c === "pharmacy") return "दवाइयों";
      if (c === "implant") return "इम्प्लांट";
      if (c === "consumable") return "उपभोग्य सामग्री";
      if (c === "diagnostic") return "जांच";
      return "इन मदों";
    });
    const subjectHi = joinNames(hiSubjects, " और ") || "इन मदों";

    const en = `The insurer cut ${enBreakdown}, ₹${formatRupees(totalAmount)} in total. It reduced this in proportion because the room cost more than the policy limit. ${subjectEn} cost the same whichever room the patient stays in, so rule R3 marks this cut as wrong. The legal reference for this rule has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${hiBreakdown}, यानी कुल ₹${formatRupees(totalAmount)} काटे। यह कटौती उसी अनुपात में की गई, जो कमरे का किराया पॉलिसी की सीमा से ज़्यादा होने के कारण लगाया गया था। मरीज़ किसी भी कमरे में रहे, ${subjectHi} की कीमत वही रहती है, इसलिए नियम R3 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  const item = items[0]!;
  const amount = item.deducted ?? 0;
  const categoryHi = billNameHi(item);

  const en = `The insurer cut ₹${formatRupees(amount)} from ${billPhraseEn(item)}. It reduced this in proportion because the room cost more than the policy limit. Medicines, consumables, implants and diagnostic tests cost the same whichever room the patient stays in, so rule R3 marks this cut as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${categoryHi} के बिल से ₹${formatRupees(amount)} काटे। यह कटौती उसी अनुपात में की गई, जो कमरे का किराया पॉलिसी की सीमा से ज़्यादा होने के कारण लगाया गया था। कमरे की श्रेणी बदलने से इन वस्तुओं की कीमत नहीं बदलती, इसलिए नियम R3 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildR4WrongExplanation(options: {
  amount: number;
  itemDescriptions: (string | null)[];
  packageName?: string | null;
  insurerApprovedPackage?: boolean;
}): { en: string; hi: string } {
  const { amount, itemDescriptions, packageName, insurerApprovedPackage } = options;

  const names = itemDescriptions.flatMap((description) => description?.trim() || []);
  const allNamed = names.length > 0 && names.length === itemDescriptions.length;
  const itemDescEn = allNamed ? joinNames(names, " and ") : "these charges";
  const itemDescHi = allNamed ? joinNames(names, " और ") : "इन शुल्कों";

  const pkgEn = packageName ? `${packageName} package` : "package";
  const pkgHi = packageName ? `${packageName} पैकेज` : "पैकेज";

  let pkgSentenceEn: string;
  let pkgSentenceHi: string;

  if (insurerApprovedPackage) {
    pkgSentenceEn = `The hospital bill shows these items as part of the ${pkgEn}, and the insurer approved that package,`;
    pkgSentenceHi = `अस्पताल के बिल में यह सामग्री ${pkgHi} का हिस्सा दिखाई गई है, और बीमा कंपनी ने वह पैकेज मंज़ूर किया है,`;
  } else {
    pkgSentenceEn = `The hospital bill shows these items as part of a package,`;
    pkgSentenceHi = `अस्पताल के बिल में यह सामग्री पैकेज का हिस्सा दिखाई गई है,`;
  }

  const en = `The insurer refused ₹${formatRupees(amount)} of ${itemDescEn} as not payable. ${pkgSentenceEn} so rule R4 marks this deduction as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ₹${formatRupees(amount)} की ${itemDescHi} को देय नहीं माना। ${pkgSentenceHi} इसलिए नियम R4 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildR4QuestionableExplanation(
  amount: number,
  items: LineItem[],
  // undefined means no rejection reason was matched, so nothing can be said about a clause.
  clauseCited: string | null | undefined
): { en: string; hi: string } {
  let descEn: string;
  let descHi: string;

  const allAdmin = items.length > 0 && items.every((i) => i.category === "admin");
  if (allAdmin) {
    descEn = "administration charges";
    descHi = "प्रशासनिक शुल्क";
  } else {
    const descsEn = items.map((i) => i.description ?? (i.category ? friendlyCategoryEn(i.category) : null)).filter(Boolean);
    const descsHi = items.map((i) => i.description ?? (i.category ? friendlyCategoryHi(i.category) : null)).filter(Boolean);
    if (descsEn.length > 0) {
      descEn = descsEn.join(" and ");
      descHi = descsHi.join(" और ");
    } else {
      descEn = "items marked as non-payable";
      descHi = "गैर-देय मदों";
    }
  }

  let clauseStrEn = "";
  let clauseStrHi = "";
  if (clauseCited) {
    clauseStrEn = ` citing ${clauseCited}`;
    clauseStrHi = ` ${clauseCited} का हवाला देते हुए`;
  } else if (clauseCited === null) {
    clauseStrEn = " without citing a policy clause";
    clauseStrHi = " पॉलिसी की कोई धारा बताए बिना";
  }

  // The package question is only unclear if the documents have not already answered it.
  const knownOutsidePackage = items.length > 0 && items.every((i) => i.partOfPackage === false);
  const unclearEn = knownOutsidePackage
    ? "what these charges cover"
    : "what these charges cover or whether they belong to the package";
  const unclearHi = knownOutsidePackage
    ? "इन शुल्कों में क्या शामिल है"
    : "इन शुल्कों में क्या शामिल है या वे पैकेज का हिस्सा हैं या नहीं";

  const en = `The insurer disallowed ₹${formatRupees(amount)} of ${descEn}${clauseStrEn}. The documents do not show clearly ${unclearEn}, so rule R4 marks this as questionable. It is worth asking the insurer and the hospital for a breakdown. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने${clauseStrHi} ₹${formatRupees(amount)} के ${descHi} काट दिए। दस्तावेज़ों से साफ़ नहीं होता कि ${unclearHi}, इसलिए नियम R4 इसे संदिग्ध मानता है। बीमा कंपनी और अस्पताल से इसका पूरा ब्योरा माँगना उचित रहेगा। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildPedExplanation(options: {
  amount: number;
  conditions: { en: string; hi: string }[] | null;
  patientName: string | null;
  waitingMonths: number | null;
  coverStartDate: string | null;
  ruleIds: string[];
}): { en: string; hi: string } {
  const { amount, conditions, patientName, waitingMonths, coverStartDate, ruleIds } = options;
  const conditionNameEn = conditions ? joinNames(conditions.map((c) => c.en), " and ") : "this condition";
  const conditionNameHi = conditions ? joinNames(conditions.map((c) => c.hi), " और ") : "इस स्थिति";
  const patientNameEn = patientName ?? "the insured";
  const patientNameHi = patientName ?? "बीमित व्यक्ति";
  const isR1 = ruleIds.includes("R1");
  const isR2 = ruleIds.includes("R2");

  const formattedDate = coverStartDate ? formatMonthYear(coverStartDate) : { en: "the start", hi: "शुरुआत" };
  const rulesTextEn = isR1 && isR2 ? "rules R1 and R2 mark" : isR1 ? "rule R1 marks" : "rule R2 marks";
  const rulesTextHi = isR1 && isR2 ? "नियम R1 और R2 इस कटौती को गलत मानते हैं" : isR1 ? "नियम R1 इस कटौती को गलत मानता है" : "नियम R2 इस कटौती को गलत मानता है";

  if (isR1 && isR2 && waitingMonths) {
    const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionNameEn} as a pre-existing disease. The policy's waiting period is ${waitingMonths} months, and ${patientNameEn} has had continuous cover since ${formattedDate.en}, more than ${waitingMonths} months before this admission. The waiting period had already ended, so ${rulesTextEn} this deduction as wrong. The legal reference for these rules has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${conditionNameHi} को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। पॉलिसी में प्रतीक्षा अवधि ${waitingMonths} महीने की है, और ${patientNameHi} का बीमा ${formattedDate.hi} से लगातार चल रहा है, जो इस भर्ती से ${waitingMonths} महीने से भी ज़्यादा पहले की बात है। प्रतीक्षा अवधि पहले ही पूरी हो चुकी थी, इसलिए ${rulesTextHi}। इन नियमों के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  if (isR1) {
    const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionNameEn} as a pre-existing disease. Continuous cover at admission is 60 months or more, so ${rulesTextEn} this deduction as wrong under the moratorium principle. The legal reference for this rule has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${conditionNameHi} को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। भर्ती के समय निरंतर बीमा 60 महीने या उससे अधिक का हो चुका है, इसलिए ${rulesTextHi}। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  const waitStr = waitingMonths ? `${waitingMonths} months` : "the waiting period";
  const waitStrHi = waitingMonths ? `${waitingMonths} महीने` : "प्रतीक्षा अवधि";
  const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionNameEn} as a pre-existing disease. The policy's waiting period is ${waitStr}, and had ended before this admission, so ${rulesTextEn} this deduction as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${conditionNameHi} को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। पॉलिसी की ${waitStrHi} की प्रतीक्षा अवधि इस भर्ती से पहले ही समाप्त हो चुकी थी, इसलिए ${rulesTextHi}। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildRoomRentValidExplanation(
  amount: number,
  roomLimit: number | null,
  roomCostPerDay?: number | null,
  days?: number | null
): { en: string; hi: string } {
  if (roomCostPerDay && roomLimit && days) {
    const en = `The room cost ₹${formatRupees(roomCostPerDay)} a day, but the policy pays up to ₹${formatRupees(roomLimit)} a day. Over ${days} days the excess is ₹${formatRupees(amount)}. This deduction follows the policy limit and no rule found a problem with it, so it is valid.`;
    const hi = `कमरे का किराया ₹${formatRupees(roomCostPerDay)} प्रतिदिन था, जबकि पॉलिसी ₹${formatRupees(roomLimit)} प्रतिदिन तक ही देती है। ${days} दिनों में यह अतिरिक्त राशि ₹${formatRupees(amount)} होती है। यह कटौती पॉलिसी की सीमा के अनुसार है और किसी नियम में इसमें कोई समस्या नहीं मिली, इसलिए यह सही है।`;
    return { en, hi };
  }

  const en = `The room rent excess deduction of ₹${formatRupees(amount)} follows the policy limit and no rule found a problem with it, so it is valid.`;
  const hi = `कमरे के किराए की ₹${formatRupees(amount)} की कटौती पॉलिसी की सीमा के अनुसार है और किसी नियम में इसमें कोई समस्या नहीं मिली, इसलिए यह सही है।`;
  return { en, hi };
}

export function buildUndecidedExplanation(
  amount: number,
  deductionType: string,
  itemDescription?: string | null,
  insurerAskedForMissingDocument?: boolean
): { en: string; hi: string } {
  const typeEn = friendlyDeductionTypeEn(deductionType);
  const typeHi = friendlyDeductionTypeHi(deductionType);

  // This records what the person confirmed. It changes no verdict, because no agreed rule covers it yet.
  let confirmedEn = "";
  let confirmedHi = "";
  if (deductionType === "documentation" && insurerAskedForMissingDocument === true) {
    confirmedEn = " You confirmed that the insurer asked you for the missing document.";
    confirmedHi = " आपने पुष्टि की है कि बीमा कंपनी ने आपसे छूटा हुआ दस्तावेज़ माँगा था।";
  } else if (deductionType === "documentation" && insurerAskedForMissingDocument === false) {
    confirmedEn = " You confirmed that the insurer did not ask you for the missing document.";
    confirmedHi = " आपने पुष्टि की है कि बीमा कंपनी ने आपसे छूटा हुआ दस्तावेज़ नहीं माँगा।";
  }

  if (amount === 0) {
    const descEn = itemDescription ? ` for ${itemDescription}` : "";
    const descHi = itemDescription ? ` (${itemDescription})` : "";
    const en = `The insurer made a deduction under ${typeEn}${descEn}, but the deduction amount was not specified in the documents.${confirmedEn} No specific rule could determine the validity of this deduction based on the available documents, so it is marked as questionable. Further review is recommended. The legal reference for this deduction has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${typeHi} के तहत कटौती की${descHi}, लेकिन दस्तावेज़ों में कटौती की राशि निर्दिष्ट नहीं है।${confirmedHi} उपलब्ध दस्तावेज़ों के आधार पर कोई विशिष्ट नियम इस कटौती की वैधता तय नहीं कर सका, इसलिए इसे संदिग्ध माना गया है। आगे समीक्षा की सलाह दी जाती है। इस कटौती के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  const en = `The insurer deducted ₹${formatRupees(amount)} under ${typeEn}.${confirmedEn} No specific rule could determine the validity of this deduction based on the available documents, so it is marked as questionable. Further review is recommended. The legal reference for this deduction has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${typeHi} के तहत ₹${formatRupees(amount)} काटे।${confirmedHi} उपलब्ध दस्तावेज़ों के आधार पर कोई विशिष्ट नियम इस कटौती की वैधता तय नहीं कर सका, इसलिए इसे संदिग्ध माना गया है। आगे समीक्षा की सलाह दी जाती है। इस कटौती के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

const LEGAL_CHECK_EN = "The legal reference for this rule has not been checked yet.";
const LEGAL_CHECK_HI = "इस नियम का कानूनी संदर्भ अभी जांचा नहीं गया है।";

export function buildR5Explanation(
  amount: number,
  isWrong: boolean,
  insurerAsked: boolean | undefined
): { en: string; hi: string } {
  const rupees = `₹${formatRupees(amount)}`;
  if (isWrong) {
    return {
      en: `The insurer cut ${rupees} citing missing documentation. You confirmed the insurer never asked you for that document, so rule R5 marks this deduction as wrong. ${LEGAL_CHECK_EN}`,
      hi: `बीमा कंपनी ने दस्तावेज़ों की कमी बताकर ${rupees} काटे। आपने पुष्टि की है कि बीमा कंपनी ने आपसे वह दस्तावेज़ कभी नहीं मांगा, इसलिए नियम R5 इस कटौती को गलत मानता है। ${LEGAL_CHECK_HI}`,
    };
  }
  const nextEn =
    insurerAsked === true
      ? "You confirmed the insurer asked for it, so this depends on whether that document can still be provided."
      : "Did the insurer ever ask you for it? Answer in Confirm the facts, as that can change this result.";
  const nextHi =
    insurerAsked === true
      ? "आपने पुष्टि की है कि बीमा कंपनी ने इसे मांगा था, इसलिए यह इस पर निर्भर है कि वह दस्तावेज़ अब दिया जा सकता है या नहीं।"
      : "क्या बीमा कंपनी ने आपसे यह कभी मांगा था? तथ्यों की पुष्टि में इसका उत्तर दें, क्योंकि इससे यह परिणाम बदल सकता है।";
  return {
    en: `The insurer cut ${rupees} citing missing documentation, so rule R5 marks this as questionable. ${nextEn} ${LEGAL_CHECK_EN}`,
    hi: `बीमा कंपनी ने दस्तावेज़ों की कमी बताकर ${rupees} काटे, इसलिए नियम R5 इसे संदेहास्पद मानता है। ${nextHi} ${LEGAL_CHECK_HI}`,
  };
}

export function buildR6Explanation(
  amount: number,
  deductionType: string,
  allowed: number | null,
  limitName: string | null
): { en: string; hi: string } {
  const rupees = `₹${formatRupees(amount)}`;
  const isCopay = deductionType === "copay";
  const typeEn = isCopay ? "co-payment" : `sub-limit${limitName ? ` (${limitName})` : ""}`;
  const typeHi = isCopay ? "को-पेमेंट" : `उप-सीमा${limitName ? ` (${limitName})` : ""}`;
  if (allowed === null) {
    return {
      en: `The insurer cut ${rupees} as ${typeEn}. The documents don't give enough figures to recalculate it, so rule R6 marks this as questionable. Ask the insurer to show its calculation.`,
      hi: `बीमा कंपनी ने ${typeHi} के रूप में ${rupees} काटे। दस्तावेज़ों में इसकी दोबारा गणना के लिए पूरे आंकड़े नहीं हैं, इसलिए नियम R6 इसे संदेहास्पद मानता है। बीमा कंपनी से उसकी गणना दिखाने को कहें।`,
    };
  }
  const allowedRupees = `₹${formatRupees(allowed)}`;
  if (amount <= allowed) {
    return {
      en: `The insurer cut ${rupees} as ${typeEn}. Recalculating from your documents allows up to ${allowedRupees}, so rule R6 found no problem with this amount, and it looks valid.`,
      hi: `बीमा कंपनी ने ${typeHi} के रूप में ${rupees} काटे। आपके दस्तावेज़ों से दोबारा गणना करने पर ${allowedRupees} तक की अनुमति है, इसलिए नियम R6 को इस राशि में कोई समस्या नहीं मिली और यह उचित लगती है।`,
    };
  }
  const excess = `₹${formatRupees(amount - allowed)}`;
  return {
    en: `The insurer cut ${rupees} as ${typeEn}, but recalculating from your documents allows only ${allowedRupees}. That is ${excess} too much, so rule R6 marks this as questionable. Ask the insurer to explain the difference.`,
    hi: `बीमा कंपनी ने ${typeHi} के रूप में ${rupees} काटे, लेकिन आपके दस्तावेज़ों से दोबारा गणना करने पर केवल ${allowedRupees} की अनुमति है। यह ${excess} ज़्यादा है, इसलिए नियम R6 इसे संदेहास्पद मानता है। बीमा कंपनी से इस अंतर का कारण पूछें।`,
  };
}

export function buildR7Sentence(clause: string): { en: string; hi: string } {
  return {
    en: `The insurer cites ${clause}, but we didn't find it in the policy pages we read, so check your policy (rule R7).`,
    hi: `बीमा कंपनी ${clause} का हवाला देती है, लेकिन हमें यह पढ़े गए पॉलिसी पृष्ठों में नहीं मिला, इसलिए अपनी पॉलिसी जांचें (नियम R7)।`,
  };
}
