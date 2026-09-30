<h1 align="center">Education Agency for Claude Code</h1>

<p align="center">
  <strong>The open-source education agent CRM that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Agentcis data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=agentcis">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/agentcis?utm_source=github&utm_medium=readme&utm_campaign=agentcis">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-agentcis">Instead of Agentcis</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Education Agency for Claude Code does the job you pay Agentcis for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the Agentcis dashboard cannot.

Agentcis charges per user. Its pricing page lists Professional at A$14 per user per month billed monthly (A$10 billed yearly) and Premium at A$30 per user per month billed monthly (A$21 billed yearly), with commission invoicing, payment schedules, the client portal and office check-in only on Premium, plus a A$500 setup service ([agentcis.com/pricing](https://agentcis.com/pricing/), read 30 September 2026). Ten counsellors on Premium, billed monthly, pay A$3,600 a year, and the bill grows with every hire.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=agentcis).

It runs an education agency that places international students with universities, polytechnics, colleges, English schools and high schools: enquiries and where they came from, applications through every stage from submitted to enrolled, offers and their conditions, the document checklist, visas and who advised on them, and the money: commission claims to each institution after census, what is overdue, and what you owe your sub-agents. It is built for agencies of 3 to 50 counsellors in New Zealand and Australia, and the offshore offices that feed them.

## What it does every day and every week

- **Morning** (`/attention`): offers about to expire, deposits overdue, visas not lodged six weeks out, enquiries gone quiet, documents still missing.
- **Moving a student along** (`/stage`, `/offers`, `/documents`, `/visas`): one command per step, every change logged in the student's history.
- **The intake claim run** (`/claim-run`, `/draft-commission-claim`, `npm run docs`): commission claimable after census, grouped by institution, with the tax invoice and covering email drafted.
- **Chasing the money** (`/commissions`, `/slow-payers`, `/paid`): who owes you, for how long, against their agreed terms.
- **Monday review** (`/weekly-review`): the next intakes, money to claim and chase, compliance, and which enquiry sources actually enrol.

## Ten questions the Agentcis dashboard does not answer out of the box

Agentcis has reports, a sales forecast and a business summary on its Premium plan. These are questions you can ask here in plain words, each answered by a command today, and you can change any of them.

1. How much commission can we claim today, and from which institutions? `/claim-run`
2. Which institution pays us slowest after invoice, against its agreed terms? `/slow-payers`
3. Which enquiry source turns into enrolled students, and what commission has each source earned us after sub-agent shares? `/conversion`
4. What commission do we expect each month for the next six months, in each currency, after sub-agent shares? `/forecast`
5. Which offers expire in the next 14 days, and which deposits are overdue? `/offers`
6. Which students start within six weeks with no visa lodged? `/attention`
7. Which commission claims break the Australian ban on commission for onshore transfers? `/compliance`
8. Which visa files were handled by someone not licensed or registered for where they were when they advised? `/compliance`
9. Which institution agreements have lapsed or end in the next 60 days, and how many of our students sit under each? `/institutions`
10. What do we owe each sub-agent from commission the institutions have already paid us? `/sub-agent-payouts`

## Your first hour: ten things to ask for

1. "Put our name, logo and colours on the invoices and checklists" (edit `brand.json`, then `npm run docs`).
2. "Add our counsellors, with Priya's adviser licence and Tom's MARN."
3. "Add our institutions with their agreement dates, commission rates and payment terms."
4. "Import our Agentcis export as a test run."
5. "What needs doing this morning?"
6. "Mei Lin got her unconditional offer, expires 20 October, deposit due the 15th."
7. "Log a WhatsApp from Aarav: bank statements coming Friday."
8. "Run the claim run and draft the invoices for Northshore and Southbank."
9. "Which lead source should we stop spending time on?"
10. "Add a field for the student's preferred city, and put it on the checklist." (`/customise`)

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/education-agency-for-claude-code.git
cd education-agency-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type `/attention` to see what needs a person this morning, or `/claim-run` for the commission you can claim today. The demo is Harbourline Education, a fictional agency with offices in Auckland, Melbourne and Kathmandu: sixteen live students, seven institutions, two sub-agents and two years of placements and commission behind them, with an offer about to expire, a visa not lodged, an onshore transfer whose commission must not be claimed and an institution agreement that has lapsed.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/attention` | Everything that needs a person today |
| `/weekly-review` | The Monday review: intakes, money, compliance, lead sources |
| `/students`, `/student`, `/enquiries` | The caseload; one student's whole story; enquiries by days quiet |
| `/applications`, `/application`, `/stage` | Every open application; one application; move it to its next stage |
| `/intakes`, `/offers` | Who starts when and how ready they are; offers, conditions and deposits |
| `/documents`, `/visas` | The checklist across every application; visas waiting and expiring |
| `/commissions`, `/claim-run` | Commission by state; the intake claim run by institution |
| `/invoice`, `/paid`, `/block` | Mark a claim invoiced; record a payment, full or short; stop a claim |
| `/slow-payers`, `/forecast`, `/sub-agent-payouts` | Who pays late; the next six months; what you owe sub-agents |
| `/institutions`, `/institution`, `/courses` | Agreements, terms and results per institution; the course list |
| `/conversion`, `/counsellors` | Enquiry to enrolment by source; each counsellor's load |
| `/compliance` | Seven record checks, each with its source |
| `/draft-follow-up`, `/draft-offer-chase`, `/draft-document-request`, `/draft-commission-claim` | Emails drafted to `drafts/`. Nothing sends |
| `/log`, `/add`, `/update`, `/tasks`, `/activity` | Notes, new records, changes, tasks, the last 30 days |
| `/import`, `/export` | Agentcis in; everything out |
| `/customise`, `/new-view` | Make it yours; add a dashboard page |

`npm run view` renders the `week`, `pipeline` and `money` dashboards to `views/`. `npm run docs` renders commission claim tax invoices, student checklists and sub-agent statements to `docs-out/`, in your brand. Every command also runs directly: `npm run agency -- help`.

## Instead of Agentcis

Save your Agentcis client, partner, product and application lists as CSV in one folder, then:

```bash
npm run agency -- import agentcis ./agentcis-export            # a test run: counts, stage map, anything unmatched
npm run agency -- import agentcis ./agentcis-export --apply    # write it
```

Staff are created from the assignee names, every row keeps its Agentcis id so a second run adds nothing, and each application keeps its original row as a note. Agentcis's terms say its support team provides the partner, product and client lists on request, for 12 months after the account ends, so ask before you cancel. Uploaded documents, message history and campaigns stay behind. [docs/replace-agentcis.md](docs/replace-agentcis.md) has the column map and what does not carry over.

## Checks, not advice

[docs/compliance.md](docs/compliance.md) lists every record check with its source: the Australian ban on commission for onshore transfers (National Code Standards 4.7 and 4.8), written agreements with each institution, who may give visa advice in New Zealand and Australia, students under 18, and privacy. A clean check means the records are complete, not that the agency meets the law. Nothing here sends email or lodges anything: drafts go to `drafts/` and a person acts.

## Architecture

```
education-agency-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/agency.mjs        the CLI the commands drive
  scripts/lib/domain.mjs    every report as one query, and the compliance rules
  scripts/lib/import.mjs    the Agentcis importer
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     compliance sources, the Agentcis guide, why there is no front end
  views.json, documents.json  dashboards and paperwork, rendered in brand.json
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Education Agency for Claude Code for your business, migrates your Agentcis data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=agentcis)
- Read more: [enterprisedna.co/omni/instead-of/agentcis](https://enterprisedna.co/omni/instead-of/agentcis?utm_source=github&utm_medium=readme&utm_campaign=agentcis)

## License

MIT. Copyright (c) 2026 Enterprise DNA. Not affiliated with Agentcis, IntroCept, the Department of Education, Immigration New Zealand or Anthropic. Agentcis is a trademark of its owner.
