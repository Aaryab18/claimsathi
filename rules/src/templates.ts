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

export function buildR3Explanation(
  items: LineItem[],
  totalAmount: number
): { en: string; hi: string } {
  if (items.length > 1) {
    const enParts = items.map((i) => `₹${formatRupees(i.deducted ?? 0)} from the ${i.category ?? "item"} bill`);
    const enBreakdown = enParts.slice(0, -1).join(", ") + " and " + enParts[enParts.length - 1];

    const hiParts = items.map((i) => {
      const cat = i.category === "pharmacy" ? "दवाइयों" : i.category === "implant" ? "स्टेंट" : i.category ?? "मद";
      return `${cat} के बिल से ₹${formatRupees(i.deducted ?? 0)}`;
    });
    const hiBreakdown = hiParts.slice(0, -1).join(", ") + " और " + hiParts[hiParts.length - 1];

    const en = `The insurer cut ${enBreakdown}, ₹${formatRupees(totalAmount)} in total. It used the same proportion it applied because the room cost more than the policy limit. Medicines and a stent cost the same whichever room the patient stays in, so rule R3 marks this cut as wrong. The legal reference for this rule has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${hiBreakdown}, यानी कुल ₹${formatRupees(totalAmount)} काटे। यह कटौती उसी अनुपात में की गई, जो कमरे का किराया पॉलिसी की सीमा से ज़्यादा होने के कारण लगाया गया था। मरीज़ किसी भी कमरे में रहे, दवाइयों और स्टेंट की कीमत वही रहती है, इसलिए नियम R3 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  const item = items[0]!;
  const amount = item.deducted ?? 0;
  const categoryEn = item.category ?? "item";
  const categoryHi = item.category === "pharmacy" ? "दवाइयों" : item.category === "implant" ? "स्टेंट" : "सामग्री";

  const en = `The insurer cut ₹${formatRupees(amount)} from the ${categoryEn} bill. It used the same proportion it applied because the room cost more than the policy limit. Medicines, consumables, implants and diagnostic tests cost the same whichever room the patient stays in, so rule R3 marks this cut as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${categoryHi} के बिल से ₹${formatRupees(amount)} काटे। यह कटौती उसी अनुपात में की गई, जो कमरे का किराया पॉलिसी की सीमा से ज़्यादा होने के कारण लगाया गया था। कमरे की श्रेणी बदलने से इन वस्तुओं की कीमत नहीं बदलती, इसलिए नियम R3 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildR4WrongExplanation(
  amount: number,
  packageName: string | null
): { en: string; hi: string } {
  const pkgEn = packageName ? `${packageName} package` : "package";
  const pkgHi = packageName ? `${packageName} पैकेज` : "पैकेज";

  const en = `The insurer refused ₹${formatRupees(amount)} of consumables as not payable. The hospital bill shows these consumables as part of the ${pkgEn}, and the insurer approved that package, so rule R4 marks this deduction as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ₹${formatRupees(amount)} की कंज़्यूमेबल सामग्री को देय नहीं माना। अस्पताल के बिल में यह सामग्री ${pkgHi} का हिस्सा दिखाई गई है, और बीमा कंपनी ने वह पैकेज मंज़ूर किया है, इसलिए नियम R4 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildR4QuestionableExplanation(
  amount: number,
  category: string | null
): { en: string; hi: string } {
  const descEn = category === "admin" ? "administration charges" : "items marked as non-payable";
  const descHi = category === "admin" ? "प्रशासनिक शुल्क" : "गैर-देय मदों";

  const en = `The insurer disallowed ₹${formatRupees(amount)} of ${descEn} without citing a policy clause. The documents do not show clearly what these charges cover or whether they belong to the package, so rule R4 marks this as questionable. It is worth asking the insurer and the hospital for a breakdown. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने पॉलिसी की कोई धारा बताए बिना ₹${formatRupees(amount)} के ${descHi} काट दिए। दस्तावेज़ों से साफ़ नहीं होता कि इन शुल्कों में क्या शामिल है या वे पैकेज का हिस्सा हैं या नहीं, इसलिए नियम R4 इसे संदिग्ध मानता है। बीमा कंपनी और अस्पताल से इसका पूरा ब्योरा माँगना उचित रहेगा। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildPedExplanation(options: {
  amount: number;
  conditionName: string;
  patientName: string;
  waitingMonths: number | null;
  coverStartDate: string | null;
  ruleIds: string[];
}): { en: string; hi: string } {
  const { amount, conditionName, patientName, waitingMonths, coverStartDate, ruleIds } = options;
  const isR1 = ruleIds.includes("R1");
  const isR2 = ruleIds.includes("R2");

  const formattedDate = coverStartDate ? formatMonthYear(coverStartDate) : { en: "the start", hi: "शुरुआत" };
  const rulesTextEn = isR1 && isR2 ? "rules R1 and R2 mark" : isR1 ? "rule R1 marks" : "rule R2 marks";
  const rulesTextHi = isR1 && isR2 ? "नियम R1 और R2 इस कटौती को गलत मानते हैं" : isR1 ? "नियम R1 इस कटौती को गलत मानता है" : "नियम R2 इस कटौती को गलत मानता है";

  if (isR1 && isR2 && waitingMonths) {
    const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionName} as a pre-existing disease. The policy's waiting period is ${waitingMonths} months, and ${patientName} has had continuous cover since ${formattedDate.en}, more than ${waitingMonths} months before this admission. The waiting period had already ended, so ${rulesTextEn} this deduction as wrong. The legal reference for these rules has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${conditionName} (उच्च रक्तचाप) को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। पॉलिसी में प्रतीक्षा अवधि ${waitingMonths} महीने की है, और ${patientName} का बीमा ${formattedDate.hi} से लगातार चल रहा है, जो इस भर्ती से ${waitingMonths} महीने से भी ज़्यादा पहले की बात है। प्रतीक्षा अवधि पहले ही पूरी हो चुकी थी, इसलिए ${rulesTextHi}। इन नियमों के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  if (isR1) {
    const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionName} as a pre-existing disease. Continuous cover at admission is 60 months or more, so ${rulesTextEn} this deduction as wrong under the moratorium principle. The legal reference for this rule has not been checked yet.`;
    const hi = `बीमा कंपनी ने ${conditionName} को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। भर्ती के समय निरंतर बीमा 60 महीने या उससे अधिक का हो चुका है, इसलिए ${rulesTextHi}। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
    return { en, hi };
  }

  const waitStr = waitingMonths ? `${waitingMonths} months` : "the waiting period";
  const waitStrHi = waitingMonths ? `${waitingMonths} महीने` : "प्रतीक्षा अवधि";
  const en = `The insurer deducted ₹${formatRupees(amount)} because it treated ${conditionName} as a pre-existing disease. The policy's waiting period is ${waitStr}, and had ended before this admission, so ${rulesTextEn} this deduction as wrong. The legal reference for this rule has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${conditionName} को पहले से मौजूद बीमारी मानकर ₹${formatRupees(amount)} काटे। पॉलिसी की ${waitStrHi} की प्रतीक्षा अवधि इस भर्ती से पहले ही समाप्त हो चुकी थी, इसलिए ${rulesTextHi}। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।`;
  return { en, hi };
}

export function buildRoomRentValidExplanation(
  amount: number,
  roomLimit: number | null,
  roomCostPerDay?: number | null,
  days?: number | null
): { en: string; hi: string } {
  if (roomCostPerDay && roomLimit && days) {
    const en = `The room cost ₹${formatRupees(roomCostPerDay)} a day, but the policy pays up to ₹${formatRupees(roomLimit)} a day. Over ${days} days the excess is ₹${formatRupees(amount)}. This deduction follows the policy limit and no rule found a problem with it, so it is valid and cannot be recovered.`;
    const hi = `कमरे का किराया ₹${formatRupees(roomCostPerDay)} प्रतिदिन था, जबकि पॉलिसी ₹${formatRupees(roomLimit)} प्रतिदिन तक ही देती है। ${days} दिनों में यह अतिरिक्त राशि ₹${formatRupees(amount)} होती है। यह कटौती पॉलिसी की सीमा के अनुसार है और किसी नियम में इसमें कोई समस्या नहीं मिली, इसलिए यह सही है और यह राशि वापस नहीं मिल सकती।`;
    return { en, hi };
  }

  const en = `The room rent excess deduction of ₹${formatRupees(amount)} follows the policy limit and no rule found a problem with it, so it is valid and cannot be recovered.`;
  const hi = `कमरे के किराए की ₹${formatRupees(amount)} की कटौती पॉलिसी की सीमा के अनुसार है और किसी नियम में इसमें कोई समस्या नहीं मिली, इसलिए यह सही है और यह राशि वापस नहीं मिल सकती।`;
  return { en, hi };
}

export function buildUndecidedExplanation(
  amount: number,
  deductionType: string
): { en: string; hi: string } {
  const en = `The insurer deducted ₹${formatRupees(amount)} under ${deductionType}. No specific rule could determine the validity of this deduction based on the available documents, so it is marked as questionable. Further review is recommended. The legal reference for this deduction has not been checked yet.`;
  const hi = `बीमा कंपनी ने ${deductionType} के तहत ₹${formatRupees(amount)} काटे। उपलब्ध दस्तावेज़ों के आधार पर कोई विशिष्ट नियम इस कटौती की वैधता तय नहीं कर सका, इसलिए इसे संदिग्ध माना गया है। आगे समीक्षा की सलाह दी जाती है।`;
  return { en, hi };
}
