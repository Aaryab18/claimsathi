# ClaimSathi testing guide

Live site: https://claimsathi-web.onrender.com. It can take up to a minute to wake up.

Each correction stays saved on its case, so go back to the home page and click **Try sample case** before each test.

## What each status means

| Status | Meaning |
|---|---|
| **Tested live** | Run on the live site or live API |
| **Tested locally** | Run in a browser on a local build, not the live site |
| **Automated** | Covered by an automated test |
| **Manual** | Not fully tested. A person must check it on a real device |

These results come from made-up documents only, and from a browser pane that was hidden while testing. A hidden pane pauses animation and smooth scrolling, so those can't be judged there.

Re-run the **Tested locally** items on the live site after each deploy.

## The 23 tests

### 1. Language selector
- **Do:** click हिंदी, ಕನ್ನಡ and English.
- **Expect:** the page text changes each time.
- **Status:** Tested live and locally. **Manual:** a Kannada reader must check the wording.

### 2. Sample case
- **Do:** click **Try sample case**.
- **Expect:** a **Sample case** label, and ₹71,400 out of ₹96,000.
- **Status:** Tested live.

### 3. Result meter
- **Expect:** ₹71,400 likely recoverable, ₹7,800 questionable, ₹16,800 valid, ₹96,000 total deducted.
- **Status:** Tested live.

### 4. Item-by-item breakdown
- **Expect:** pharmacy and stent ₹38,200 likely wrong, consumables ₹12,600 likely wrong, hypertension ₹20,600 likely wrong, room rent ₹16,800 valid, admin ₹7,800 questionable.
- **Status:** Tested live.

### 5. Evidence popup
- **Do:** click a row, then **Close**.
- **Expect:** the insurer's words, the policy clause, and the legal reference or a note that it's still being checked.
- **Status:** Tested live. The fix for clause names written differently and ICU evidence is Automated, and needs a live re-check after deploying.

### 6. Apply corrections
- **Do:** make each change below on a fresh case, then click **Apply corrections**.

| Change | Likely recoverable | Questionable | Valid |
|---|---|---|---|
| **Continuous cover date** to 1 Jan 2024 | ₹50,800 | ₹28,400 | ₹16,800 |
| **Policy start date** to 1 Jan 2024 | ₹71,400 | ₹7,800 | ₹16,800 |
| Open **Bill item categories**, set Pharmacy (L2) to Procedures & Surgery | ₹47,267 | ₹31,933 | ₹16,800 |
| **Admission date** to 1 Jan 2021 | ₹50,800 | ₹45,200 | ₹0 |

- **Expect:** a green note says what changed. **Bill item categories** opens and closes.
- **Status:** the amounts, green note and folding section are Tested live. **Manual:** watch the page scroll to the top and the number count on a visible screen.

### 7. Deadlines
- **Do:** check the dates, then enter 5 Nov 2026 as the date you sent your complaint and apply it.
- **Expect:** first **Date pending** and 15 Oct 2027, then 5 Dec 2026 and 5 Dec 2027.
- **Status:** Tested live.

### 8. Calendar file
- **Do:** click **Add dates to my calendar** and open the file.
- **Expect:** your calendar offers to add the dates.
- **Status:** file contents Tested live. **Manual:** opening it in a calendar app.

### 9. Appeal letters
- **Do:** click both draft buttons, edit the text, then try **Copy text** and **Print or save as PDF**.
- **Expect:** blanks in [square brackets], a request for Rs. 71,400, no room rent, and "[check this reference before sending]" beside the 2020 circular.
- **Status:** letter contents Tested live. **Manual:** copying and printing.

### 10. Live AI reading
- **Do:** download the three made-up documents, choose them and click **Analyse claim**.
- **Expect:** ₹71,400 with no **Sample case** label. If Gemini is busy, the labelled saved reading appears.
- **Status:** Tested live.

### 11. Verified Quote
- **Do:** after Test 10, click a row.
- **Expect:** "✓ We found this exact quote in your document". A photo says the quote couldn't be checked.
- **Status:** PDF Tested live. Photo wording Automated.

