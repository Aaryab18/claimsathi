# ClaimSathi

**The AI reads, the rules judge.** ClaimSathi explains why a health insurance claim in India was rejected or cut, shows which deductions look wrong, and drafts the appeal.

**Live demo:** https://claimsathi-web.onrender.com. Click **Try sample case**, or download the made-up documents on the home page and upload them.

> This is a hackathon demo, not legal advice. Please don't upload real medical documents.

## The problem

A family gets a letter saying part of a hospital claim won't be paid. It cites clauses and uses terms they don't know, and they have no way to tell which deductions are fair. Many never challenge it.

## What it does

| Feature | What you get |
|---|---|
| **Upload** | Rejection letter, policy and bill, as PDFs or photos, plus a one-click sample case |
| **Decoder** | Plain explanations in English and Hindi |
| **Line-item audit** | Every deduction marked likely wrong, questionable or valid, with the reason |
| **Case pages** | Overview, Breakdown, Evidence, Check facts, Your plan and Letters, as a sidebar on desktop and tabs on phones |
| **Evidence view** | The insurer's words, the policy clause and the official source side by side, with its status, a link to the official PDF, and a Verified Quote check on PDFs |
| **Rules and sources** | Every rule, what it checks, its status and a link to the official source, in all three languages |
| **Recoverable meter** | One headline figure, and how the deducted money splits |
| **Confirm the facts** | Correct a date or category, and the rules recalculate instantly with no AI call |
| **Appeal letters** | An editable complaint to the insurer and an Ombudsman complaint with an annexure checklist, in English, Hindi or Kannada, with Print or Save as PDF |
| **Deadlines** | Ombudsman dates from the official rules, and a calendar file with reminders |
| **Charts** | Where the claim went, the biggest cuts, and the cover timeline against the hospital stay |
| **Printable report** | Save the result as a PDF, with strength of grounds on each deduction |
| **Case strength** | A 0 to 100 summary of the rules' verdicts, with its working shown. It isn't a prediction of winning |
| **Helpdesk dashboard** | For hospitals and NGOs: totals, charts and deadlines across cases, stored only in that browser with no patient names |
| **Action plan** | Four clear next steps, using the case's own dates |
| **Ombudsman finder** | Choose your state to see your office, from the Council for Insurance Ombudsmen's list |
| **Listen and share** | Read the summary aloud where the browser has a voice for that language, or share it on WhatsApp without names |

## Why you can check its answers

The AI only copies facts from the documents. Tested code makes every decision.

1. **Gemini reads** the documents and returns data in a fixed format. A fact it can't support becomes "unknown", not a guess.
2. **Rules judge** each deduction. The same facts always give the same result.
3. **Quotes are checked** against the PDF's own text, without AI. Photos can't be checked this way, and the site says so.
4. **Unsure means questionable.** The app never calls something wrong without a rule that supports it.

See [the architecture](docs/ARCHITECTURE.md).

## The rules

| Rule | Checks | Legal source status |
|---|---|---|
| R1 | Cover of 60 months or more | **Verified:** IRDAI Master Circular on Health Insurance, 29.05.2024, clause 13 |
| R2 | Pre-existing disease waiting period, from the policy's own figure | Uses the policy's wording |
| R3 | Proportionate cuts on pharmacy, consumables, implants, diagnostics and ICU charges | **Source found, status open:** IRDAI circular 151/06/2020, paragraphs 4, 5 and 7. We haven't confirmed whether the May 2024 Master Circular kept it |
| R4 | Non-payable items that belong to a package | **Source found, status open:** IRDAI Master Circular on Standardization 193/07/2020, Annexure I, Lists II to IV. Same open 2024 question as R3 |
| R5 | Rejection for documents the insurer never asked for | **Verified text:** 2024 Master Circular, clause 17(c), on insurers collecting documents from hospitals. Whether it covers every missing document is a judgment, so R5 needs the person's confirmation |
| R6 | Co-pay and sub-limit arithmetic | Arithmetic on the policy's own figures |
| R7 | Whether a cited clause was found in the policy | **Verified:** 2024 Master Circular, clause 17(b) |
| R8 | Ombudsman deadlines | **Verified:** Insurance Ombudsman Rules 2017, Rule 14, as updated on 9.11.2023 |

The app shows each source's status on screen, with a link to the official PDF.

## Limits

- It has been tested on made-up documents only, so we don't have an accuracy figure.
- It runs on free plans. The API sleeps when idle, and Gemini can be busy. Free-tier data may be used by Google, which is why real documents aren't allowed in this demo.
- Uploads are deleted from our database within 24 hours, but that doesn't cover what Google does with them.
- Letters are drafts. The Hindi and Kannada versions still need a native reader's review. Check every fact before sending.
- Email, SMS and WhatsApp reminders aren't built. The calendar file covers reminders for now.

## Tech

TypeScript in an npm workspace: React and Vite (`web/`), Express and Prisma on Postgres (`api/`), the rules engine (`rules/`) and a shared Zod contract (`contracts/`). It's hosted on Render, and the AI is behind one replaceable file, `api/src/gemini-reader.ts`.

## Getting started

You need Node 22 (see `.nvmrc`).

```
npm install
npm run typecheck
npm test
npm run build
```

Copy `.env.example` to `.env` to run it yourself. Never commit a key. Without `GEMINI_API_KEY`, everything except uploads still works.

`node scripts/make-sample-documents.mjs` regenerates the sample PDFs. If they change, update their fingerprints in `api/src/saved-readings.ts`.
