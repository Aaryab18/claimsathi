import { kn } from "./i18n-kn";

export type Language = "en" | "hi" | "kn";

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
  quoteSampleNotChecked: string;
  deadlinesTitle: string;
  deadlinesSubtitle: string;
  datePending: string;
  deadlineVerificationPending: string;
  deadlineGrievanceLabel: string;
  deadlineOmbudsmanLabel: string;
  statusLabel: string;
  verdictLabels: {
    wrong: string;
    questionable: string;
    valid: string;
  };
  loadingMessage: string;
  serverWakingMessage: string;
  offlineCopyNotice: string;
  errorMessage: string;
  retryButton: string;

  // Home screen
  homeHeadline: string;
  homeSubtitle: string;
  demoNotice: string;
  journeyTitle: string;
  progressCount: (done: number, total: number) => string;
  progressResult: string;
  progressFacts: string;
  progressLetter: string;
  progressCall: string;
  progressSent: string;
  progressGo: string;
  progressDone: string;
  progressToDo: string;
  progressEscalate: string;
  progressEscalateDated: (date: string) => string;
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
  quoteVerified: string;
  warningsTitle: string;
  claimFlow: (claimed: string, approved: string) => string;
  correctionChanged: (from: string, to: string) => string;
  correctionNoChange: (amount: string) => string;
  sectionNavLabel: string;
  navBreakdown: string;
  navNextSteps: string;
  navFacts: string;
  navDeadlines: string;
  navLetters: string;
  navContact: string;
  contactTitle: string;
  contactSubtitle: string;
  contactStepCall: string;
  contactMatched: (name: string) => string;
  contactNotListed: (insurer: string | null) => string;
  contactChosen: (name: string) => string;
  contactChooseLabel: string;
  contactChooseNone: string;
  contactCallNow: string;
  contactTollFree: string;
  contactCallCharges: string;
  contactOfficialPage: string;
  contactOnlineForm: string;
  contactCheckedOn: (date: string) => string;
  contactNoAiNote: string;
  contactStepScript: string;
  contactScriptDesc: string;
  contactShowScript: string;
  contactLoading: string;
  contactStepAfter: string;
  contactReferenceLabel: string;
  contactReferenceHelp: string;
  contactSentDateHint: string;
  contactStepWriting: string;
  contactWritingDesc: string;
  contactEmailLetter: (email: string) => string;
  contactEmailSubject: (claimId: string | null) => string;
  contactEmailCopied: string;
  contactOpenLetters: string;
  contactStepEscalate: string;
  contactEscalateDesc: string;
  contactBimaBharosa: string;
  contactIrdaiCall: string;
  contactOmbudsmanOnline: string;
  contactOmbudsmanWhen: string;
  orWord: string;
  nextStepsTitle: string;
  stepCheckTitle: string;
  stepCheckDetail: string;
  stepCheckLink: string;
  stepSendTitle: string;
  stepSendDetail: string;
  stepSendLink: string;
  stepWaitTitle: string;
  stepWaitDetail: string;
  stepWaitDetailDated: (date: string) => string;
  stepEscalateTitle: string;
  stepEscalateDetail: string;
  stepEscalateDetailDated: (date: string) => string;
  stepEscalateLink: string;
  listenButton: string;
  stopListening: string;
  shareWhatsApp: string;
  letterCopyButton: string;
  letterCopied: string;
  letterCopyError: string;
  homeTagline: string;
  howItWorksTitle: string;
  howStepReadTitle: string;
  howStepReadDesc: string;
  howStepJudgeTitle: string;
  howStepJudgeDesc: string;
  howStepActTitle: string;
  howStepActDesc: string;
  verifiedLabel: string;
  ombudsmanFinderLabel: string;
  ombudsmanChooseState: string;
  ombudsmanOffice: (city: string) => string;
  ombudsmanContactLink: string;
  ombudsmanChooseDistrict: string;
  ombudsmanOtherDistrict: string;
  instantPreview: string;
  orUploadYourOwn: string;
  uploadDocumentsTitle: string;
  amountClaimedLabel: string;
  deductedLabel: string;
  billedLabel: string;
  sourceLabel: string;
  noRegulationCited: string;
  dropFileHere: string;
  fileChosenLabel: string;
  filesChosen: (count: number) => string;
  chartMoneyTitle: string;
  chartMoneyNote: (total: string) => string;
  chartApproved: string;
  chartDeductionsTitle: string;
  chartDeductionsNote: string;
  timelineTitle: string;
  timelineNote: string;
  timelineCoverStart: string;
  timelineWaitingEnds: (months: number) => string;
  timelineMoratorium: string;
  timelineAdmission: string;
  printReport: string;
  confidenceLabels: Record<"strong" | "moderate" | "weak", string>;
  navOverview: string;
  navEvidence: string;
  navPlan: string;
  navRules: string;
  rulesTitle: string;
  rulesSubtitle: string;
  rulesStatusNote: string;
  readOfficialSource: string;
  sourceStatus: Record<"verified" | "confirming" | "policy", string>;
  evidencePageSubtitle: string;
  noInsurerWords: string;
  noPolicyClause: string;
  letterLanguageLabel: string;
  letterLanguageNote: string;
  lettersTitle: string;
  lettersDesc: string;
  letterGrievanceButton: string;
  letterOmbudsmanButton: string;
  letterEditNote: string;
  letterPrintButton: string;
  letterError: string;
  addToCalendar: string;
  liveReadingNotice: string;
  grievanceSentLabel: string;
  askedForDocumentLabel: string;
  askedYes: string;
  askedNo: string;
  askedNotSure: string;
  sampleDocumentsIntro: string;
  totalSizeError: string;
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
  correctionsAppliedMsg: string;
  categoryLabels: Record<string, string>;

  // Case strength and the helpdesk dashboard
  caseTextInEnglishNote: string;
  collapseLabel: string;
  expandLabel: string;
  strengthTitle: string;
  strengthNote: string;
  strengthBands: Record<"strong" | "fair" | "limited", string>;
  strengthHow: string;
  strengthHowDetail: string;
  navHelpdesk: string;
  helpdeskTitle: string;
  helpdeskSubtitle: string;
  helpdeskPrivacy: string;
  helpdeskDemoBanner: string;
  helpdeskLoadDemo: string;
  helpdeskClear: string;
  helpdeskEmptyTitle: string;
  helpdeskEmptyDesc: string;
  helpdeskKpiCases: string;
  helpdeskKpiDeducted: string;
  helpdeskKpiRecoverable: string;
  helpdeskKpiOpen: string;
  helpdeskByInsurerTitle: string;
  helpdeskByStatusTitle: string;
  helpdeskTableTitle: string;
  helpdeskColCase: string;
  helpdeskColLastDate: string;
  helpdeskColStatus: string;
  helpdeskOpen: string;
  helpdeskUnknownInsurer: string;
  helpdeskStatuses: Record<"new" | "complained" | "ombudsman" | "resolved", string>;
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
      `Out of ${total} deducted by the insurer, ${recoverable} was likely wrongly denied and can be contested. ${questionable} is questionable and needs a closer look, while ${valid} looks like a valid deduction.`,
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
      "We are still checking the official source for this rule. We do not present unverified clauses as established law.",
    quoteVerificationPending:
      "We could not check this quote against the file, for example because it is a photo. Compare it with your document.",
    quoteSampleNotChecked:
      "This is the saved sample case, so there is no file to check this quote against. Upload the sample documents to see the check.",
    deadlinesTitle: "Important dispute deadlines",
    deadlinesSubtitle:
      "Key milestones to submit your grievance or approach the ombudsman.",
    datePending: "Date pending",
    deadlineVerificationPending:
      "We are still checking the official source for this deadline.",
    deadlineGrievanceLabel: "Grievance to the insurer",
    deadlineOmbudsmanLabel: "Complaint to the ombudsman",
    statusLabel: "Status:",
    verdictLabels: {
      wrong: "Likely wrongly denied",
      questionable: "Questionable",
      valid: "Valid",
    },
    loadingMessage: "Loading claim analysis...",
    serverWakingMessage: "Starting the server, this can take up to a minute",
    offlineCopyNotice: "Offline copy: corrections are unavailable",
    errorMessage: "Could not load claim analysis. Please try again.",
    retryButton: "Try again",

    // Home screen
    homeHeadline: "Has your health insurance claim been rejected or cut short?",
    homeSubtitle:
      "Upload your rejection letter, policy, and hospital bill. ClaimSathi reviews each deduction against tested rules to find what you can recover.",
    demoNotice: "This is a demo. Please don't upload real medical documents. Use the made-up sample documents further down this page instead.",
    journeyTitle: "Your progress",
    progressCount: (done, total) => `${done} of ${total} done`,
    progressResult: "See what was cut and why",
    progressFacts: "Check the facts the AI read",
    progressLetter: "Draft your complaint letter",
    progressCall: "Call the insurer and note the reference number",
    progressSent: "Send the complaint and enter the date",
    progressGo: "Do this",
    progressDone: "done",
    progressToDo: "to do",
    progressEscalate: "If the insurer doesn't fix it, you can go to the Insurance Ombudsman.",
    progressEscalateDated: (date) => `If the insurer doesn't fix it, you can go to the Insurance Ombudsman, by ${date} to be safe.`,
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
    liveReadingNotice:
      "Your files are sent to Google's Gemini AI to be read, and are deleted from our database within 24 hours. The AI can misread, so check the facts on the result page.",
    quoteVerified: "We found this exact quote in your document.",
    warningsTitle: "Please check these before relying on this result:",
    claimFlow: (claimed, approved) => `You claimed ${claimed}. The insurer approved ${approved}.`,
    correctionChanged: (from, to) => `Your correction changed the likely recoverable amount from ${from} to ${to}.`,
    correctionNoChange: (amount) => `Your correction was saved. The likely recoverable amount stays at ${amount}.`,
    sectionNavLabel: "Jump to a section",
    navBreakdown: "Breakdown",
    navNextSteps: "What to do",
    navFacts: "Check facts",
    navDeadlines: "Deadlines",
    navLetters: "Letters",
    navContact: "Contact insurer",
    contactTitle: "Contact your insurer",
    contactSubtitle: "Call the insurer yourself with a script made from your case, then send the complaint in writing so there's a record.",
    contactStepCall: "1. Call the insurer's grievance line",
    contactMatched: (name) => `Your letter is from ${name}. This is the number on its official grievance page.`,
    contactNotListed: (insurer) =>
      `${insurer ? `We haven't confirmed the grievance number for ${insurer}` : "We couldn't tell which insurer this is"}, so we don't show one. If it's one of the insurers below, choose it. Otherwise use the customer care number printed on your policy document or the insurer's letter, or complain to IRDAI using step 5.`,
    contactChosen: (name) => `You chose ${name}. This is the number on its official grievance page. Check it matches the insurer on your letter.`,
    contactChooseLabel: "Is your insurer one of these?",
    contactChooseNone: "My insurer isn't listed",
    contactCallNow: "Call",
    contactTollFree: "Toll-free.",
    contactCallCharges: "Normal call charges may apply.",
    contactOfficialPage: "Insurer's grievance page",
    contactOnlineForm: "Insurer's online complaint form",
    contactCheckedOn: (date) => `Read on the insurer's own page on ${date}. Numbers can change, so compare it with your policy document.`,
    contactNoAiNote: "ClaimSathi doesn't call anyone for you. You make the call, so you stay in control of what's said.",
    contactStepScript: "2. What to say on the call",
    contactScriptDesc: "A short script made from your case's findings, with no AI. Read it out, in the language you're comfortable with.",
    contactShowScript: "Show what to say",
    contactLoading: "Preparing...",
    contactStepAfter: "3. After the call",
    contactReferenceLabel: "Complaint reference number the insurer gave you",
    contactReferenceHelp: "Saved only in this browser. It's added to your Ombudsman complaint.",
    contactSentDateHint: "Enter the date you complained on Check facts, so your deadlines update:",
    contactStepWriting: "4. Send it in writing",
    contactWritingDesc: "A call alone leaves no proof. Email the complaint letter, or use the insurer's online form.",
    contactEmailLetter: (email) => `Email the complaint to ${email}`,
    contactEmailSubject: (claimId) => `Grievance about claim ${claimId ?? ""}`.trim(),
    contactEmailCopied: "Your email app should open with the letter. It's also copied, so paste it if the email is empty. Fill in the [square brackets] before sending.",
    contactOpenLetters: "Open the letters to edit or print",
    contactStepEscalate: "5. If the insurer doesn't fix it",
    contactEscalateDesc: "If the insurer doesn't reply, or you're not happy with the reply, complain to IRDAI, the insurance regulator, and then to the Insurance Ombudsman.",
    contactBimaBharosa: "Register a complaint on IRDAI's Bima Bharosa portal",
    contactIrdaiCall: "IRDAI call centre, toll-free:",
    contactOmbudsmanOnline: "Complain to the Insurance Ombudsman online",
    contactOmbudsmanWhen: "The Ombudsman needs your written complaint to the insurer first. Use the Ombudsman complaint on the Letters page.",
    orWord: "or",
    nextStepsTitle: "What to do next",
    stepCheckTitle: "Check the facts",
    stepCheckDetail: "Make sure the dates and amounts match your documents. A wrong date can change the result.",
    stepCheckLink: "Check the facts",
    stepSendTitle: "Send a complaint to the insurer",
    stepSendDetail: "The Ombudsman needs you to complain to the insurer first. We draft the letter for you.",
    stepSendLink: "Draft the complaint",
    stepWaitTitle: "Wait for a reply",
    stepWaitDetail: "Allow about one month. Enter the date you sent it, and we'll work out your dates.",
    stepWaitDetailDated: (date) => `If there is no reply by about ${date}, you can go to the Ombudsman.`,
    stepEscalateTitle: "Go to the Insurance Ombudsman if needed",
    stepEscalateDetail: "If the insurer rejects your complaint or doesn't reply, you generally have one year.",
    stepEscalateDetailDated: (date) => `If the insurer rejects your complaint or doesn't reply, your last date is about ${date}.`,
    stepEscalateLink: "Draft the Ombudsman complaint",
    listenButton: "Listen to this",
    stopListening: "Stop",
    shareWhatsApp: "Share on WhatsApp",
    letterCopyButton: "Copy text",
    letterCopied: "Copied",
    letterCopyError: "The text could not be copied. Please select it and copy it yourself.",
    homeTagline: "The AI reads, the rules judge",
    howItWorksTitle: "How ClaimSathi works",
    howStepReadTitle: "AI reads your documents",
    howStepReadDesc: "It copies the facts. Anything unclear stays unknown, and you can correct it.",
    howStepJudgeTitle: "Fixed rules check each cut",
    howStepJudgeDesc: "Every deduction is marked likely wrong, questionable or valid, with the reason.",
    howStepActTitle: "You get a plan and letters",
    howStepActDesc: "Draft complaints, deadlines and calendar reminders, in a few clicks.",
    verifiedLabel: "Verified",
    ombudsmanFinderLabel: "Find your Ombudsman office",
    ombudsmanChooseState: "Choose your state or territory",
    ombudsmanOffice: (city) => `Insurance Ombudsman, ${city}`,
    ombudsmanContactLink: "Get the address and contact details",
    ombudsmanChooseDistrict: "Choose your district or area",
    ombudsmanOtherDistrict: "Another district in Haryana",
    instantPreview: "Instant preview",
    orUploadYourOwn: "Or upload your own",
    uploadDocumentsTitle: "Upload your documents",
    amountClaimedLabel: "Amount claimed",
    deductedLabel: "Deducted",
    billedLabel: "Billed",
    sourceLabel: "Source",
    noRegulationCited: "This check relies on your policy's own wording, so it cites no outside regulation.",
    dropFileHere: "or drop it here",
    fileChosenLabel: "File chosen",
    filesChosen: (count) => `${count} of 3 files chosen`,
    chartMoneyTitle: "Where your claim went",
    chartMoneyNote: (total) => `Every rupee of ${total}, from what was paid to what can be challenged.`,
    chartApproved: "Approved by the insurer",
    chartDeductionsTitle: "Biggest cuts first",
    chartDeductionsNote: "Each deduction, by size and verdict.",
    timelineTitle: "Your cover against the hospital stay",
    timelineNote: "The longer you've been covered without a break, the more protection you have.",
    timelineCoverStart: "Continuous cover began",
    timelineWaitingEnds: (months) => `Waiting period of ${months} months ends`,
    timelineMoratorium: "60 months of cover",
    timelineAdmission: "Hospital admission",
    printReport: "Print or save report",
    confidenceLabels: { strong: "Strong grounds", moderate: "Moderate grounds", weak: "Weak grounds" },
    navOverview: "Overview",
    navEvidence: "Evidence",
    navPlan: "Your plan",
    navRules: "Rules and sources",
    rulesTitle: "Rules and sources",
    rulesSubtitle: "Every rule ClaimSathi uses, what it checks, and the official source behind it.",
    rulesStatusNote: "IRDAI's May 2024 Master Circular replaced some older circulars, and its list isn't in the published PDF we read. So we show those 2020 sources, but can't yet say they still apply.",
    readOfficialSource: "Read the official source",
    sourceStatus: { verified: "Official source checked", confirming: "Official source found, still confirming it applies", policy: "Uses your policy's own wording" },
    evidencePageSubtitle: "For each deduction: what the insurer said, what your policy says, and the official source.",
    noInsurerWords: "The insurer's letter doesn't give a specific reason for this item.",
    noPolicyClause: "No policy clause was matched to this item.",
    letterLanguageLabel: "Language of the letter",
    letterLanguageNote: "Quotes and legal references stay as written. Many insurers and Ombudsman offices work in English, so check which they accept.",
    lettersTitle: "Your appeal letters",
    lettersDesc: "Drafts written from the findings above. Send the complaint to the insurer first, then go to the Ombudsman if needed. This is information, not legal advice.",
    letterGrievanceButton: "Draft complaint to insurer",
    letterOmbudsmanButton: "Draft Ombudsman complaint",
    letterEditNote: "Fill in the parts in [square brackets], check every fact, and edit it as you like.",
    letterPrintButton: "Print or save as PDF",
    letterError: "The letter could not be created. Please try again.",
    addToCalendar: "Add dates to my calendar",
    grievanceSentLabel: "Date you sent your complaint to the insurer",
    askedForDocumentLabel: "Did the insurer ever ask you for the missing document?",
    askedYes: "Yes",
    askedNo: "No",
    askedNotSure: "Not sure",
    sampleDocumentsIntro: "No documents to hand? Download our made-up ones:",
    totalSizeError: "The three files together must be 14 MB or smaller.",
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
    correctionsAppliedMsg: "Corrections applied. Totals and findings updated from the rules engine.",
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

    caseTextInEnglishNote: "This case's explanations and deadline notes are in English for now. Letters are available in Kannada.",
    collapseLabel: "Collapse",
    expandLabel: "Expand",
    strengthTitle: "How strong is your case?",
    strengthNote: "This score summarises the strength of the rule-based grounds. It is NOT a prediction of winning your complaint: the insurer or Ombudsman decides.",
    strengthBands: { strong: "Strong case", fair: "Worth pursuing", limited: "Limited grounds" },
    strengthHow: "How this is worked out",
    strengthHowDetail: "For each rupee deducted: likely wrong with strong grounds counts 100%, moderate 70%, weak 40%, questionable 25%, and valid 0%. These weights are our own judgement, not data from past cases.",
    navHelpdesk: "For hospitals and NGOs",
    helpdeskTitle: "Helpdesk dashboard",
    helpdeskSubtitle: "Hospital help desks and NGOs can see many patients' claims and deadlines in one place.",
    helpdeskPrivacy: "This list stays only in this browser, and no patient names are saved.",
    helpdeskDemoBanner: "Demo data: these cases and insurers are made up.",
    helpdeskLoadDemo: "Load demo cases",
    helpdeskClear: "Clear this list",
    helpdeskEmptyTitle: "No cases yet",
    helpdeskEmptyDesc: "Claims you analyse in this browser appear here. Or load some made-up cases to see how it works.",
    helpdeskKpiCases: "Cases",
    helpdeskKpiDeducted: "Total deducted",
    helpdeskKpiRecoverable: "Likely recoverable",
    helpdeskKpiOpen: "Open cases",
    helpdeskByInsurerTitle: "Likely recoverable by insurer",
    helpdeskByStatusTitle: "Where cases stand",
    helpdeskTableTitle: "Cases, nearest deadline first",
    helpdeskColCase: "Case",
    helpdeskColLastDate: "Ombudsman last date",
    helpdeskColStatus: "Status",
    helpdeskOpen: "Open case",
    helpdeskUnknownInsurer: "Insurer unknown",
    helpdeskStatuses: { new: "Not started", complained: "Complaint sent", ombudsman: "With Ombudsman", resolved: "Resolved" },
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
      `बीमा कंपनी द्वारा काटे गए ${total} में से ${recoverable} की कटौती संभावित रूप से गलत है और इसे वापस मांगा जा सकता है। ${questionable} संदेहास्पद है और इसकी बारीकी से जांच ज़रूरी है, जबकि ${valid} उचित कटौती लगती है।`,
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
      "हम अभी भी इस नियम के आधिकारिक स्रोत की जांच कर रहे हैं। असत्यापित नियमों को हम वास्तविक कानून के रूप में प्रस्तुत नहीं करते हैं।",
    quoteVerificationPending:
      "हम इस उद्धरण को फ़ाइल से नहीं जांच सके, उदाहरण के लिए क्योंकि यह एक फ़ोटो है। इसे अपने दस्तावेज़ से मिलाएं।",
    quoteSampleNotChecked:
      "यह सहेजा गया नमूना केस है, इसलिए इस उद्धरण को जांचने के लिए कोई फ़ाइल नहीं है। जांच देखने के लिए नमूना दस्तावेज़ अपलोड करें।",
    deadlinesTitle: "महत्वपूर्ण समय-सीमाएं",
    deadlinesSubtitle:
      "शिकायत दर्ज करने अथवा लोकपाल (ओम्बड्समैन) के पास जाने की प्रमुख समय-सीमाएं।",
    datePending: "तारीख लंबित",
    deadlineVerificationPending:
      "हम अभी भी इस समय-सीमा के आधिकारिक स्रोत की जांच कर रहे हैं।",
    deadlineGrievanceLabel: "बीमा कंपनी को शिकायत",
    deadlineOmbudsmanLabel: "लोकपाल (ओम्बड्समैन) को शिकायत",
    statusLabel: "स्थिति:",
    verdictLabels: {
      wrong: "संभावित रूप से गलत कटौती",
      questionable: "संदेहास्पद",
      valid: "उचित",
    },
    loadingMessage: "क्लेम विश्लेषण लोड हो रहा है...",
    serverWakingMessage: "सर्वर शुरू हो रहा है, इसमें एक मिनट तक का समय लग सकता है",
    offlineCopyNotice: "ऑफ़लाइन प्रति: सुधार अनुपलब्ध हैं",
    errorMessage: "क्लेम विश्लेषण लोड करने में असमर्थ। कृपया पुन: प्रयास करें।",
    retryButton: "पुन: प्रयास करें",

    // Home screen
    homeHeadline: "क्या आपका हेल्थ इंश्योरेंस क्लेम खारिज या कम कर दिया गया है?",
    homeSubtitle:
      "अपना रिजेक्शन लेटर, पॉलिसी दस्तावेज़ और अस्पताल का बिल अपलोड करें। क्लेमसाथी परीक्षित नियमों के आधार पर जांच करता है कि आप क्या वापस पा सकते हैं।",
    demoNotice: "यह एक डेमो है। कृपया असली मेडिकल दस्तावेज़ अपलोड न करें। इसके बजाय इसी पेज पर नीचे दिए गए बनावटी नमूना दस्तावेज़ इस्तेमाल करें।",
    journeyTitle: "आपकी प्रगति",
    progressCount: (done, total) => `${total} में से ${done} पूरे`,
    progressResult: "देखें कि क्या कटा और क्यों",
    progressFacts: "AI द्वारा पढ़े गए तथ्य जांचें",
    progressLetter: "अपना शिकायत पत्र तैयार करें",
    progressCall: "बीमा कंपनी को कॉल करें और संदर्भ संख्या लिखें",
    progressSent: "शिकायत भेजें और तारीख दर्ज करें",
    progressGo: "यह करें",
    progressDone: "पूरा",
    progressToDo: "बाकी",
    progressEscalate: "अगर बीमा कंपनी हल न करे, तो आप बीमा लोकपाल के पास जा सकते हैं।",
    progressEscalateDated: (date) => `अगर बीमा कंपनी हल न करे, तो आप बीमा लोकपाल के पास जा सकते हैं, सुरक्षित रहने के लिए ${date} तक।`,
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
    liveReadingNotice:
      "आपकी फ़ाइलें पढ़ने के लिए Google के Gemini AI को भेजी जाती हैं, और 24 घंटे के भीतर हमारे डेटाबेस से हटा दी जाती हैं। AI से पढ़ने में गलती हो सकती है, इसलिए परिणाम पेज पर तथ्यों की जांच करें।",
    quoteVerified: "हमें यह सटीक उद्धरण आपके दस्तावेज़ में मिला।",
    warningsTitle: "इस परिणाम पर भरोसा करने से पहले इन्हें जांच लें:",
    claimFlow: (claimed, approved) => `आपने ${claimed} का दावा किया। बीमा कंपनी ने ${approved} स्वीकृत किए।`,
    correctionChanged: (from, to) => `आपके सुधार से संभावित वापसी योग्य राशि ${from} से बदलकर ${to} हो गई।`,
    correctionNoChange: (amount) => `आपका सुधार सहेज लिया गया। संभावित वापसी योग्य राशि ${amount} ही है।`,
    sectionNavLabel: "किसी भाग पर जाएं",
    navBreakdown: "विवरण",
    navNextSteps: "क्या करें",
    navFacts: "तथ्य जांचें",
    navDeadlines: "समय-सीमाएं",
    navLetters: "पत्र",
    navContact: "बीमा कंपनी से संपर्क",
    contactTitle: "अपनी बीमा कंपनी से संपर्क करें",
    contactSubtitle: "अपने केस से बनी स्क्रिप्ट के साथ खुद बीमा कंपनी को कॉल करें, फिर रिकॉर्ड के लिए शिकायत लिखित में भी भेजें।",
    contactStepCall: "1. बीमा कंपनी की शिकायत लाइन पर कॉल करें",
    contactMatched: (name) => `आपका पत्र ${name} का है। यह नंबर उसके आधिकारिक शिकायत पेज पर दिया गया है।`,
    contactNotListed: (insurer) =>
      `${insurer ? `हमने ${insurer} का शिकायत नंबर पक्का नहीं किया है` : "हम पता नहीं लगा सके कि यह कौन सी बीमा कंपनी है"}, इसलिए हम कोई नंबर नहीं दिखाते। अगर यह नीचे दी गई कंपनियों में से है, तो उसे चुनें। नहीं तो अपनी पॉलिसी या बीमा कंपनी के पत्र पर छपा कस्टमर केयर नंबर इस्तेमाल करें, या चरण 5 से IRDAI को शिकायत करें।`,
    contactChosen: (name) => `आपने ${name} चुना। यह नंबर उसके आधिकारिक शिकायत पेज पर दिया गया है। जांच लें कि यह आपके पत्र वाली बीमा कंपनी ही है।`,
    contactChooseLabel: "क्या आपकी बीमा कंपनी इनमें से है?",
    contactChooseNone: "मेरी बीमा कंपनी सूची में नहीं है",
    contactCallNow: "कॉल करें",
    contactTollFree: "टोल-फ़्री।",
    contactCallCharges: "सामान्य कॉल शुल्क लग सकता है।",
    contactOfficialPage: "बीमा कंपनी का शिकायत पेज",
    contactOnlineForm: "बीमा कंपनी का ऑनलाइन शिकायत फ़ॉर्म",
    contactCheckedOn: (date) => `${date} को बीमा कंपनी के अपने पेज पर पढ़ा गया। नंबर बदल सकते हैं, इसलिए अपनी पॉलिसी से मिला लें।`,
    contactNoAiNote: "क्लेमसाथी आपकी ओर से किसी को कॉल नहीं करता। कॉल आप करते हैं, इसलिए क्या कहा जाए यह आपके हाथ में रहता है।",
    contactStepScript: "2. कॉल पर क्या कहें",
    contactScriptDesc: "आपके केस के निष्कर्षों से, बिना AI के, बनी छोटी स्क्रिप्ट। जिस भाषा में सहज हों, उसमें पढ़ें।",
    contactShowScript: "क्या कहना है, दिखाएं",
    contactLoading: "तैयार हो रहा है...",
    contactStepAfter: "3. कॉल के बाद",
    contactReferenceLabel: "बीमा कंपनी से मिली शिकायत संदर्भ संख्या",
    contactReferenceHelp: "केवल इस ब्राउज़र में सहेजा जाता है। यह आपकी लोकपाल शिकायत में जुड़ जाता है।",
    contactSentDateHint: "शिकायत की तारीख 'तथ्य जांचें' में दर्ज करें, ताकि आपकी समय-सीमाएं अपडेट हों:",
    contactStepWriting: "4. लिखित में भेजें",
    contactWritingDesc: "केवल कॉल का कोई सबूत नहीं रहता। शिकायत पत्र ईमेल करें, या बीमा कंपनी का ऑनलाइन फ़ॉर्म इस्तेमाल करें।",
    contactEmailLetter: (email) => `शिकायत ${email} पर ईमेल करें`,
    contactEmailSubject: (claimId) => `क्लेम ${claimId ?? ""} पर शिकायत`,
    contactEmailCopied: "आपका ईमेल ऐप पत्र के साथ खुलना चाहिए। पत्र कॉपी भी हो गया है, ईमेल खाली हो तो पेस्ट करें। भेजने से पहले [वर्ग कोष्ठक] भरें।",
    contactOpenLetters: "बदलने या प्रिंट करने के लिए पत्र खोलें",
    contactStepEscalate: "5. अगर बीमा कंपनी हल न करे",
    contactEscalateDesc: "अगर बीमा कंपनी उत्तर न दे, या उत्तर से आप संतुष्ट न हों, तो बीमा नियामक IRDAI से और फिर बीमा लोकपाल से शिकायत करें।",
    contactBimaBharosa: "IRDAI के बीमा भरोसा पोर्टल पर शिकायत दर्ज करें",
    contactIrdaiCall: "IRDAI कॉल सेंटर, टोल-फ़्री:",
    contactOmbudsmanOnline: "बीमा लोकपाल को ऑनलाइन शिकायत करें",
    contactOmbudsmanWhen: "लोकपाल के लिए पहले बीमा कंपनी को लिखित शिकायत ज़रूरी है। 'पत्र' पेज पर लोकपाल शिकायत इस्तेमाल करें।",
    orWord: "या",
    nextStepsTitle: "आगे क्या करें",
    stepCheckTitle: "तथ्य जांचें",
    stepCheckDetail: "देख लें कि तारीखें और राशियां आपके दस्तावेज़ों से मेल खाती हैं। एक गलत तारीख से परिणाम बदल सकता है।",
    stepCheckLink: "तथ्य जांचें",
    stepSendTitle: "बीमा कंपनी को शिकायत भेजें",
    stepSendDetail: "लोकपाल के पास जाने से पहले बीमा कंपनी से शिकायत करना ज़रूरी है। हम आपके लिए पत्र का मसौदा बनाते हैं।",
    stepSendLink: "शिकायत का मसौदा बनाएं",
    stepWaitTitle: "जवाब का इंतज़ार करें",
    stepWaitDetail: "लगभग एक महीना दें। भेजने की तारीख दर्ज करें, और हम आपकी तारीखें निकाल देंगे।",
    stepWaitDetailDated: (date) => `अगर लगभग ${date} तक जवाब न मिले, तो आप लोकपाल के पास जा सकते हैं।`,
    stepEscalateTitle: "ज़रूरत हो तो बीमा लोकपाल के पास जाएं",
    stepEscalateDetail: "अगर बीमा कंपनी शिकायत ठुकरा दे या जवाब न दे, तो आम तौर पर आपके पास एक साल होता है।",
    stepEscalateDetailDated: (date) => `अगर बीमा कंपनी शिकायत ठुकरा दे या जवाब न दे, तो आपकी अंतिम तारीख लगभग ${date} है।`,
    stepEscalateLink: "लोकपाल शिकायत का मसौदा बनाएं",
    listenButton: "सुनें",
    stopListening: "रोकें",
    shareWhatsApp: "WhatsApp पर भेजें",
    letterCopyButton: "टेक्स्ट कॉपी करें",
    letterCopied: "कॉपी हो गया",
    letterCopyError: "टेक्स्ट कॉपी नहीं हो सका। कृपया इसे चुनकर खुद कॉपी करें।",
    homeTagline: "AI पढ़ता है, नियम फैसला करते हैं",
    howItWorksTitle: "क्लेमसाथी कैसे काम करता है",
    howStepReadTitle: "AI आपके दस्तावेज़ पढ़ता है",
    howStepReadDesc: "यह तथ्य उतारता है। जो साफ़ न हो वह अज्ञात रहता है, और आप उसे सुधार सकते हैं।",
    howStepJudgeTitle: "जांचे-परखे नियम हर कटौती देखते हैं",
    howStepJudgeDesc: "हर कटौती को कारण सहित संभावित गलत, संदेहास्पद या उचित बताया जाता है।",
    howStepActTitle: "आपको योजना और पत्र मिलते हैं",
    howStepActDesc: "शिकायत के मसौदे, समय-सीमाएं और कैलेंडर रिमाइंडर, कुछ ही क्लिक में।",
    verifiedLabel: "सत्यापित",
    ombudsmanFinderLabel: "अपना लोकपाल कार्यालय खोजें",
    ombudsmanChooseState: "अपना राज्य या केंद्र शासित प्रदेश चुनें",
    ombudsmanOffice: (city) => `बीमा लोकपाल, ${city}`,
    ombudsmanContactLink: "पता और संपर्क विवरण देखें",
    ombudsmanChooseDistrict: "अपना ज़िला या क्षेत्र चुनें",
    ombudsmanOtherDistrict: "हरियाणा का कोई अन्य ज़िला",
    instantPreview: "तुरंत देखें",
    orUploadYourOwn: "या अपने दस्तावेज़ अपलोड करें",
    uploadDocumentsTitle: "अपने दस्तावेज़ अपलोड करें",
    amountClaimedLabel: "दावा राशि",
    deductedLabel: "कटौती",
    billedLabel: "बिल राशि",
    sourceLabel: "स्रोत",
    noRegulationCited: "यह जांच आपकी पॉलिसी की शर्तों पर आधारित है, इसलिए इसमें कोई बाहरी नियम उद्धृत नहीं है।",
    dropFileHere: "या यहां खींचकर छोड़ें",
    fileChosenLabel: "फ़ाइल चुनी गई",
    filesChosen: (count) => `3 में से ${count} फ़ाइलें चुनी गईं`,
    chartMoneyTitle: "आपके क्लेम का हिसाब",
    chartMoneyNote: (total) => `${total} का पूरा हिसाब, जो मिला उससे लेकर जिसे चुनौती दी जा सकती है।`,
    chartApproved: "बीमा कंपनी द्वारा स्वीकृत",
    chartDeductionsTitle: "सबसे बड़ी कटौतियां पहले",
    chartDeductionsNote: "हर कटौती, राशि और निर्णय के साथ।",
    timelineTitle: "अस्पताल में भर्ती के मुकाबले आपका बीमा",
    timelineNote: "बिना रुकावट बीमा जितना लंबा हो, आपको उतनी ज़्यादा सुरक्षा मिलती है।",
    timelineCoverStart: "लगातार बीमा शुरू हुआ",
    timelineWaitingEnds: (months) => `${months} महीने की प्रतीक्षा अवधि पूरी होती है`,
    timelineMoratorium: "60 महीने का बीमा",
    timelineAdmission: "अस्पताल में भर्ती",
    printReport: "रिपोर्ट प्रिंट करें या सहेजें",
    confidenceLabels: { strong: "मज़बूत आधार", moderate: "मध्यम आधार", weak: "कमज़ोर आधार" },
    navOverview: "सारांश",
    navEvidence: "प्रमाण",
    navPlan: "आपकी योजना",
    navRules: "नियम और स्रोत",
    rulesTitle: "नियम और स्रोत",
    rulesSubtitle: "क्लेमसाथी के सभी नियम, वे क्या जांचते हैं, और उनके पीछे का आधिकारिक स्रोत।",
    rulesStatusNote: "IRDAI के मई 2024 के मास्टर परिपत्र ने कुछ पुराने परिपत्र बदल दिए, और उनकी सूची हमारे पढ़े गए प्रकाशित PDF में नहीं है। इसलिए हम 2020 के वे स्रोत दिखाते हैं, पर अभी नहीं कह सकते कि वे लागू हैं।",
    readOfficialSource: "आधिकारिक स्रोत पढ़ें",
    sourceStatus: { verified: "आधिकारिक स्रोत जांचा गया", confirming: "आधिकारिक स्रोत मिला, लागू होने की पुष्टि जारी", policy: "आपकी पॉलिसी की शर्तों पर आधारित" },
    evidencePageSubtitle: "हर कटौती के लिए: बीमा कंपनी ने क्या कहा, आपकी पॉलिसी क्या कहती है, और आधिकारिक स्रोत।",
    noInsurerWords: "बीमा कंपनी के पत्र में इस मद का कोई विशेष कारण नहीं है।",
    noPolicyClause: "इस मद से कोई पॉलिसी धारा नहीं मिली।",
    letterLanguageLabel: "पत्र की भाषा",
    letterLanguageNote: "उद्धरण और कानूनी संदर्भ जैसे लिखे हैं वैसे ही रहते हैं। कई बीमा कंपनियां और लोकपाल कार्यालय अंग्रेज़ी में काम करते हैं, इसलिए पता कर लें कि वे क्या स्वीकार करते हैं।",
    lettersTitle: "आपके अपील पत्र",
    lettersDesc: "ऊपर के निष्कर्षों से बने मसौदे। पहले बीमा कंपनी को शिकायत भेजें, फिर ज़रूरत हो तो लोकपाल के पास जाएं। यह जानकारी है, कानूनी सलाह नहीं।",
    letterGrievanceButton: "बीमा कंपनी को शिकायत का मसौदा",
    letterOmbudsmanButton: "लोकपाल शिकायत का मसौदा",
    letterEditNote: "[वर्ग कोष्ठक] वाले हिस्से भरें, हर तथ्य जांचें और चाहें तो बदलें।",
    letterPrintButton: "प्रिंट करें या PDF में सहेजें",
    letterError: "पत्र नहीं बन सका। कृपया फिर से प्रयास करें।",
    addToCalendar: "तारीखें मेरे कैलेंडर में जोड़ें",
    grievanceSentLabel: "बीमा कंपनी को शिकायत भेजने की तारीख",
    askedForDocumentLabel: "क्या बीमा कंपनी ने आपसे छूटा हुआ दस्तावेज़ कभी मांगा था?",
    askedYes: "हां",
    askedNo: "नहीं",
    askedNotSure: "पता नहीं",
    sampleDocumentsIntro: "दस्तावेज़ पास नहीं हैं? हमारे काल्पनिक दस्तावेज़ डाउनलोड करें:",
    totalSizeError: "तीनों फ़ाइलें मिलाकर 14 MB या उससे कम होनी चाहिए।",
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
    correctionsAppliedMsg: "सुधार लागू हो गए। कुल राशि और निष्कर्ष अपडेट हो गए हैं।",
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

    caseTextInEnglishNote: "इस केस की व्याख्याएं हिंदी में हैं।",
    collapseLabel: "छिपाएं",
    expandLabel: "देखें",
    strengthTitle: "आपका केस कितना मज़बूत है?",
    strengthNote: "यह अंक नियमों पर आधारित आधारों की मज़बूती का सार है। यह आपकी शिकायत जीतने की भविष्यवाणी नहीं है: निर्णय बीमा कंपनी या लोकपाल करते हैं।",
    strengthBands: { strong: "मज़बूत केस", fair: "आगे बढ़ने योग्य", limited: "सीमित आधार" },
    strengthHow: "इसकी गणना कैसे होती है",
    strengthHowDetail: "काटे गए हर रुपये के लिए: मज़बूत आधार वाली गलत कटौती 100%, मध्यम 70%, कमज़ोर 40%, संदेहास्पद 25% और उचित 0%। ये भार हमारा अपना आकलन हैं, पिछले मामलों का डेटा नहीं।",
    navHelpdesk: "अस्पतालों और NGO के लिए",
    helpdeskTitle: "हेल्पडेस्क डैशबोर्ड",
    helpdeskSubtitle: "अस्पताल हेल्पडेस्क और NGO कई मरीज़ों के क्लेम और समय-सीमाएं एक जगह देख सकते हैं।",
    helpdeskPrivacy: "यह सूची केवल इसी ब्राउज़र में रहती है, और मरीज़ों के नाम सहेजे नहीं जाते।",
    helpdeskDemoBanner: "डेमो डेटा: ये केस और बीमा कंपनियां काल्पनिक हैं।",
    helpdeskLoadDemo: "डेमो केस लोड करें",
    helpdeskClear: "यह सूची मिटाएं",
    helpdeskEmptyTitle: "अभी कोई केस नहीं",
    helpdeskEmptyDesc: "इस ब्राउज़र में विश्लेषण किए गए क्लेम यहां दिखेंगे। या काल्पनिक केस लोड करके देखें।",
    helpdeskKpiCases: "केस",
    helpdeskKpiDeducted: "कुल कटौती",
    helpdeskKpiRecoverable: "संभावित वापसी योग्य",
    helpdeskKpiOpen: "खुले केस",
    helpdeskByInsurerTitle: "बीमा कंपनी के अनुसार संभावित वापसी योग्य",
    helpdeskByStatusTitle: "केस कहां हैं",
    helpdeskTableTitle: "केस, सबसे नज़दीकी समय-सीमा पहले",
    helpdeskColCase: "केस",
    helpdeskColLastDate: "लोकपाल की अंतिम तिथि",
    helpdeskColStatus: "स्थिति",
    helpdeskOpen: "केस खोलें",
    helpdeskUnknownInsurer: "बीमा कंपनी अज्ञात",
    helpdeskStatuses: { new: "शुरू नहीं", complained: "शिकायत भेजी", ombudsman: "लोकपाल के पास", resolved: "सुलझ गया" },
  },
  kn,
};
