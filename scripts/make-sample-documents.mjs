#!/usr/bin/env node
// Writes the three made-up sample PDFs to web/public/samples, from the sample claim in the contract,
// so the documents can't drift from the case they describe. Run after building contracts:
//   node scripts/make-sample-documents.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { sampleExtractedClaim as claim } from "@claimsathi/contracts";

const NOTICE = "FICTIONAL SAMPLE FOR THE CLAIMSATHI DEMO. No real person, insurer, hospital or policy is described.";
const MAX_LINE = 88;

const rupees = (amount) => `Rs. ${amount.toLocaleString("en-IN")}`;
const quotesFor = (document, page) =>
  [...claim.rejection.reasons.map(({ source }) => source), ...claim.lineItems.map(({ source }) => source)]
    .filter((source) => source?.document === document && source.page === page)
    .map((source) => source.quote);
const clauseOn = (page) =>
  claim.policyClauses
    .filter(({ source }) => source.page === page)
    .map(({ clauseId, text }) => `${clauseId}. ${text}`);

function wrap(line) {
  const lines = [];
  let current = "";
  for (const word of line.split(" ")) {
    if (current && current.length + word.length + 1 > MAX_LINE) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  lines.push(current);
  return lines;
}

function buildPdf(title, pages) {
  const escape = (text) => text.replace(/[\\()]/g, "\\$&");
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add(""); // The page list is filled in once the pages exist.
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageIds = pages.map((lines, index) => {
    const body = lines.flatMap((line) => (line ? wrap(line) : [""]));
    const stream = [
      "BT",
      "/F2 15 Tf 50 790 Td",
      `(${escape(title)}) Tj`,
      "/F1 8 Tf 0 -16 Td",
      `(${escape(NOTICE)}) Tj`,
      "/F1 11 Tf 0 -30 Td 16 TL",
      ...body.map((line) => `(${escape(line)}) Tj T*`),
      `/F1 9 Tf 0 -10 Td (Page ${index + 1} of ${pages.length}) Tj`,
      "ET",
    ].join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    return add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R ` +
        "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>",
    );
  });
  objects[1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((body, index) => {
    const offset = Buffer.byteLength(pdf);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const { claim: details, policy } = claim;
const reference = [
  `Claim number: ${details.claimId}`,
  `Policy number: ${details.policyNumber}`,
  `Patient: ${details.patient.name}, age ${details.patient.age}, ${details.patient.city}`,
];

const letter = buildPdf(`${details.insurer}: claim decision`, [
  [
    "Date of this letter: 15 October 2026",
    ...reference,
    `Admitted 10 November 2025, discharged 15 November 2025. Diagnosis: ${details.diagnosis}.`,
    "",
    `Amount claimed: ${rupees(details.amountClaimed)}. Amount approved: ${rupees(details.amountApproved)}.`,
    `Your claim is partly approved. ${rupees(details.amountClaimed - details.amountApproved)} has been deducted, for these reasons:`,
    "",
    `Under Clause 4.2: ${quotesFor("rejection_letter", 1)[0]}`,
    `Under Clause 4.2: ${quotesFor("rejection_letter", 1)[1]}`,
    `Under Clause 7.5: ${quotesFor("rejection_letter", 1)[2]}`,
  ],
  [
    `Under Clause 5.1: ${quotesFor("rejection_letter", 2)[0]}`,
    quotesFor("rejection_letter", 2)[1],
    "",
    "Amounts by bill item:",
    ...claim.lineItems.map(
      ({ description, billed, approved, deducted }) =>
        `${description}: billed ${rupees(billed)}, approved ${rupees(approved)}, deducted ${rupees(deducted)}`,
    ),
  ],
]);

const POLICY_PAGE_TEXT = {
  1: [
    "Policy schedule",
    `Policy number: ${details.policyNumber}`,
    `Insured: ${details.patient.name}`,
    `Plan: ${policy.planType}`,
    `Sum insured: ${rupees(policy.sumInsured)}`,
    "This policy period starts on: 1 March 2025",
    "Continuous cover without a break since: 1 March 2019",
  ],
  2: ["Section 1. What is covered", "Hospital treatment that is medically necessary, as set out in this policy."],
  3: ["Section 2. How to claim", "Send the claim form, bills and discharge summary within 30 days of discharge."],
  4: ["Section 4. Limits", ...clauseOn(4)],
  5: ["Section 5. Waiting periods", ...clauseOn(5)],
  6: ["Section 6. Exclusions", "Cosmetic treatment is not covered."],
  7: ["Section 7. Expenses", ...clauseOn(7)],
};
const policyDocument = buildPdf(`${details.insurer}: health policy`, Object.values(POLICY_PAGE_TEXT));

const bill = buildPdf("Sample City Hospital, Pune: final bill", [
  [...reference, "", ...quotesFor("bill", 1)],
  ["Bill continued", "", ...quotesFor("bill", 2)],
  ["Bill continued", "", ...quotesFor("bill", 3), "", `Total billed: ${rupees(details.amountClaimed)}`],
]);

const folder = new URL("../web/public/samples/", import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL("sample-rejection-letter.pdf", folder), letter);
writeFileSync(new URL("sample-policy.pdf", folder), policyDocument);
writeFileSync(new URL("sample-hospital-bill.pdf", folder), bill);
console.log("Wrote the three sample documents to web/public/samples.");
