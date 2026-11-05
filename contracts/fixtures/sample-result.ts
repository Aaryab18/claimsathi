import type { CaseResult } from "../src/case-result.js";
import type { Regulation } from "../src/finding.js";
import { sampleExtractedClaim } from "./sample-extracted.js";

// Legal text has not been checked yet, so nothing below cites a real regulation
// or states a real deadline. Member C replaces these after checking the sources.
export const PENDING_VERIFICATION = "Pending verification by Member C";

const pendingRegulation: Regulation = {
  text: PENDING_VERIFICATION,
  sourceName: PENDING_VERIFICATION,
  verified: false,
};

// quoteVerified is false throughout because the sample documents do not exist
// yet, so no quote has been compared with a real document.
export const sampleCaseResult: CaseResult = {
  caseToken: "sample-case",
  extracted: sampleExtractedClaim,
  findings: [
    {
      id: "F1",
      ruleIds: ["R3"],
      lineItemIds: ["L2", "L3"],
      verdict: "wrong",
      confidence: "strong",
      amount: 38200,
      explanationEn:
        "The insurer cut ₹24,133 from the pharmacy bill and ₹14,067 from the stent bill, ₹38,200 in total. It used the same proportion it applied because the room cost more than the policy limit. Medicines and a stent cost the same whichever room the patient stays in, so rule R3 marks this cut as wrong. The legal reference for this rule has not been checked yet.",
      explanationHi:
        "बीमा कंपनी ने दवाइयों के बिल से ₹24,133 और स्टेंट के बिल से ₹14,067, यानी कुल ₹38,200 काटे। यह कटौती उसी अनुपात में की गई, जो कमरे का किराया पॉलिसी की सीमा से ज़्यादा होने के कारण लगाया गया था। मरीज़ किसी भी कमरे में रहे, दवाइयों और स्टेंट की कीमत वही रहती है, इसलिए नियम R3 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।",
      evidence: {
        insurerText:
          "Pharmacy and implant charges are reduced proportionately as the room chosen exceeds the eligible limit.",
        policyClause: "Clause 4.2: Room rent is payable up to Rs. 5,000 per day.",
        regulation: pendingRegulation,
        quoteVerified: false,
      },
    },
    {
      id: "F2",
      ruleIds: ["R4"],
      lineItemIds: ["L4"],
      verdict: "wrong",
      confidence: "strong",
      amount: 12600,
      explanationEn:
        "The insurer refused ₹12,600 of consumables as not payable. The hospital bill shows these consumables as part of the angioplasty package, and the insurer approved that package, so rule R4 marks this deduction as wrong. The legal reference for this rule has not been checked yet.",
      explanationHi:
        "बीमा कंपनी ने ₹12,600 की कंज़्यूमेबल सामग्री को देय नहीं माना। अस्पताल के बिल में यह सामग्री एंजियोप्लास्टी पैकेज का हिस्सा दिखाई गई है, और बीमा कंपनी ने वह पैकेज मंज़ूर किया है, इसलिए नियम R4 इस कटौती को गलत मानता है। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।",
      evidence: {
        insurerText: "Consumables of Rs. 12,600 are not payable under the policy.",
        policyClause: "Clause 7.5: Items listed as non-medical expenses are not payable.",
        regulation: pendingRegulation,
        quoteVerified: false,
      },
    },
    {
      id: "F3",
      ruleIds: ["R1", "R2"],
      lineItemIds: ["L5"],
      verdict: "wrong",
      confidence: "strong",
      amount: 20600,
      explanationEn:
        "The insurer deducted ₹20,600 because it treated hypertension as a pre-existing disease. The policy's waiting period is 48 months, and Suresh Kumar has had continuous cover since March 2019, more than 48 months before this admission. The waiting period had already ended, so rules R1 and R2 mark this deduction as wrong. The legal reference for these rules has not been checked yet.",
      explanationHi:
        "बीमा कंपनी ने हाइपरटेंशन (उच्च रक्तचाप) को पहले से मौजूद बीमारी मानकर ₹20,600 काटे। पॉलिसी में प्रतीक्षा अवधि 48 महीने की है, और सुरेश कुमार का बीमा मार्च 2019 से लगातार चल रहा है, जो इस भर्ती से 48 महीने से भी ज़्यादा पहले की बात है। प्रतीक्षा अवधि पहले ही पूरी हो चुकी थी, इसलिए नियम R1 और R2 इस कटौती को गलत मानते हैं। इन नियमों के कानूनी संदर्भ की जाँच अभी बाकी है।",
      evidence: {
        insurerText: "Charges of Rs. 20,600 relate to hypertension, a pre-existing disease, and are deducted.",
        policyClause: "Clause 5.1: Pre-existing diseases are covered after 48 months of continuous cover.",
        regulation: pendingRegulation,
        quoteVerified: false,
      },
    },
    {
      id: "F4",
      ruleIds: [],
      lineItemIds: ["L1"],
      verdict: "valid",
      confidence: "strong",
      amount: 16800,
      explanationEn:
        "The room cost ₹8,360 a day, but the policy pays up to ₹5,000 a day. Over 5 days the excess is ₹16,800. This deduction follows the policy limit and no rule found a problem with it, so it is valid and cannot be recovered.",
      explanationHi:
        "कमरे का किराया ₹8,360 प्रतिदिन था, जबकि पॉलिसी ₹5,000 प्रतिदिन तक ही देती है। 5 दिनों में यह अतिरिक्त राशि ₹16,800 होती है। यह कटौती पॉलिसी की सीमा के अनुसार है और किसी नियम में इसमें कोई समस्या नहीं मिली, इसलिए यह सही है और यह राशि वापस नहीं मिल सकती।",
      evidence: {
        insurerText: "Room rent exceeds the eligible limit of Rs. 5,000 per day. Excess of Rs. 16,800 is deducted.",
        policyClause: "Clause 4.2: Room rent is payable up to Rs. 5,000 per day.",
        regulation: pendingRegulation,
        quoteVerified: false,
      },
    },
    {
      id: "F5",
      ruleIds: ["R4"],
      lineItemIds: ["L6"],
      verdict: "questionable",
      confidence: "moderate",
      amount: 7800,
      explanationEn:
        "The insurer disallowed ₹7,800 of administration charges without citing a policy clause. The documents do not show clearly what these charges cover or whether they belong to the package, so rule R4 marks this as questionable. It is worth asking the insurer and the hospital for a breakdown. The legal reference for this rule has not been checked yet.",
      explanationHi:
        "बीमा कंपनी ने पॉलिसी की कोई धारा बताए बिना ₹7,800 के प्रशासनिक शुल्क काट दिए। दस्तावेज़ों से साफ़ नहीं होता कि इन शुल्कों में क्या शामिल है या वे पैकेज का हिस्सा हैं या नहीं, इसलिए नियम R4 इसे संदिग्ध मानता है। बीमा कंपनी और अस्पताल से इसका पूरा ब्योरा माँगना उचित रहेगा। इस नियम के कानूनी संदर्भ की जाँच अभी बाकी है।",
      evidence: {
        insurerText: "Administration charges of Rs. 7,800 are disallowed.",
        policyClause: null,
        regulation: pendingRegulation,
        quoteVerified: false,
      },
    },
  ],
  deadlines: [
    {
      label: "Grievance to the insurer",
      date: null,
      explanation:
        "Send a written complaint to the insurer first, as the Ombudsman needs this (Rule 14(3)(a)). We found no fixed legal deadline for it, so send it soon, then enter the date you sent it.",
      explanationHi:
        "पहले बीमा कंपनी को लिखित शिकायत भेजें, क्योंकि लोकपाल के लिए यह ज़रूरी है (नियम 14(3)(a))। हमें इसकी कोई तय कानूनी समय-सीमा नहीं मिली, इसलिए इसे जल्द भेजें और फिर भेजने की तारीख दर्ज करें।",
      verified: false,
    },
    {
      label: "Complaint to the ombudsman",
      date: "2027-10-15",
      explanation:
        "Safest last date: one year from the insurer's letter. The exact year runs from the insurer's reply to your complaint (Rule 14(3)(b)), so going by this date keeps you on the safe side. The Ombudsman can accept a late complaint in some cases (Rule 14(4)), but don't rely on that.",
      explanationHi:
        "सबसे सुरक्षित अंतिम तारीख: बीमा कंपनी के पत्र से एक साल। सटीक एक साल आपकी शिकायत पर बीमा कंपनी के जवाब से गिना जाता है (नियम 14(3)(b)), इसलिए इस तारीख को मानना सुरक्षित है। कुछ मामलों में लोकपाल देरी से की गई शिकायत स्वीकार कर सकता है (नियम 14(4)), पर इस पर निर्भर न रहें।",
      verified: true,
    },
  ],
  totals: {
    totalDeducted: 96000,
    recoverableStrong: 71400,
    questionable: 7800,
    validDeductions: 16800,
  },
  warnings: [],
  resultSource: "saved_sample",
};
