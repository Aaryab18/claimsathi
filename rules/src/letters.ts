import type { CaseResult, Finding, LetterLanguage, LetterType } from "@claimsathi/contracts";
import { buildCallScript } from "./call-script.js";
import { LETTER_TEXT, type LetterText } from "./letter-text.js";

const rupees = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}`;
const PENDING_SOURCE = /pending verification/i;

function formatDate(date: string | null): string {
  if (!date) return "[date]";
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const name = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return name;
}

function itemNames(finding: Finding, result: CaseResult): string {
  return finding.lineItemIds
    .map((id) => result.extracted.lineItems.find((item) => item.id === id)?.description ?? "A bill item")
    .join(", ");
}

// The explanations talk to the patient about the insurer, but a letter talks to the insurer.
function inLetterVoice(explanation: string): string {
  return explanation
    .replace(/\s*The legal reference for (this rule|these rules|this deduction) has not been checked yet\./, "")
    .replace(/\s*IRDAI's 2020 circular supports this, and we are confirming it still applies\./, "")
    .replace(/\s*Did the insurer ever ask you for it\? Answer in Confirm the facts, as that can change this result\./, " Please show me when you asked for it.")
    .replace(/You confirmed the insurer never asked you for that document/, "You never asked me for that document")
    .replace(/You confirmed the insurer asked for it, so this depends on whether that document can still be provided\./, "I ask you to tell me how that document can still be accepted.")
    .replace(/No specific rule could determine the validity of this deduction based on the available documents, so it is marked as questionable\. Further review is recommended\./, "Please explain this deduction, with the policy clause you rely on.")
    .replace(/It is worth asking the insurer and the hospital for a breakdown\./, "Please give me a breakdown.")
    .replace(/Ask the insurer to show its calculation\./, "Please show me your calculation.")
    .replace(/Ask the insurer to explain the difference\./, "Please explain the difference.")
    .replace(/The insurer cites ([^,]+), but we didn't find it in the policy pages we read, so check your policy \(rule R7\)\./, "You cite $1, but I could not find it in my policy. Please show me where it appears.")
    .replace(/,? so rules? R\d+(?: and R\d+)? (?:marks?) (this (?:cut|deduction)|this) as wrong/g, (_, what) => `, so I believe ${what === "this" ? "this deduction" : what} is wrong`)
    .replace(/,? so rules? R\d+(?: and R\d+)? (?:marks?) (?:this (?:cut|deduction)|this) as questionable/g, ", so I ask you to explain it")
    .replace(/\bThe insurer\b/g, "You")
    .replace(/\bthe insurer\b/g, "you")
    .replace(/\bIt reduced\b/g, "You reduced")
    .replace(/\bbecause it\b/g, "because you")
    .replace(/₹/g, "Rs. ");
}

// Only what the rules decided goes in. A reference that hasn't been checked is marked, never stated as settled law.
function disputedItems(result: CaseResult): string[] {
  const disputed = result.findings.filter(({ verdict, amount }) => verdict !== "valid" && amount > 0);
  return disputed.map((finding, index) => {
    const lines = [
      `${index + 1}. ${itemNames(finding, result)}: ${rupees(finding.amount)} (${
        finding.verdict === "wrong" ? "I believe this was wrongly deducted" : "I ask for a clear explanation"
      })`,
      `   ${inLetterVoice(finding.explanationEn)}`,
    ];
    const { insurerText, policyClause, regulation } = finding.evidence;
    if (insurerText) lines.push(`   Your letter says: "${insurerText.replace(/\s+/g, " ")}"`);
    if (policyClause) lines.push(`   Policy wording: ${policyClause}`);
    if (regulation && !PENDING_SOURCE.test(regulation.sourceName)) {
      lines.push(`   Reference: ${regulation.sourceName}${regulation.verified ? "" : " [check this reference before sending]"}`);
    }
    return lines.join("\n");
  });
}

function grievanceLetter(result: CaseResult, today: string, insurerEmail?: string): string {
  const { claim, policy, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;

  return [
    `Date: ${formatDate(today)}`,
    "",
    "To: The Grievance Redressal Officer",
    claim.insurer ?? "[Insurer name]",
    insurerEmail ?? "[Insurer address or grievance email]",
    "",
    `Subject: Grievance against the decision on claim ${claim.claimId ?? "[claim number]"}, policy ${claim.policyNumber ?? "[policy number]"}`,
    "",
    "Dear Sir or Madam,",
    "",
    `I write about the claim for ${claim.patient.name ?? "[patient name]"}, who was admitted on ${formatDate(claim.admissionDate)} and discharged on ${formatDate(claim.dischargeDate)}${claim.diagnosis ? `, with the diagnosis: ${claim.diagnosis}` : ""}.`,
    "",
    `Amount claimed: ${claim.amountClaimed === null ? "[amount]" : rupees(claim.amountClaimed)}. Amount approved: ${claim.amountApproved === null ? "[amount]" : rupees(claim.amountApproved)}. Your letter is dated ${formatDate(rejection.letterDate)}.`,
    ...(policy.continuousCoverSince ? [`I have had continuous cover since ${formatDate(policy.continuousCoverSince)}.`] : []),
    "",
    "I dispute the following deductions:",
    "",
    ...disputedItems(result).flatMap((item) => [item, ""]),
    "I ask you to:",
    ...(recoverableStrong > 0 ? [`- Review your decision and pay ${rupees(recoverableStrong)}, which I believe was wrongly deducted.`] : []),
    ...(questionable > 0 ? [`- Explain, item by item and with the policy clause relied on, the ${rupees(questionable)} marked above for explanation.`] : []),
    "- Send me your written reply.",
    "",
    "If this is not resolved, I intend to approach the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017.",
    "",
    "Attached: your claim decision letter, my policy, the hospital bill and the discharge summary.",
    "",
    "Yours faithfully,",
    "",
    claim.patient.name ?? "[Your name]",
    "[Your address]",
    "[Your phone and email]",
  ].join("\n");
}

function ombudsmanComplaint(result: CaseResult, today: string, reference: string | undefined): string {
  const { claim, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;

  return [
    "COMPLAINT TO THE INSURANCE OMBUDSMAN",
    "(Under Rule 14 of the Insurance Ombudsman Rules, 2017)",
    "",
    "To: The Insurance Ombudsman, [your region's office. Find it at www.cioins.co.in]",
    `Date: ${formatDate(today)}`,
    "",
    `1. Complainant: ${claim.patient.name ?? "[Your name]"}, [address, phone, email]`,
    `2. Insurer: ${claim.insurer ?? "[Insurer name]"}, [branch or office]`,
    `3. Policy number: ${claim.policyNumber ?? "[policy number]"}`,
    `4. Claim number: ${claim.claimId ?? "[claim number]"}`,
    `5. Patient and treatment: ${claim.patient.name ?? "[patient name]"}, admitted ${formatDate(claim.admissionDate)}, discharged ${formatDate(claim.dischargeDate)}${claim.diagnosis ? `, ${claim.diagnosis}` : ""}`,
    `6. Date of the insurer's decision: ${formatDate(rejection.letterDate)}`,
    "7. Date I sent my written complaint to the insurer: [date]",
    ...(reference ? [`   The insurer's complaint reference number: ${reference}`] : []),
    "8. The insurer's reply: [rejected on (date) / reply not acceptable, dated (date) / no reply after one month]",
    "",
    "9. Nature of the complaint:",
    `The insurer approved ${claim.amountApproved === null ? "[amount]" : rupees(claim.amountApproved)} of the ${claim.amountClaimed === null ? "[amount]" : rupees(claim.amountClaimed)} claimed. I dispute these deductions:`,
    "",
    ...disputedItems(result).flatMap((item) => [item, ""]),
    `10. Relief sought: payment of ${rupees(recoverableStrong)}${questionable > 0 ? `, and a clear explanation of the further ${rupees(questionable)}` : ""}.`,
    "",
    "11. I declare that this matter is not before any court, consumer forum or arbitrator, and that the facts above are true to the best of my knowledge. [Remove or correct this if it isn't true]",
    "",
    "Annexures to attach:",
    "[ ] Copy of the policy",
    "[ ] The insurer's claim decision letter",
    "[ ] My written complaint to the insurer, with proof of sending",
    "[ ] The insurer's reply, if any",
    "[ ] Hospital bill and discharge summary",
    "[ ] Other medical papers supporting the claim",
    "",
    "Signature: ____________________",
    claim.patient.name ?? "[Your name]",
  ].join("\n");
}

