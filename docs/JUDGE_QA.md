# Judge questions and honest answers

## The AI

**How do you stop the AI making things up?**
It only copies facts. Missing facts become unknown, and tested code makes every decision. On PDFs, we check each quote against the document's own text without AI.

**Which AI do you use, and why?**
Google Gemini's free plan, because we had no paid AI budget. It sits behind one file, so it can be swapped out.

**How accurate is it?**
We don't have an accuracy figure. We tested two made-up cases: clean PDFs and noisy images. After we fixed the bugs those tests found, both gave the expected totals. That isn't enough to claim a percentage, and real documents will be harder.

**What happens if it reads something wrong?**
The user can correct dates and categories under Confirm the facts, and the rules recalculate instantly. If the amounts don't add up, the result shows a warning.

**What if the AI is down?**
It retries and moves through other free models. If all are busy, our own sample PDFs get a saved reading labelled as a sample. Anything else gets a clear "try again" message.

## The law

**Are your legal rules verified?**
Not all of them. The Ombudsman deadlines are verified from the Council for Insurance Ombudsmen's copy of the Rules. Others are marked unverified on screen, and that's what we'd finish next.

**What about proportionate deductions?**
It's our biggest open item. Several published explainers say pharmacy, implants, consumables and diagnostics can't be cut this way, but we haven't found the IRDAI text. It's ₹38,200 of the sample's headline figure, so we won't call it settled law until we do.

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

**Why not just use ChatGPT?**
A chatbot can give different answers and can invent rules. This gives repeatable results, shows its evidence, and turns it into letters and deadlines.

**Why will insurers listen?**
The letter quotes their own words and policy, asks specific questions, and leads to the Ombudsman, a formal route they have to answer. We can't promise any particular outcome.

**What would you build next?**
Confirm the legal references, test on real consented documents, measure accuracy, add reminders by email and support more languages.

**How did you build it in 24 hours?**
AI wrote most of the code under our direction, and we reviewed and tested it. There are several hundred automated tests, and they run on every change.

## If you don't know

"I don't know that yet, and I don't want to guess. Here's how we'd find out."
