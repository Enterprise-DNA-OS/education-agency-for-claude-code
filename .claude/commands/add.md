---
description: Add any record: a student, application, institution, course, document, visa, sub-agent, task or staff member.
---

Run `npm run agency -- add <type> '<json>'`. `npm run agency -- help` lists the fields for each type. Link fields (`student_id`, `course_id`, `staff_id`, `institution_id`) accept a name or ref and are matched for you.

A new application without a `ref` gets the next HL number. A new enquiry is `add student '{"name":"...","source":"...","interested_in":"..."}'`.