function formatLocalDate(date: string | null, text: LetterText): string {
  if (!date) return text.datePlaceholder;
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(text.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Quotes, clause wording and legal names stay as written, because that's what the insurer will look up.
function translatedItems(result: CaseResult, text: LetterText): string[] {
  const disputed = result.findings.filter(({ verdict, amount }) => verdict !== "valid" && amount > 0);
  return disputed.map((finding, index) => {
    const wrong = finding.verdict === "wrong";
    const lines = [`${index + 1}. ${text.item({ name: itemNames(finding, result), amount: rupees(finding.amount) }, wrong)}`];
    // An unclear finding asks the question rather than stating the answer the rules couldn't reach.
    const reasons = finding.ruleIds.flatMap((id) => (wrong ? undefined : text.reasons[`${id}?`]) ?? text.reasons[id] ?? []);
    lines.push(`   ${(reasons.length > 0 ? reasons : [text.reasons.UNDECIDED]).join(" ")}`);
    const { insurerText, policyClause, regulation } = finding.evidence;
    if (insurerText) lines.push(`   ${text.yourLetterSays}: "${insurerText.replace(/\s+/g, " ")}"`);
    if (policyClause) lines.push(`   ${text.policyWording}: ${policyClause}`);
    if (regulation && !PENDING_SOURCE.test(regulation.sourceName)) {
      lines.push(`   ${text.reference}: ${regulation.sourceName}${regulation.verified ? "" : ` ${text.checkReference}`}`);
    }
    return lines.join("\n");
  });
}

function translatedGrievance(result: CaseResult, today: string, text: LetterText, insurerEmail?: string): string {
  const { claim, policy, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;
  return [
    `${text.date}: ${formatLocalDate(today, text)}`,
    "",
    text.grievanceTo,
    claim.insurer ?? text.insurerNamePlaceholder,
    insurerEmail ?? text.insurerAddressPlaceholder,
    "",
    text.subject(claim.claimId ?? text.claimNumberPlaceholder, claim.policyNumber ?? text.policyNumberPlaceholder),
    "",
    text.greeting,
    "",
    text.about(claim.patient.name ?? text.patientPlaceholder, formatLocalDate(claim.admissionDate, text), formatLocalDate(claim.dischargeDate, text), claim.diagnosis),
    "",
    text.amounts(
      claim.amountClaimed === null ? text.amountPlaceholder : rupees(claim.amountClaimed),
      claim.amountApproved === null ? text.amountPlaceholder : rupees(claim.amountApproved),
      formatLocalDate(rejection.letterDate, text),
    ),
    ...(policy.continuousCoverSince ? [text.continuousCover(formatLocalDate(policy.continuousCoverSince, text))] : []),
    "",
    text.disputeIntro,
    "",
    ...translatedItems(result, text).flatMap((item) => [item, ""]),
    text.askIntro,
    ...(recoverableStrong > 0 ? [text.askPay(rupees(recoverableStrong))] : []),
    ...(questionable > 0 ? [text.askExplain(rupees(questionable))] : []),
    text.askReply,
    "",
    text.escalate,
    "",
    text.attached,
    "",
    text.closing,
    "",
    claim.patient.name ?? text.yourNamePlaceholder,
    text.addressPlaceholder,
    text.phonePlaceholder,
  ].join("\n");
}

function translatedOmbudsman(result: CaseResult, today: string, text: LetterText, reference: string | undefined): string {
  const { claim, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;
  return [
    text.ombudsmanTitle,
    text.ombudsmanUnder,
    "",
    text.ombudsmanTo,
    `${text.date}: ${formatLocalDate(today, text)}`,
    "",
    text.complainant(claim.patient.name ?? text.yourNamePlaceholder),
    text.insurerLine(claim.insurer ?? text.insurerNamePlaceholder),
    text.policyNumber(claim.policyNumber ?? text.policyNumberPlaceholder),
    text.claimNumber(claim.claimId ?? text.claimNumberPlaceholder),
    text.patientAndTreatment(claim.patient.name ?? text.patientPlaceholder, formatLocalDate(claim.admissionDate, text), formatLocalDate(claim.dischargeDate, text), claim.diagnosis),
    text.decisionDate(formatLocalDate(rejection.letterDate, text)),
    text.complaintDate,
    ...(reference ? [text.referenceNumber(reference)] : []),
    text.insurerReply,
    "",
    text.natureHeading,
    text.natureIntro(
      claim.amountApproved === null ? text.amountPlaceholder : rupees(claim.amountApproved),
      claim.amountClaimed === null ? text.amountPlaceholder : rupees(claim.amountClaimed),
    ),
    "",
    ...translatedItems(result, text).flatMap((item) => [item, ""]),
    text.relief(rupees(recoverableStrong), questionable > 0 ? rupees(questionable) : null),
    "",
    text.declaration,
    "",
    text.annexuresHeading,
    ...text.annexures,
    "",
    text.signature,
    claim.patient.name ?? text.yourNamePlaceholder,
  ].join("\n");
}

// Written from the rules' findings with no AI call, so a letter can't state anything the rules didn't decide.
export function buildLetter(
  result: CaseResult,
  letterType: LetterType,
  today: string,
  language: LetterLanguage = "en",
  grievanceReference?: string,
  insurerEmail?: string,
): string {
  if (letterType === "call_script") return buildCallScript(result, language);
  if (language === "en") {
    return letterType === "grievance" ? grievanceLetter(result, today, insurerEmail) : ombudsmanComplaint(result, today, grievanceReference);
  }
  const text = LETTER_TEXT[language];
  return letterType === "grievance"
    ? translatedGrievance(result, today, text, insurerEmail)
    : translatedOmbudsman(result, today, text, grievanceReference);
}
