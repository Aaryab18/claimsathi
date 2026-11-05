import { LEGAL_SOURCES } from "@claimsathi/contracts";
import type { Language } from "./i18n";

export type SourceStatus = "verified" | "confirming" | "policy";

interface CatalogRule {
  id: string;
  name: Record<Language, string>;
  check: Record<Language, string>;
  status: SourceStatus;
  source: { name: string; detail: string; url: string } | null;
}

const { masterCircular2024, proportionateCircular2020, standardizationCircular2020, ombudsmanRules } = LEGAL_SOURCES;

export const RULES_CATALOG: CatalogRule[] = [
  {
    id: "R1",
    name: { en: "Moratorium", hi: "मोरेटोरियम", kn: "ಮೊರಟೋರಿಯಂ" },
    check: {
      en: "After 60 months of continuous cover, a claim can't be contested for non-disclosure or misrepresentation, except for established fraud.",
      hi: "60 महीने के लगातार बीमा के बाद, धोखाधड़ी साबित होने के अलावा, जानकारी न देने या गलत जानकारी के आधार पर क्लेम पर सवाल नहीं उठाया जा सकता।",
      kn: "60 ತಿಂಗಳ ನಿರಂತರ ವಿಮೆಯ ನಂತರ, ಸಾಬೀತಾದ ವಂಚನೆ ಹೊರತುಪಡಿಸಿ, ಮಾಹಿತಿ ನೀಡದಿರುವಿಕೆ ಅಥವಾ ತಪ್ಪು ಮಾಹಿತಿಯ ಕಾರಣಕ್ಕೆ ಕ್ಲೈಮ್ ಪ್ರಶ್ನಿಸುವಂತಿಲ್ಲ.",
    },
    status: "verified",
    source: { name: masterCircular2024.name, detail: "Clause 13", url: masterCircular2024.url },
  },
  {
    id: "R2",
    name: { en: "Waiting period", hi: "प्रतीक्षा अवधि", kn: "ಕಾಯುವ ಅವಧಿ" },
    check: {
      en: "Compares your cover date and hospital admission with the waiting period in your own policy.",
      hi: "आपके बीमा की तारीख और भर्ती की तुलना आपकी पॉलिसी की प्रतीक्षा अवधि से करता है।",
      kn: "ನಿಮ್ಮ ವಿಮೆಯ ದಿನಾಂಕ ಮತ್ತು ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿಯನ್ನು ನಿಮ್ಮ ಪಾಲಿಸಿಯ ಕಾಯುವ ಅವಧಿಯೊಂದಿಗೆ ಹೋಲಿಸುತ್ತದೆ.",
    },
    status: "policy",
    source: null,
  },
  {
    id: "R3",
    name: { en: "Proportionate deduction", hi: "अनुपातिक कटौती", kn: "ಅನುಪಾತದ ಕಡಿತ" },
    check: {
      en: "Pharmacy, consumables, implants, diagnostics and ICU charges shouldn't be cut because of the room chosen.",
      hi: "चुने गए कमरे के कारण दवाइयों, कंज्यूमेबल्स, इम्प्लांट, जांच और ICU शुल्क में कटौती नहीं होनी चाहिए।",
      kn: "ಆಯ್ಕೆ ಮಾಡಿದ ಕೊಠಡಿಯ ಕಾರಣಕ್ಕೆ ಔಷಧಿ, ಕನ್ಸ್ಯೂಮಬಲ್, ಇಂಪ್ಲಾಂಟ್, ಪರೀಕ್ಷೆ ಮತ್ತು ICU ಶುಲ್ಕ ಕಡಿತ ಮಾಡಬಾರದು.",
    },
    status: "confirming",
    source: { name: proportionateCircular2020.name, detail: "Paragraphs 4, 5 and 7", url: proportionateCircular2020.url },
  },
  {
    id: "R4",
    name: { en: "Items inside a package", hi: "पैकेज में शामिल मदें", kn: "ಪ್ಯಾಕೇಜ್‌ನಲ್ಲಿರುವ ಐಟಂಗಳು" },
    check: {
      en: "An item that belongs to a procedure or package shouldn't be cut separately.",
      hi: "जो मद किसी प्रक्रिया या पैकेज का हिस्सा है, उसे अलग से नहीं काटा जाना चाहिए।",
      kn: "ಪ್ರಕ್ರಿಯೆ ಅಥವಾ ಪ್ಯಾಕೇಜ್‌ನ ಭಾಗವಾದ ಐಟಂ ಅನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಕಡಿತ ಮಾಡಬಾರದು.",
    },
    status: "confirming",
    source: { name: standardizationCircular2020.name, detail: "Lists II to IV", url: standardizationCircular2020.url },
  },
  {
    id: "R5",
    name: { en: "Missing documents", hi: "दस्तावेज़ों की कमी", kn: "ದಾಖಲೆಗಳ ಕೊರತೆ" },
    check: {
      en: "Insurers and TPAs collect required documents from hospitals. We ask whether the insurer ever asked you.",
      hi: "बीमा कंपनियां और TPA ज़रूरी दस्तावेज़ अस्पतालों से लेते हैं। हम पूछते हैं कि क्या बीमा कंपनी ने आपसे कभी मांगा था।",
      kn: "ವಿಮಾ ಕಂಪನಿಗಳು ಮತ್ತು TPA ಗಳು ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಆಸ್ಪತ್ರೆಗಳಿಂದ ಪಡೆಯುತ್ತವೆ. ವಿಮಾ ಕಂಪನಿ ನಿಮ್ಮಿಂದ ಕೇಳಿತ್ತೇ ಎಂದು ನಾವು ಕೇಳುತ್ತೇವೆ.",
    },
    status: "verified",
    source: { name: masterCircular2024.name, detail: "Clause 17(c)", url: masterCircular2024.url },
  },
  {
    id: "R6",
    name: { en: "Co-pay and sub-limit sums", hi: "को-पे और उप-सीमा की गणना", kn: "ಕೋ-ಪೇ ಮತ್ತು ಉಪ-ಮಿತಿ ಲೆಕ್ಕ" },
    check: {
      en: "Recalculates co-pay and sub-limits from your policy's own figures, and states any excess.",
      hi: "आपकी पॉलिसी के आंकड़ों से को-पे और उप-सीमा की दोबारा गणना करके अतिरिक्त राशि बताता है।",
      kn: "ನಿಮ್ಮ ಪಾಲಿಸಿಯ ಅಂಕಿಗಳಿಂದ ಕೋ-ಪೇ ಮತ್ತು ಉಪ-ಮಿತಿಗಳನ್ನು ಮರುಲೆಕ್ಕಿಸಿ ಹೆಚ್ಚುವರಿ ಮೊತ್ತವನ್ನು ತಿಳಿಸುತ್ತದೆ.",
    },
    status: "policy",
    source: null,
  },
  {
    id: "R7",
    name: { en: "Cited clause", hi: "उद्धृत धारा", kn: "ಉಲ್ಲೇಖಿತ ಷರತ್ತು" },
    check: {
      en: "A partial rejection must refer to specific policy terms. We flag a cited clause we can't find in your policy.",
      hi: "आंशिक अस्वीकृति में पॉलिसी की विशेष शर्तों का उल्लेख ज़रूरी है। जो धारा पॉलिसी में न मिले, उसे हम चिह्नित करते हैं।",
      kn: "ಭಾಗಶಃ ತಿರಸ್ಕಾರದಲ್ಲಿ ಪಾಲಿಸಿಯ ನಿರ್ದಿಷ್ಟ ಷರತ್ತುಗಳ ಉಲ್ಲೇಖ ಇರಬೇಕು. ಪಾಲಿಸಿಯಲ್ಲಿ ಸಿಗದ ಷರತ್ತನ್ನು ನಾವು ಗುರುತಿಸುತ್ತೇವೆ.",
    },
    status: "verified",
    source: { name: masterCircular2024.name, detail: "Clause 17(b)", url: masterCircular2024.url },
  },
  {
    id: "R8",
    name: { en: "Deadlines", hi: "समय-सीमाएं", kn: "ಗಡುವುಗಳು" },
    check: {
      en: "Complain to the insurer first, then go to the Ombudsman within one year.",
      hi: "पहले बीमा कंपनी से शिकायत करें, फिर एक साल के भीतर लोकपाल के पास जाएं।",
      kn: "ಮೊದಲು ವಿಮಾ ಕಂಪನಿಗೆ ದೂರು ನೀಡಿ, ನಂತರ ಒಂದು ವರ್ಷದೊಳಗೆ ಒಂಬುಡ್ಸ್‌ಮನ್ ಬಳಿ ಹೋಗಿ.",
    },
    status: "verified",
    source: { name: ombudsmanRules.name, detail: "Rule 14(3) and 14(4)", url: ombudsmanRules.url },
  },
];