### 12. Bad files
- **Do:** choose a `.exe` or `.txt` file, and try with fewer than three files.
- **Expect:** "Only PDF, JPG, and PNG files are allowed", and **Analyse claim** stays disabled.
- **Status:** Tested locally and Automated.

### 13. Charts
- **Expect:** Where your claim went, Biggest cuts first, and the cover timeline, below the claim summary.
- **Status:** Tested live, and at phone size locally.

### 14. Timeline after a correction
- **Do:** set **Continuous cover date** to 1 Jan 2024 and apply it.
- **Expect:** cover 1 Jan 2024, admission 10 Nov 2025, waiting period ends 1 Jan 2028, 60 months 1 Jan 2029.
- **Status:** Tested live.

### 15. Case strength
- **Expect:** **76 / 100, Strong case**, and a note that it summarises rule-based grounds and is NOT a prediction of winning. After the cover date correction, 60 / 100.
- **Status:** score Tested live. New note wording Tested locally.

### 16. What to do next
- **Expect:** four steps. After entering a sent date, they show 5 Dec 2026 and about 5 Dec 2027.
- **Status:** Tested live.

### 17. Corrected letter
- **Do:** apply the cover date correction, then click **Draft complaint to insurer**.
- **Expect:** "continuous cover since 1 January 2024", and not the old date.
- **Status:** Tested live.

### 18. Ombudsman finder
- **Do:** choose **Haryana**, then each area.
- **Expect:** Gurugram, Faridabad, Sonepat and Bahadurgarh go to Delhi. Another district goes to Chandigarh. A link opens the official page.
- **Status:** the area list was read on the official page, and the link returned 200. The district choice is Tested locally and Automated.

### 19. Listen and share
- **Do:** click **Listen to this** and **Share on WhatsApp** in each language.
- **Expect:** speech where the browser has a voice for that language, and no button where it doesn't. The message has no names or case link.
- **Status:** button rule Tested locally, and message text Tested live. **Manual:** hearing the speech, Hindi and Kannada voices, and opening WhatsApp.

### 20. Printable report
- **Do:** click **Print or save report**.
- **Expect:** summary, charts, case strength, deductions and evidence, with no forms or letters.
- **Status:** contents Tested locally in a PDF made with Edge. **Manual:** how it looks, and whether the ₹ symbol prints correctly.

### 21. Upload boxes
- **Do:** drag a real PDF onto a box.
- **Expect:** a green tick and "1 of 3 files chosen". A wrong file type is refused.
- **Status:** simulated drop Tested locally and Automated. **Manual:** a real drag with a mouse.

### 22. Helpdesk
- **Do:** click **For hospitals and NGOs**, then **Load demo cases**.
- **Expect:** totals, two charts, nearest deadline first, and a notice that the data is made up. A real upload appears as "Case 1" with no patient name.
- **Status:** Tested live and locally.

### 23. Kannada on a case
- **Do:** click ಕನ್ನಡ on a case.
- **Expect:** site text changes, and a note says case explanations, deadline notes and letters are in English.
- **Status:** Tested live. **Manual:** a Kannada reader must check the wording.

## R3 and ICU charges

A made-up upload with an ICU cut and a medicines cut gave ₹35,000 likely wrong. The ICU cut showed rule R3 and paragraph 7 of the 2020 circular, marked as still being confirmed.

**Status:** Tested live. The test found that the ICU cut's insurer quote and policy clause were missing. That fix is Automated, and needs a live re-check after deploying.

## Accuracy

We have no accuracy figure, and the app shows none. Made-up cases have been run through live Gemini as clean PDFs, noisy images, a full rejection and a Hindi letter, and unrelated files were refused. That isn't an evaluation.

## Other checks

| Check | Status |
|---|---|
| **Console errors** | None on the home and case pages locally, or on the live case page |
| **Sideways scrolling at phone width** | None on the case page locally, in all three languages. **Manual:** a real phone |
| **Sideways scrolling at desktop width** | None on the home and case pages locally, in all three languages |
