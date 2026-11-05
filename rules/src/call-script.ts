import type { CaseResult, Finding, LetterLanguage } from "@claimsathi/contracts";
import { LETTER_TEXT } from "./letter-text.js";

interface CallScriptText {
  locale: string;
  placeholder: { policy: string; claim: string; patient: string; date: string; amount: string };
  title: string;
  prepare: string;
  step1: string;
  intro: (policy: string, claim: string, patient: string, admitted: string) => string;
  step2: string;
  disagree: (letterDate: string, approved: string, claimed: string) => string;
  step3: string;
  askPay: (amount: string) => string;
  askExplain: (amount: string) => string;
  askWriting: string;
  step4: string;
  tips: string[];
  safety: string;
  reasons: Record<string, string>;
}

// Said aloud, so shorter than the letters' wording. "?" marks the version for a finding the rules left unclear.
const EN_REASONS: Record<string, string> = {
  R1: "My cover has been continuous for more than 60 months, so the claim can't be questioned for not disclosing something earlier.",
  R2: "The waiting period for this illness had ended before the admission.",
  R3: "Medicines, consumables, implants and tests shouldn't be cut in proportion to the room.",
  "R3-ICU": "ICU charges shouldn't be cut in proportion, because ICUs don't come in different categories.",
  "R3?": "Please tell me if this was cut because of the room category, and under which policy clause.",
  R4: "This item is part of the approved package or procedure, so it shouldn't be cut separately.",
  "R4?": "Please tell me whether this item is part of the package. If it is, it shouldn't be cut separately.",
  R5: "This was cut only for missing documents. When did you ask me for them?",
  R6: "Please show me how this deduction was calculated.",
  R7: "I can't find the clause you cited in my policy. Please tell me where it is.",
  UNDECIDED: "Please tell me the reason for this deduction and the policy clause you rely on.",
};

