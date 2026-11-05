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

  // Home screen
  homeHeadline: string;
  homeSubtitle: string;
  demoNotice: string;
  uploadRejectionTitle: string;
  uploadRejectionDesc: string;
  uploadPolicyTitle: string;
  uploadPolicyDesc: string;
  uploadBillTitle: string;
  uploadBillDesc: string;
  chooseFile: string;
  noFileChosen: string;
  fileFormatsHint: string;
  fileTypeError: string;
  fileSizeError: string;
  analyseButton: string;
  analyseDisabledHint: string;
  trySampleTitle: string;
  trySampleButton: string;
  trySampleDesc: string;
  removeFile: string;

  // Progress screen
  progressTitle: string;
  progressSubtitle: string;
  stageQueued: string;
  stageQueuedDesc: string;
  stageReading: string;
  stageReadingDesc: string;
  stageChecking: string;
  stageCheckingDesc: string;
  stageDrafting: string;
  stageDraftingDesc: string;
  stageDone: string;
  stageDoneDesc: string;
  statusActive: string;
  statusCompleted: string;
  statusPending: string;
  failedTitle: string;
  failedMessage: string;
  failedRetry: string;
  backToHome: string;

  // Confirm the facts panel
  confirmFactsTitle: string;
  confirmFactsSubtitle: string;
  previewOnlyNote: string;
  policyStartDateLabel: string;
  continuousCoverDateLabel: string;
  admissionDateLabel: string;
  billItemCategoriesTitle: string;
  billItemCategoriesDesc: string;
  applyCorrectionsBtn: string;
  applyingCorrections: string;
  correctionsSubmittedMsg: string;
  categoryLabels: Record<string, string>;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "ClaimSathi",
    tagline: "Health Insurance Claim Review",
    sampleCase: "Sample case",
    legalDisclaimer: "Information, not legal advice",
    legalDisclaimerFooter:
      "ClaimSathi provides automated claim analysis based on coded rules. It is information, not legal advice.",
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
    findingsSubtitle:
      "Review each deduction. Click on any row to inspect insurer citations and legal clauses.",
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
    quoteVerificationPending:
      "Original document quote verification in progress",
    deadlinesTitle: "Important dispute deadlines",
    deadlinesSubtitle:
      "Key milestones to submit your grievance or approach the ombudsman.",
    datePending: "Date pending",
    deadlineVerificationPending:
      "Statutory deadline verification by our legal team is in progress.",
    verdictLabels: {
      wrong: "Likely wrongly denied",
      questionable: "Questionable",
      valid: "Valid",
    },
    loadingMessage: "Loading claim analysis...",
    errorMessage: "Could not load claim analysis. Please try again.",
    retryButton: "Try again",

    // Home screen
    homeHeadline: "Has your health insurance claim been rejected or cut short?",
    homeSubtitle:
      "Upload your rejection letter, policy, and hospital bill. ClaimSathi reviews each deduction against tested rules to find what you can recover.",
    demoNotice: "This is a demo. Please do not upload real medical documents.",
    uploadRejectionTitle: "1. Rejection letter",
    uploadRejectionDesc: "Insurer's letter or email showing deduction reasons",
    uploadPolicyTitle: "2. Policy document",
    uploadPolicyDesc: "Policy schedule showing coverage dates and room limits",
    uploadBillTitle: "3. Hospital bill",
    uploadBillDesc: "Final detailed bill with itemised charges",
    chooseFile: "Choose file",
    noFileChosen: "No file chosen",
    fileFormatsHint: "PDF, JPG, or PNG up to 10 MB",
    fileTypeError: "Only PDF, JPG, and PNG files are allowed.",
    fileSizeError: "File is larger than the 10 MB limit.",
    analyseButton: "Analyse claim",
    analyseDisabledHint: "Select all three documents above to begin analysis",
    trySampleTitle: "Try it first without uploading",
    trySampleButton: "Try sample case",
    trySampleDesc: "Explore a realistic claim with Suresh Kumar's hospital bill and see the full breakdown.",
    removeFile: "Remove",

    // Progress screen
    progressTitle: "Analysing your claim",
    progressSubtitle: "We are carefully reviewing your documents against insurance rules and guidelines.",
    stageQueued: "Queued",
    stageQueuedDesc: "In line for automated analysis",
    stageReading: "Reading documents",
    stageReadingDesc: "Extracting bill line items and rejection grounds",
    stageChecking: "Checking rules",
    stageCheckingDesc: "Verifying policy terms and IRDAI regulations",
    stageDrafting: "Drafting findings",
    stageDraftingDesc: "Calculating recoverable amounts and drafting explanations",
    stageDone: "Done",
    stageDoneDesc: "Analysis complete",
    statusActive: "In progress",
    statusCompleted: "Completed",
    statusPending: "Waiting",
    failedTitle: "Analysis could not be completed",
    failedMessage:
      "We encountered an issue reading one or more documents. Please check your files and try again.",
    failedRetry: "Try again",
    backToHome: "Back to Home",

    // Confirm the facts panel
    confirmFactsTitle: "Confirm the facts",
    confirmFactsSubtitle:
      "Check the dates and bill item categories read from your documents. If anything is inaccurate, you can correct it below.",
    previewOnlyNote: "Preview only: corrections are not active yet",
    policyStartDateLabel: "Policy start date",
    continuousCoverDateLabel: "Continuous cover date",
    admissionDateLabel: "Admission date",
    billItemCategoriesTitle: "Bill item categories",
    billItemCategoriesDesc: "Verify how each bill item was categorized",
    applyCorrectionsBtn: "Apply corrections",
    applyingCorrections: "Applying...",
    correctionsSubmittedMsg: "Corrections received. (Preview mode: sample calculations remain unchanged).",
    categoryLabels: {
      room: "Room & Nursing",
      pharmacy: "Pharmacy / Medicines",
      consumable: "Consumables",
      implant: "Implants & Devices",
      diagnostic: "Diagnostics / Tests",
      procedure: "Procedures & Surgery",
      admin: "Administrative",
      other: "Other",
    },
  },
  hi: {
    appName: "ClaimSathi",
    tagline: "स्वास्थ्य बीमा क्लेम समीक्षा",
    sampleCase: "सैंपल केस",
    legalDisclaimer: "सूचना मात्र, कानूनी सलाह नहीं",
    legalDisclaimerFooter:
      "क्लेमसाथी स्वचालित नियमों के आधार पर क्लेम विश्लेषण प्रदान करता है। यह सूचना मात्र है, कानूनी सलाह नहीं।",
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
    findingsSubtitle:
      "प्रत्येक कटौती की समीक्षा करें। बीमा कंपनी का कारण और पॉलिसी की धारा देखने के लिए किसी भी पंक्ति पर क्लिक करें।",
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
    quoteVerificationPending:
      "मूल दस्तावेज़ से उद्धरण का सत्यापन जारी है",
    deadlinesTitle: "महत्वपूर्ण समय-सीमाएं",
    deadlinesSubtitle:
      "शिकायत दर्ज करने अथवा लोकपाल (ओम्बड्समैन) के पास जाने की प्रमुख समय-सीमाएं।",
    datePending: "तारीख लंबित",
    deadlineVerificationPending:
      "हमारी कानूनी टीम द्वारा समय-सीमा का सत्यापन जारी है।",
    verdictLabels: {
      wrong: "संभावित रूप से गलत कटौती",
      questionable: "संदेहास्पद",
      valid: "उचित",
    },
    loadingMessage: "क्लेम विश्लेषण लोड हो रहा है...",
    errorMessage: "क्लेम विश्लेषण लोड करने में असमर्थ। कृपया पुन: प्रयास करें।",
    retryButton: "पुन: प्रयास करें",

    // Home screen
    homeHeadline: "क्या आपका हेल्थ इंश्योरेंस क्लेम खारिज या कम कर दिया गया है?",
    homeSubtitle:
      "अपना रिजेक्शन लेटर, पॉलिसी दस्तावेज़ और अस्पताल का बिल अपलोड करें। क्लेमसाथी परीक्षित नियमों के आधार पर जांच करता है कि आप क्या वापस पा सकते हैं।",
    demoNotice: "यह एक डेमो है। कृपया असली मेडिकल दस्तावेज़ अपलोड न करें।",
    uploadRejectionTitle: "1. रिजेक्शन पत्र (अस्वीकृति पत्र)",
    uploadRejectionDesc: "बीमा कंपनी का पत्र जिसमें कटौती का कारण लिखा हो",
    uploadPolicyTitle: "2. पॉलिसी दस्तावेज़",
    uploadPolicyDesc: "पॉलिसी शेड्यूल जिसमें कवर तिथियां और कमरे की सीमा हो",
    uploadBillTitle: "3. अस्पताल का बिल",
    uploadBillDesc: "अस्पताल का विस्तृत (मद-वार) अंतिम बिल",
    chooseFile: "फ़ाइल चुनें",
    noFileChosen: "कोई फ़ाइल नहीं चुनी गई",
    fileFormatsHint: "PDF, JPG या PNG (अधिकतम 10 MB)",
    fileTypeError: "केवल PDF, JPG और PNG फ़ाइलें स्वीकृत हैं।",
    fileSizeError: "फ़ाइल 10 MB की सीमा से अधिक बड़ी है।",
    analyseButton: "क्लेम का विश्लेषण करें",
    analyseDisabledHint: "विश्लेषण शुरू करने के लिए ऊपर तीनों दस्तावेज़ चुनें",
    trySampleTitle: "दस्तावेज़ अपलोड किए बिना आज़माएं",
    trySampleButton: "सैंपल केस देखें",
    trySampleDesc: "सुरेश कुमार के वास्तविक जैसे केस के साथ देखें कि क्लेमसाथी कैसे काम करता है।",
    removeFile: "हटाएं",

    // Progress screen
    progressTitle: "आपके क्लेम का विश्लेषण हो रहा है",
    progressSubtitle: "हम बीमा नियमों और विनियामक दिशानिर्देशों के आधार पर आपके दस्तावेज़ों की जांच कर रहे हैं।",
    stageQueued: "कतार में",
    stageQueuedDesc: "स्वचालित विश्लेषण की प्रतीक्षा में",
    stageReading: "दस्तावेज़ पढ़े जा रहे हैं",
    stageReadingDesc: "बिल की मदें और रिजेक्शन कारण पढ़े जा रहे हैं",
    stageChecking: "नियमों की जांच",
    stageCheckingDesc: "पॉलिसी शर्तों और IRDAI नियमों का सत्यापन",
    stageDrafting: "निष्कर्ष तैयार हो रहे हैं",
    stageDraftingDesc: "वापसी योग्य राशि की गणना और निष्कर्ष तैयार करना",
    stageDone: "पूर्ण",
    stageDoneDesc: "विश्लेषण पूर्ण हुआ",
    statusActive: "प्रक्रिया जारी",
    statusCompleted: "पूर्ण",
    statusPending: "प्रतीक्षारत",
    failedTitle: "विश्लेषण पूरा नहीं हो सका",
    failedMessage:
      "एक या अधिक दस्तावेज़ पढ़े नहीं जा सके। कृपया अपनी फ़ाइलों की जांच करें और पुनः प्रयास करें।",
    failedRetry: "पुनः प्रयास करें",
    backToHome: "होम पर लौटें",

    // Confirm the facts panel
    confirmFactsTitle: "तथ्यों की पुष्टि करें",
    confirmFactsSubtitle:
      "दस्तावेज़ों से प्राप्त तिथियों और बिल मद श्रेणियों की जांच करें। यदि कुछ गलत है, तो नीचे सुधारें।",
    previewOnlyNote: "केवल पूर्वावलोकन: सुधार अभी सक्रिय नहीं हैं",
    policyStartDateLabel: "पॉलिसी प्रारंभ तिथि",
    continuousCoverDateLabel: "निरंतर कवर तिथि",
    admissionDateLabel: "अस्पताल में भर्ती की तिथि",
    billItemCategoriesTitle: "बिल मद श्रेणियां",
    billItemCategoriesDesc: "सत्यापित करें कि प्रत्येक मद को सही श्रेणी दी गई है",
    applyCorrectionsBtn: "सुधार लागू करें",
    applyingCorrections: "लागू किया जा रहा है...",
    correctionsSubmittedMsg: "सुधार दर्ज किए गए। (पूर्वावलोकन मोड: सैंपल गणना अपरिवर्तित है)।",
    categoryLabels: {
      room: "कमरा और नर्सिंग",
      pharmacy: "दवाइयां",
      consumable: "कंज्यूमेबल्स",
      implant: "इम्प्लांट्स व उपकरण",
      diagnostic: "जांच एवं टेस्ट",
      procedure: "प्रक्रिया एवं सर्जरी",
      admin: "प्रशासनिक",
      other: "अन्य",
    },
  },
};
