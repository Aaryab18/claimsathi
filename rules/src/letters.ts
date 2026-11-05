import type { CaseResult, Finding, LetterType } from "@claimsathi/contracts";

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

// Only what the rules decided goes in. A reference that hasn't been checked is marked, never stated as settled law.
function disputedItems(result: CaseResult): string[] {
  const disputed = result.findings.filter(({ verdict, amount }) => verdict !== "valid" && amount > 0);
  return disputed.map((finding, index) => {
    const lines = [
      `${index + 1}. ${itemNames(finding, result)}: ${rupees(finding.amount)} (${
        finding.verdict === "wrong" ? "I believe this was wrongly deducted" : "I ask for a clear explanation"
      })`,
      `   ${finding.explanationEn.replace(/\s*The legal reference for (this rule|these rules|this deduction) has not been checked yet\./, "")}`,
    ];
    const { insurerText, policyClause, regulation } = finding.evidence;
    if (insurerText) lines.push(`   Your letter says: "${insurerText}"`);
    if (policyClause) lines.push(`   Policy wording: ${policyClause}`);
    if (regulation && !PENDING_SOURCE.test(regulation.sourceName)) {
      lines.push(`   Reference: ${regulation.sourceName}${regulation.verified ? "" : " [check this reference before sending]"}`);
    }
    return lines.join("\n");
  });
}

function grievanceLetter(result: CaseResult, today: string): string {
  const { claim, policy, rejection } = result.extracted;
  const { recoverableStrong, questionable } = result.totals;

  return [
    `Date: ${formatDate(today)}`,
    "",
    "To: The Grievance Redressal Officer",
    claim.insurer ?? "[Insurer name]",
    "[Insurer address or grievance email]",
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

function ombudsmanComplaint(result: CaseResult, today: string): string {
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

// Written from the rules' findings with no AI call, so a letter can't state anything the rules didn't decide.
export function buildLetter(result: CaseResult, letterType: LetterType, today: string): string {
  return letterType === "grievance" ? grievanceLetter(result, today) : ombudsmanComplaint(result, today);
}