const SCRIPT_TEXT: Record<LetterLanguage, CallScriptText> = {
  en: {
    locale: "en-IN",
    placeholder: { policy: "[policy number]", claim: "[claim number]", patient: "[patient name]", date: "[date]", amount: "[amount]" },
    title: "WHAT TO SAY ON THE CALL",
    prepare: "Keep your policy, the insurer's letter and a pen in front of you before you call.",
    step1: "1. Say why you are calling",
    intro: (policy, claim, patient, admitted) =>
      `"Hello. I want to register a grievance about a health insurance claim. My policy number is ${policy} and the claim number is ${claim}. The patient is ${patient}, admitted on ${admitted}."`,
    step2: "2. Say what you disagree with",
    disagree: (letterDate, approved, claimed) =>
      `"Your letter dated ${letterDate} approved ${approved} of the ${claimed} claimed. I disagree with these deductions:"`,
    step3: "3. Say what you want",
    askPay: (amount) => `"Please review the claim and pay ${amount}."`,
    askExplain: (amount) => `"Please also explain the ${amount} item by item."`,
    askWriting: `"Please send me your reply in writing."`,
    step4: "4. Before you hang up",
    tips: [
      "- Ask for the complaint reference number and write it down.",
      "- Note the date, and the name of the person you spoke to.",
      "- Ask by when they will reply.",
      "- Then send the written complaint letter too, so there is a record.",
    ],
    safety: "Never share your bank PIN, card details or a payment OTP. A complaint doesn't need them.",
    reasons: EN_REASONS,
  },
  hi: {
    locale: LETTER_TEXT.hi.locale,
    placeholder: { policy: "[पॉलिसी संख्या]", claim: "[क्लेम संख्या]", patient: "[मरीज़ का नाम]", date: "[तारीख]", amount: "[राशि]" },
    title: "कॉल पर क्या कहें",
    prepare: "कॉल करने से पहले अपनी पॉलिसी, बीमा कंपनी का पत्र और एक पेन पास रखें।",
    step1: "1. बताएं कि आप क्यों कॉल कर रहे हैं",
    intro: (policy, claim, patient, admitted) =>
      `"नमस्ते। मैं एक स्वास्थ्य बीमा क्लेम पर शिकायत दर्ज करना चाहता/चाहती हूं। मेरी पॉलिसी संख्या ${policy} है और क्लेम संख्या ${claim} है। मरीज़ ${patient} हैं, जो ${admitted} को भर्ती हुए।"`,
    step2: "2. बताएं कि आप किससे असहमत हैं",
    disagree: (letterDate, approved, claimed) =>
      `"आपके ${letterDate} के पत्र में ${claimed} के दावे में से ${approved} स्वीकृत हुए। मैं इन कटौतियों से असहमत हूं:"`,
    step3: "3. बताएं कि आप क्या चाहते हैं",
    askPay: (amount) => `"कृपया क्लेम की समीक्षा करें और ${amount} का भुगतान करें।"`,
    askExplain: (amount) => `"कृपया ${amount} की राशि को मदवार भी समझाएं।"`,
    askWriting: `"कृपया मुझे लिखित उत्तर भेजें।"`,
    step4: "4. फ़ोन रखने से पहले",
    tips: [
      "- शिकायत संदर्भ संख्या पूछें और लिख लें।",
      "- तारीख और जिससे बात हुई उसका नाम लिख लें।",
      "- पूछें कि वे कब तक उत्तर देंगे।",
      "- फिर लिखित शिकायत पत्र भी भेजें, ताकि रिकॉर्ड रहे।",
    ],
    safety: "अपना बैंक PIN, कार्ड की जानकारी या भुगतान OTP कभी न बताएं। शिकायत के लिए इनकी ज़रूरत नहीं होती।",
    reasons: LETTER_TEXT.hi.reasons,
  },
  kn: {
    locale: LETTER_TEXT.kn.locale,
    placeholder: { policy: "[ಪಾಲಿಸಿ ಸಂಖ್ಯೆ]", claim: "[ಕ್ಲೈಮ್ ಸಂಖ್ಯೆ]", patient: "[ರೋಗಿಯ ಹೆಸರು]", date: "[ದಿನಾಂಕ]", amount: "[ಮೊತ್ತ]" },
    title: "ಕರೆಯಲ್ಲಿ ಏನು ಹೇಳಬೇಕು",
    prepare: "ಕರೆ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಪಾಲಿಸಿ, ವಿಮಾ ಕಂಪನಿಯ ಪತ್ರ ಮತ್ತು ಒಂದು ಪೆನ್ ಹತ್ತಿರ ಇಟ್ಟುಕೊಳ್ಳಿ.",
    step1: "1. ನೀವು ಏಕೆ ಕರೆ ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ಹೇಳಿ",
    intro: (policy, claim, patient, admitted) =>
      `"ನಮಸ್ಕಾರ. ಆರೋಗ್ಯ ವಿಮೆ ಕ್ಲೈಮ್ ಕುರಿತು ದೂರು ದಾಖಲಿಸಲು ಬಯಸುತ್ತೇನೆ. ನನ್ನ ಪಾಲಿಸಿ ಸಂಖ್ಯೆ ${policy}, ಕ್ಲೈಮ್ ಸಂಖ್ಯೆ ${claim}. ರೋಗಿ ${patient}, ${admitted} ರಂದು ದಾಖಲಾದರು."`,
    step2: "2. ನೀವು ಯಾವುದನ್ನು ಒಪ್ಪುವುದಿಲ್ಲ ಎಂದು ಹೇಳಿ",
    disagree: (letterDate, approved, claimed) =>
      `"ನಿಮ್ಮ ${letterDate} ರ ಪತ್ರದಲ್ಲಿ ${claimed} ಕ್ಲೈಮ್‌ನಲ್ಲಿ ${approved} ಅನುಮೋದಿಸಲಾಗಿದೆ. ಈ ಕಡಿತಗಳನ್ನು ನಾನು ಒಪ್ಪುವುದಿಲ್ಲ:"`,
    step3: "3. ನಿಮಗೆ ಏನು ಬೇಕು ಎಂದು ಹೇಳಿ",
    askPay: (amount) => `"ದಯವಿಟ್ಟು ಕ್ಲೈಮ್ ಪರಿಶೀಲಿಸಿ ${amount} ಪಾವತಿಸಿ."`,
    askExplain: (amount) => `"ದಯವಿಟ್ಟು ${amount} ಅನ್ನು ಐಟಂವಾರು ವಿವರಿಸಿ."`,
    askWriting: `"ದಯವಿಟ್ಟು ನನಗೆ ಲಿಖಿತ ಉತ್ತರ ಕಳುಹಿಸಿ."`,
    step4: "4. ಕರೆ ಮುಗಿಸುವ ಮೊದಲು",
    tips: [
      "- ದೂರಿನ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಕೇಳಿ ಬರೆದುಕೊಳ್ಳಿ.",
      "- ದಿನಾಂಕ ಮತ್ತು ನೀವು ಮಾತನಾಡಿದವರ ಹೆಸರು ಬರೆದುಕೊಳ್ಳಿ.",
      "- ಅವರು ಯಾವಾಗ ಉತ್ತರಿಸುತ್ತಾರೆ ಎಂದು ಕೇಳಿ.",
      "- ನಂತರ ದಾಖಲೆಗಾಗಿ ಲಿಖಿತ ದೂರು ಪತ್ರವನ್ನೂ ಕಳುಹಿಸಿ.",
    ],
    safety: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ PIN, ಕಾರ್ಡ್ ವಿವರ ಅಥವಾ ಪಾವತಿ OTP ಯನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ದೂರಿಗೆ ಅವು ಬೇಕಾಗುವುದಿಲ್ಲ.",
    reasons: LETTER_TEXT.kn.reasons,
  },
};

