# contracts

This package is the shared agreement about what ClaimSathi's data looks like. The API, worker, rules and website all use it, so they cannot disagree about a field's name or type.

It uses [Zod](https://zod.dev). Each schema comes in two forms:

- `ExtractedClaimSchema` checks data while the program runs.
- `ExtractedClaim` is the TypeScript type, which catches mistakes while you write code.

```ts
import { ExtractedClaimSchema, type ExtractedClaim } from "@claimsathi/contracts";

const claim: ExtractedClaim = ExtractedClaimSchema.parse(data); // Throws an error if data is wrong
```

Run `npm run build` first, because other packages load this one from its built `dist/` folder.

## Rules for all the data

- **Money** is whole rupees: `96000` is allowed, `96000.50` is not.
- **Dates** are `YYYY-MM-DD`: `2025-11-10` is allowed, `10/11/2025` is not.
- **Missing facts** are `null`. The AI must never guess a fact that the documents don't contain.

## 1. ExtractedClaim: what the AI reads from the documents

It has five parts: `claim`, `policy`, `rejection`, `lineItems` and `policyClauses`. A `source` shows where a fact came from: the document, the page and the exact quote.

```ts
{
  id: "L4",
  description: "Consumables used during angioplasty",
  category: "consumable",
  billed: 12600,
  approved: 0,
  deducted: 12600,
  deductionType: "non_payable",
  deductionReason: "Treated as not payable",
  partOfPackage: true,
  source: { document: "bill", page: 2, quote: "Consumables, included in angioplasty package - Rs. 12,600" }
}
```

`policy.roomRentLimit` is rupees per day.

These fields give the rules facts they can check directly:

- `deductionType` on a line item says what kind of deduction it is: `none`, `room_rent_excess`, `proportionate`, `non_payable`, `pre_existing_disease`, `documentation`, `sub_limit`, `copay` or `other`. Use `none` when nothing was deducted.
- `partOfPackage` on a line item is `true`, `false`, or `null` when the documents don't say.
- `category` on a rejection reason is `documentation_missing`, `pre_existing_disease`, `non_payable`, `proportionate`, `room_rent`, `sub_limit`, `copay` or `other`.
- `rejection.letterDate` is the date on the rejection letter.
- `policy.subLimits` lists the policy's sub-limits. It is empty when the documents show none.

`policyClauses` holds the exact wording of policy clauses:

```ts
{
  clauseId: "Clause 4.2",
  title: null,
  text: "Room rent is payable up to Rs. 5,000 per day.",
  source: { document: "policy", page: 4, quote: "Room rent is payable up to Rs. 5,000 per day." }
}
```

## 2. Finding: what the rules engine decides

A finding groups deducted line items under one verdict: `wrong`, `questionable` or `valid`. Only the rules engine creates findings, never the AI.

```ts
{
  id: "F2",
  ruleIds: ["R4"],
  lineItemIds: ["L4"],
  verdict: "wrong",
  confidence: "strong",
  amount: 12600,
  explanationEn: "The insurer refused ₹12,600 of consumables...",
  explanationHi: "बीमा कंपनी ने ₹12,600 की...",
  evidence: {
    insurerText: "Consumables of Rs. 12,600 are not payable under the policy.",
    policyClause: "Clause 7.5: Items listed as non-medical expenses are not payable.",
    regulation: { text: "Pending verification by Member C", sourceName: "Pending verification by Member C", verified: false },
    quoteVerified: false
  }
}
```

- `ruleIds` can be empty only for a `valid` finding.
- `verified` and `quoteVerified` must be `false` until someone has really checked the regulation or quote.

## 3. FactOverrides: corrections from the "Confirm the facts" screen

Every field is optional. Send only what the person corrected. A misspelled field is rejected.

```ts
{
  continuousCoverSince: "2019-03-01",
  lineItemCategories: [{ lineItemId: "L4", category: "procedure" }],
  insurerAskedForMissingDocument: false
}
```

## 4. CaseResult: what the website displays

It holds `caseToken`, `extracted`, `findings`, `deadlines`, `totals` and `resultSource`.

```ts
{
  totals: { totalDeducted: 96000, recoverableStrong: 71400, questionable: 7800, validDeductions: 16800 },
  deadlines: [{ label: "Grievance to the insurer", date: null, explanation: "Pending verification by Member C", verified: false }],
  resultSource: "saved_sample"
}
```

- `resultSource` is `live` or `saved_sample`, so a saved result is always labelled honestly.
- A deadline's `date` stays `null` until it has been checked. A `verified` deadline must have a date.
- `recoverableStrong` is the total of `wrong` findings, `questionable` the total of `questionable` findings, and `validDeductions` the total of `valid` findings.

A CaseResult also fails its check if:

- a deducted line item isn't in exactly one finding
- a finding names a line item that doesn't exist
- a finding's `amount` differs from its line items' deductions
- the totals don't match the findings

## 5. CaseStatus: how far a case has got

`stage` is one of `queued`, `reading`, `checking`, `drafting`, `done` or `failed`.

```ts
{ stage: "failed", progressMessage: "Stopped", errorMessage: "This file could not be read" }
```

## 6. API contract

`API_ROUTES` lists the paths, so nobody has to retype them.

| Route | Sends | Gets back |
| --- | --- | --- |
| `POST /cases` | `CreateCaseRequest` plus the files | `CreateCaseResponse` |
| `POST /cases/sample` | `{}` | `CreateSampleCaseResponse` |
| `GET /cases/:token` | Nothing | `GetCaseResponse` |
| `PATCH /cases/:token/facts` | `FactOverrides` | `CaseResult` |
| `POST /cases/:token/letters` | `CreateLetterRequest` | `CreateLetterResponse` |

```ts
{ letterType: "grievance" } // The request for POST /cases/:token/letters
```

- `POST /cases` carries the files as a multipart upload. `CreateCaseRequest` describes each file's type, name, format and size.
- `GET /cases/:token` has a `result` only when the stage is `done`. Otherwise `result` is `null`.
- `PATCH /cases/:token/facts` re-runs the rules with no AI call.

## 7. RulesEngine: the shape of the rules function

This is only a type. The rules themselves belong in `rules/`.

```ts
const runRules: RulesEngine = ({ extracted, overrides, asOfDate }) => {
  // The rules go here
  return { findings, deadlines, totals };
};
```

The rules engine creates explanationEn and explanationHi from written templates, with no AI call, so the what-if screen updates instantly. For R7, code can only prove that a clause exists. Whether a clause says what the insurer claims can only be marked questionable.

### Which fields each rule reads

This table is a draft for Member C to confirm when writing the rules. R1 to R4 are worked out from the sample case and R7 from the note above. R5, R6 and R8 have no agreed definition yet, so their fields are left open rather than guessed.

| Rule | Fields it reads |
| --- | --- |
| R1 | `lineItems[].deductionType`, `claim.admissionDate`, `policy.startDate`, `policy.continuousCoverSince`, `policy.pedWaitingMonths` |
| R2 | `lineItems[].deductionType`, `claim.admissionDate`, `policy.startDate`, `policy.continuousCoverSince`, `policy.pedWaitingMonths` |
| R3 | `lineItems[].deductionType`, `lineItems[].category`, `policy.roomRentLimit` |
| R4 | `lineItems[].deductionType`, `lineItems[].partOfPackage`, `lineItems[].category` |
| R5 | Not defined yet |
| R6 | Not defined yet |
| R7 | `rejection.reasons[].clauseCited`, `policyClauses[].clauseId` |
| R8 | Not defined yet |

## Sample data

`fixtures/` holds a fictional case, exported as `sampleExtractedClaim` and `sampleCaseResult`. Suresh Kumar and Sample Health Insurance Ltd are made up.

Its legal text has not been checked yet, so every regulation and deadline says `Pending verification by Member C` and has `verified: false`. Its quotes are also made up, so `quoteVerified` is `false`.
