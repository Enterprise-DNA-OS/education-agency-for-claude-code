---
description: Log a call, email, WhatsApp, meeting or walk-in against a student.
---

Run `npm run agency -- log <student> "<kind>: <what happened>"` where kind is call, email, whatsapp, meeting or walk-in. Add `--on=YYYY-MM-DD` for an earlier day. Last contact moves forward on its own.

Never write a passport number, visa grant number or bank detail into a note. If there is a next step with a date, add a task: `npm run agency -- add task '{"student_id":"<name>","title":"...","due_on":"..."}'`.
