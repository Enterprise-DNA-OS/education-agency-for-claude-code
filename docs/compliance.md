# Compliance checks

`/compliance` (or `npm run agency -- compliance`) runs every rule below against the records and lists what breaches or is about to. Each rule is one query in `scripts/lib/domain.mjs` (`rules`).

These are record checks, not legal advice. A clean result means the records are complete for that rule. It does not mean the agency meets the law, and it cannot see what is not recorded. Confirm any rule with your adviser before you rely on it, and when a rule changes, change the doc and the query together (`/customise`).

Rules were read on 30 September 2026.

## 1. AU onshore transfer commission

- **Rule:** From 31 March 2026 an Australian provider must not pay commission to an agent for recruiting an overseas student who has already started study with another registered provider in Australia, unless an exception applies. The ban does not apply where the student was accepted for enrolment on or before 31 March 2026, or where the new course is on the Confirmation of Enrolment the visa was granted for, or starts after the student finishes their principal course.
- **Source:** National Code of Practice 2018, Standards 4.7 and 4.8, as amended by the National Code Amendment (Education Agent Commissions) Instrument 2026. Department of Education fact sheet: https://www.education.gov.au/esos-framework/resources/2025-fact-sheet-education-agents-and-commissions
- **In the data:** an application to an AU institution with `onshore_transfer = true`, no `transfer_exception`, accepted after the cutoff in `settings` (`au_transfer_commission_cutoff`), with a commission claim that is expected, invoiced or paid.
- **Fix:** `npm run agency -- block <ref> --reason="..."`. If an exception applies, record it: `update application <ref> '{"transfer_exception":"course on visa CoE"}'`. `draft-commission-claim` refuses to draft while a breach stands.

## 2. Written agreement with the institution

- **Rule:** Australian providers must have a written agreement with each education agent (National Code Standard 4.2). New Zealand tertiary providers must enter a written contract with each agent (Pastoral Care Code 2021, Outcome 9, Process 2) and schools must manage and monitor their agents (Outcome 14, clauses 58 and 59). An agent sending students without a current agreement is outside those contracts.
- **Sources:** https://www.education.gov.au/esos-framework/resources/standard-4-education-agents and the NZQA guide to managing education agents, https://www2.nzqa.govt.nz/tertiary/the-code/the-code-for-education-providers/guide-to-managing-education-agents/
- **In the data:** an institution with current students or open applications whose `agreement_end` is empty or past (breach), or inside `agreement_warning_days` (due).
- **Fix:** get the renewal signed and record the new dates: `update institution <name> '{"agreement_end":"..."}'`.

## 3. NZ visa advice by a licensed adviser

- **Rule:** No one may give New Zealand immigration advice unless licensed or exempt (Immigration Advisers Licensing Act 2007, s 6). Section 11(h) exempts people giving advice offshore on student visa applications only. The exemption does not cover advice given inside New Zealand, or advice on any other visa type, including a partner or guardian visa for the same family.
- **Sources:** https://www.legislation.govt.nz/act/public/2007/0015/latest/DLM407312.html and https://www.iaa.govt.nz/can-i-give-advice/information-for-education-agents/
- **In the data:** an NZ visa where the adviser has no `nz_adviser_licence` and either `adviser_location = 'onshore'` or the visa is not a student visa.
- **Fix:** hand the file to a licensed adviser and record who advised: `update visa <id> '{"staff_id":"<licensed adviser>"}'`.

## 4. AU visa help from inside Australia by a registered agent

- **Rule:** It is unlawful to give immigration assistance in Australia unless you are a registered migration agent, an Australian legal practitioner or an exempt person (Migration Act 1958, s 280). People giving assistance outside Australia are not covered by the registration scheme.
- **Source:** OMARA consumer guide, https://www.mara.gov.au/get-help-visa-subsite/FIles/consumer_guide_english.pdf
- **In the data:** an AU visa with `adviser_location = 'onshore'` where the adviser has no `au_marn`.
- **Fix:** a registered agent takes the file. Record their MARN on the staff record: `update staff <name> '{"au_marn":"..."}'`.

## 5. Under 18: welfare and guardian arranged

- **Rule:** Australian providers must meet extra obligations for overseas students under 18, including approved accommodation, support and general welfare arrangements (National Code Standard 5). New Zealand providers enrolling international learners under 18 must meet the Pastoral Care Code's rules for those learners, including their accommodation and welfare.
- **Sources:** https://www.education.gov.au/esos-framework/resources/standard-5-younger-overseas-students and the Pastoral Care Code 2021, https://www2.nzqa.govt.nz/tertiary/the-code/
- **In the data:** a student under 18 on the intake date of an open application with no `welfare_arrangement` recorded. Breach inside 30 days of the intake, due before that.
- **Fix:** confirm the arrangement with the school and family, then `update student <name> '{"welfare_arrangement":"...","guardian_name":"..."}'`.

## 6. Personal documents kept past their retention date

- **Rule:** Once personal information is no longer needed, take reasonable steps to destroy or de-identify it (Australian Privacy Principle 11.2). Do not keep personal information longer than needed for the purpose it may lawfully be used for (New Zealand Privacy Act 2020, information privacy principle 9).
- **Sources:** https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-quick-reference and https://www.privacy.org.nz/privacy-principles/9/
- **In the data:** a document with `retain_until` in the past (breach); an alumni or lost student past `privacy_review_on` (due).
- **Fix:** destroy the copy where it is stored, then `update document <id> '{"status":"expired","note":"copy destroyed <date>"}'` and clear `retain_until`. Set your own retention period with `/customise`.

## 7. Passport numbers written into notes

- **Rule:** Take reasonable steps to protect personal information from misuse and unauthorised access (Australian Privacy Principle 11.1; New Zealand information privacy principle 5). Identity numbers typed into free-text notes are copied into every export and every draft built from the history.
- **Sources:** as rule 6, and https://www.privacy.org.nz/privacy-principles/5/
- **In the data:** a note whose text looks like "passport" followed by a passport number.
- **Fix:** notes are append-only here. Remove the number in the database with an explicit yes from the operator, and log that it was removed.

## Your own rules

Add a rule by adding an entry to `rules` in `scripts/lib/domain.mjs` and a section here with its source. `/customise` does both. Keep one rule per law, cite where it comes from, and say what a breach looks like in the data.
