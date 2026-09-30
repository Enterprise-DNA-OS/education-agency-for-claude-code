# Education Agency for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| What needs doing this morning | `/attention` |
| The Monday review | `/weekly-review` |
| One student's story, or the caseload | `/student`, `/students`, `/enquiries` |
| A new enquiry or application | `/add` (student, application), then `/log` |
| A student moved on: submitted, offer, accepted, CoE, visa, enrolled, withdrawn | `/stage`, then `/update` for the offer expiry, conditions and deposit dates |
| Who starts when, and who is not ready | `/intakes`, `/offers`, `/documents`, `/visas` |
| A call, email, WhatsApp, meeting or walk-in | `/log` |
| Commission to claim after census | `/claim-run`, then `/draft-commission-claim` and `npm run docs -- commission-claim`, then `/invoice` |
| Money in from an institution | `/paid` |
| Who owes us, who pays late, what is coming | `/commissions`, `/slow-payers`, `/forecast` |
| What we owe sub-agents | `/sub-agent-payouts` (statements: `npm run docs -- sub-agent-statement`) |
| Agreements and terms with institutions | `/institutions`, `/institution`, `/courses` |
| Where our students come from, who converts | `/conversion`, `/counsellors` |
| Are our records in order (commission rules, agreements, visa advice, under 18, privacy) | `/compliance` (rules and sources in docs/compliance.md), `/block` |
| Emails to students and institutions | `/draft-follow-up`, `/draft-offer-chase`, `/draft-document-request`, `/draft-commission-claim` |
| Tasks and the recent history | `/tasks`, `/activity` |
| Moving off Agentcis | `/import` (read docs/replace-agentcis.md), `/export` |
| A new field, stage, rule or document column | `/customise` |
| A new dashboard page | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run agency -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.
- Never give visa advice. Record what the licensed adviser or registered agent decided. `/compliance` checks who advised from where.
- Never draft a commission claim that `/compliance` flags under the onshore transfer rule. Block it and tell the operator.
- Never put a passport number, visa grant number or bank detail into a note or a draft.
- Recording a payment does not move money. Say so when you record one.
- Keep currencies apart. Never add NZD and AUD together.
- Nothing here is legal or migration advice. Say so when a check comes back clean.
- Import with a test run first. Never seed a real database.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Agentcis.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/agentcis
