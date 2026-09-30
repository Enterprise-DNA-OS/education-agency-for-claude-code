---
description: Move an application to its next stage (submitted, conditional_offer, unconditional_offer, accepted, coe_issued, visa_lodged, visa_granted, enrolled, completed, withdrawn, refused, deferred).
---

The operator says something like "Mei Lin got her unconditional offer" or "HL-1003 visa granted".

1. Find the application (`npm run agency -- application <ref>` or `/student <name>`). If the student has more than one open application, ask which.
2. Run `npm run agency -- stage <ref> <stage>` with `--on=YYYY-MM-DD` if it happened on another day and `--reason="..."` for withdrawn, refused or deferred.
3. The stage change is logged as a note. Moving to `enrolled` creates the expected commission claim from the institution's terms: say what it is.
4. For an offer, record the expiry and conditions: `npm run agency -- update application <ref> '{"offer_expires_on":"...","conditions":"..."}'`.