const rupees = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}`;

function spokenDate(date: string | null, text: CallScriptText): string {
  if (!date) return text.placeholder.date;
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(text.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function itemLine(finding: Finding, result: CaseResult, text: CallScriptText): string {
  const names = finding.lineItemIds
    .map((id) => result.extracted.lineItems.find((item) => item.id === id)?.description ?? "?")
    .join(", ");
  const wrong = finding.verdict === "wrong";
  const reasons = finding.ruleIds.flatMap((id) => (wrong ? undefined : text.reasons[`${id}?`]) ?? text.reasons[id] ?? []);
  return `- ${names}: ${rupees(finding.amount)}. ${(reasons.length > 0 ? reasons : [text.reasons.UNDECIDED]).join(" ")}`;
}

// A script the person reads out on their own call. Built from the rules' findings with no AI, like the letters.
export function buildCallScript(result: CaseResult, language: LetterLanguage): string {
  const text = SCRIPT_TEXT[language];
  const { claim, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;
  const disputed = result.findings.filter(({ verdict, amount }) => verdict !== "valid" && amount > 0);

  return [
    text.title,
    text.prepare,
    "",
    text.step1,
    text.intro(
      claim.policyNumber ?? text.placeholder.policy,
      claim.claimId ?? text.placeholder.claim,
      claim.patient.name ?? text.placeholder.patient,
      spokenDate(claim.admissionDate, text),
    ),
    "",
    text.step2,
    text.disagree(
      spokenDate(rejection.letterDate, text),
      claim.amountApproved === null ? text.placeholder.amount : rupees(claim.amountApproved),
      claim.amountClaimed === null ? text.placeholder.amount : rupees(claim.amountClaimed),
    ),
    ...disputed.map((finding) => itemLine(finding, result, text)),
    "",
    text.step3,
    ...(recoverableStrong > 0 ? [text.askPay(rupees(recoverableStrong))] : []),
    ...(questionable > 0 ? [text.askExplain(rupees(questionable))] : []),
    text.askWriting,
    "",
    text.step4,
    ...text.tips,
    "",
    text.safety,
  ].join("\n");
}
