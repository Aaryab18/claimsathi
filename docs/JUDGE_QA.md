# Judge questions and honest answers

## The AI

**How do you stop the AI making things up?**
It only copies facts. Missing facts become unknown, and tested code makes every decision. On PDFs, we check each quote against the document's own text without AI.

**Which AI do you use, and why?**
Google Gemini's free plan, because we had no paid AI budget. It sits behind one file, so it can be swapped out.

**How accurate is it?**
We don't have an accuracy figure. We tested made-up cases: clean PDFs, noisy images, a full rejection and a Hindi letter, and unrelated files were refused. After we fixed the bugs those tests found, they gave the expected totals. That isn't enough to claim a percentage, and real documents will be harder.

**What happens if it reads something wrong?**
The user can correct dates and categories under Confirm the facts, and the rules recalculate instantly. If the amounts don't add up, the result shows a warning.

**What if the AI is down?**
It retries and moves through other free models. If all are busy, our own sample PDFs get a saved reading labelled as a sample. Anything else gets a clear "try again" message.

**Is the case strength score a chance of winning?**
No. It summarises the rules' verdicts, using weights we chose and show on screen. A real chance of winning would need data from past cases, which we don't have.

## The law

**Are your legal rules verified?**
Some are. The Ombudsman deadlines come from the Council for Insurance Ombudsmen's copy of the Rules, and the moratorium, claim-document and cited-clause rules from IRDAI's 2024 Master Circular on its own site. The **Rules and sources** page lists every rule with its status and a link to the official PDF, and each piece of evidence links to its source too.

**What about proportionate deductions?**
We found it on IRDAI's site: circular 151/06/2020, paragraphs 4 and 5, says pharmacy and consumables, implants and medical devices, and diagnostics can't be part of associate medical expenses. The open question is that the May 2024 Master Circular replaced about 55 older circulars, doesn't repeat this wording, and its list of replaced circulars wasn't in the copy we read. So the app marks it as still being confirmed. It's ₹38,200 of the sample's headline figure.

**And items inside a package (R4)?**
IRDAI's 2020 Master Circular on Standardization, 193/07/2020, Annexure I, lists items to be included in room, procedure and treatment charges, and says insurers must ensure hospitals don't bill them to policyholders. The same 2024 question applies, so it's also marked as still being confirmed. It's ₹12,600 of the sample's headline figure, plus the ₹7,800 questionable item.

**Isn't this legal advice?**
No. It's information and draft letters, and the app says so. The person decides what to send.

**What does the moratorium actually cover?**
After 60 months of continuous cover, a claim can't be contested for non-disclosure or misrepresentation, except for established fraud. It doesn't cancel every exclusion.

## Privacy and safety

**Is patient data safe?**
This demo tells people not to upload real medical documents, because free-plan AI data may be used by the provider. Our database deletes files within 24 hours. A real launch would need a paid AI plan with proper data terms and legal review.

**Can a document trick the AI with hidden instructions?**
The AI is told to treat documents as data. Even if it were fooled, it only returns facts, and the rules make the decisions. A false fact could still mislead the result, which is why quotes are checked and users confirm facts.

## The product

**Who would use this, and how does it make money?**
People with a cut or rejected claim. Possible routes are hospital help desks, NGOs and patient groups. We haven't tested demand or pricing yet.

**Is the helpdesk dashboard a real system for hospitals?**
It's an early version. It works today, but the list stays in one browser, with no login or batch upload. The demo cases are made up. A real rollout would need accounts, consent and data agreements.

**Why not just use ChatGPT?**
A chatbot can give different answers and can invent rules. This gives repeatable results, shows its evidence, and turns it into letters and deadlines.

**Can it call the insurer for the user?**
No, on purpose. Insurers check that the caller is the policyholder, a call would pass health details through more services, and an AI arguing live could say things the rules never decided. Instead, the app gives the official grievance number, a script made from the findings with no AI, and the written and online routes. We only show a number we read on the insurer's own grievance page, for five insurers so far.

**Why will insurers listen?**
The letter quotes their own words and policy, asks specific questions, and leads to the Ombudsman, a formal route they have to answer. We can't promise any particular outcome.

**What would you build next?**
Confirm the legal references, test on real consented documents, measure accuracy, add reminders by email and support more languages.

**How did you build it in 24 hours?**
AI wrote most of the code under our direction, and we reviewed and tested it. There are several hundred automated tests, and they run on every change.

**Which languages does it support?**
English, Hindi and Kannada for the site and for both letters. Explanations are in English and Hindi. The Hindi and Kannada letters are built from the same rule findings as the English ones, with no AI, and keep quotes and legal names in English. A native reader still needs to review their wording.

**Why would a letter in Kannada help, if the insurer works in English?**
Many families can't check an English letter they're about to sign. They can read it in their own language, then send whichever version the insurer or Ombudsman office accepts.

## If you don't know

"I don't know that yet, and I don't want to guess. Here's how we'd find out."
