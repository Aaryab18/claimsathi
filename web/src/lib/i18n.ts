export type Language = "en" | "hi";

export interface Translations {
  appName: string;
  tagline: string;
  sampleCase: string;
  legalDisclaimer: string;
  legalDisclaimerFooter: string;
  recoverableTitle: string;
  questionableTitle: string;
  validTitle: string;
  totalDeductedTitle: string;
  splitBarTitle: string;
  summaryTitle: string;
  summaryText: (total: string, recoverable: string, questionable: string, valid: string) => string;
  patientLabel: string;
  insurerLabel: string;
  hospitalLabel: string;
  policyLabel: string;
  findingsTitle: string;
  findingsSubtitle: string;
  viewEvidenceBtn: string;
  clickToViewEvidence: string;
  closeEvidence: string;
  evidenceTitle: string;
  insurerWordsTitle: string;
  policyClauseTitle: string;
  regulationTitle: string;
  sourceCheckPending: string;
  sourceCheckPendingNotice: string;
  quoteVerificationPending: string;
  deadlinesTitle: string;
  deadlinesSubtitle: string;
  datePending: string;
  deadlineVerificationPending: string;
  verdictLabels: {
    wrong: string;
    questionable: string;
    valid: string;
  };
  loadingMessage: string;
  errorMessage: string;
  retryButton: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "ClaimSathi",
    tagline: "Health Insurance Claim Review",
    sampleCase: "Sample case",
    legalDisclaimer: "Information, not legal advice",
    legalDisclaimerFooter: "ClaimSathi provides automated claim analysis based on coded rules. It is information, not legal advice.",
    recoverableTitle: "Likely recoverable",
    questionableTitle: "Questionable",
    validTitle: "Valid deductions",
    totalDeductedTitle: "Total deducted",
    splitBarTitle: "How your deducted ₹{total} splits:",
    summaryTitle: "What the insurer deducted",
    summaryText: (total, recoverable, questionable, valid) =>
      `Out of ${total} deducted by the insurer, ${recoverable} was likely wrongly denied and can be contested. ${questionable} is questionable and requires itemised billing, while ${valid} was deducted under standard policy room rent limits.`,
    patientLabel: "Patient",
    insurerLabel: "Insurer",
    hospitalLabel: "Hospital",
    policyLabel: "Policy",
    findingsTitle: "Item-by-item breakdown",
    findingsSubtitle: "Review each deduction. Click on any row to inspect insurer citations and legal clauses.",
    viewEvidenceBtn: "View evidence",
    clickToViewEvidence: "Click row for evidence & clauses →",
    closeEvidence: "Close",
    evidenceTitle: "Evidence & policy clauses",
    insurerWordsTitle: "What the insurer wrote in rejection letter",
    policyClauseTitle: "Relevant policy clause",
    regulationTitle: "Regulation & legal reference",
    sourceCheckPending: "Source check pending",
    sourceCheckPendingNotice:
      "Our legal research team is currently verifying the exact regulatory circular for this rule. We do not present unverified clauses as established law.",
    quoteVerificationPending: "Original document quote verification in progress",
    deadlinesTitle: "Important dispute deadlines",
    deadlinesSubtitle: "Key milestones to submit your grievance or approach the ombudsman.",
    datePending: "Date pending",
    deadlineVerificationPending: "Statutory deadline verification by our legal team is in progress.",
    verdictLabels: {
      wrong: "Likely wrongly denied",
      questionable: "Questionable",
      valid: "Valid",
    },
    loadingMessage: "Loading claim analysis...",
    errorMessage: "Could not load claim analysis. Please try again.",
    retryButton: "Try again",
  },
  hi: {
    appName: "ClaimSathi",
    tagline: "स्वास्थ्य बीमा क्लेम समीक्षा",
    sampleCase: "सैंपल केस",
    legalDisclaimer: "सूचना मात्र, कानूनी सलाह नहीं",
    legalDisclaimerFooter: "क्लेमसाथी स्वचालित नियमों के आधार पर क्लेम विश्लेषण प्रदान करता है। यह सूचना मात्र है, कानूनी सलाह नहीं।",
    recoverableTitle: "संभावित रूप से वापसी योग्य",
    questionableTitle: "संदेहास्पद",
    validTitle: "उचित कटौती",
    totalDeductedTitle: "कुल कटौती",
    splitBarTitle: "काटे गए ₹{total} का विवरण:",
    summaryTitle: "बीमा कंपनी ने क्या काटा",
    summaryText: (total, recoverable, questionable, valid) =>
      `बीमा कंपनी द्वारा काटे गए ${total} में से ${recoverable} की कटौती संभावित रूप से गलत है और इसे वापस मांगा जा सकता है। ${questionable} संदेहास्पद है जिसके लिए विस्तृत बिल की आवश्यकता है, जबकि ${valid} कमरे के किराए की सीमा के तहत उचित कटौती है।`,
    patientLabel: "मरीज़",
    insurerLabel: "बीमा कंपनी",
    hospitalLabel: "अस्पताल",
    policyLabel: "पॉलिसी",
    findingsTitle: "मद-वार कटौती विवरण",
    findingsSubtitle: "प्रत्येक कटौती की समीक्षा करें। बीमा कंपनी का कारण और पॉलिसी की धारा देखने के लिए किसी भी पंक्ति पर क्लिक करें।",
    viewEvidenceBtn: "प्रमाण देखें",
    clickToViewEvidence: "प्रमाण देखने के लिए क्लिक करें →",
    closeEvidence: "बंद करें",
    evidenceTitle: "प्रमाण और पॉलिसी की धाराएं",
    insurerWordsTitle: "बीमा कंपनी ने पत्र में क्या लिखा",
    policyClauseTitle: "संबंधित पॉलिसी धारा",
    regulationTitle: "नियम एवं कानूनी संदर्भ",
    sourceCheckPending: "स्रोत सत्यापन बाकी",
    sourceCheckPendingNotice:
      "हमारी कानूनी टीम इस नियम के सटीक विनियामक परिपत्र का सत्यापन कर रही है। असत्यापित नियमों को हम वास्तविक कानून के रूप में प्रस्तुत नहीं करते हैं।",
    quoteVerificationPending: "मूल दस्तावेज़ से उद्धरण का सत्यापन जारी है",
    deadlinesTitle: "महत्वपूर्ण समय-सीमाएं",
    deadlinesSubtitle: "शिकायत दर्ज करने अथवा लोकपाल (ओम्बड्समैन) के पास जाने की प्रमुख समय-सीमाएं।",
    datePending: "तारीख लंबित",
    deadlineVerificationPending: "हमारी कानूनी टीम द्वारा समय-सीमा का सत्यापन जारी है।",
    verdictLabels: {
      wrong: "संभावित रूप से गलत कटौती",
      questionable: "संदेहास्पद",
      valid: "उचित",
    },
    loadingMessage: "क्लेम विश्लेषण लोड हो रहा है...",
    errorMessage: "क्लेम विश्लेषण लोड करने में असमर्थ। कृपया पुन: प्रयास करें।",
    retryButton: "पुन: प्रयास करें",
  },
};
