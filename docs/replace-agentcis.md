# Moving off Agentcis

Agentcis holds four lists you need: clients (its contacts), partners (the institutions), products (the courses) and applications. Bring them across in one command, check the counts, then run both systems side by side for one intake.

## 1. Get your data out

- **From the lists.** Where a list or report in your account offers an export, export it and save it as CSV. What is offered depends on your plan and your user role.
- **From Agentcis support.** Agentcis's terms say all data, including the partner list, product list and client list, will be provided by the Agentcis support team on request, and stays available for 12 months after the account ends and no later. Ask for it before you cancel. Terms as shown on the Agentcis sign-in page, read 30 September 2026.

Save the files into one folder with these names. Any you do not have can be left out.

| File | What it is | Columns read (any of these names) |
|---|---|---|
| `clients.csv` | Contacts: enquiries, prospects and clients | Client ID, First Name, Last Name (or Name), Email, Phone, Country of Passport (or Nationality), Date of Birth, Contact Type, Source, Assignee, Passport Expiry, Added On |
| `partners.csv` | Institutions | Partner ID, Partner Name (or Name), Country, Currency, Email |
| `products.csv` | Courses | Product ID, Product Name, Partner, Fees, Duration (weeks), Intakes |
| `applications.csv` | Applications | Application ID, Client ID (or Client name), Partner, Product, Stage, Status, Intake, Assignee, Started At |

Column names differ between accounts and custom fields. The importer matches each column by several names and ignores case. If one of yours is not picked up, add its name to the matching `pick(...)` call in `scripts/lib/import.mjs`, or ask Claude Code to.

Dates in `dd/mm/yyyy`, ISO `yyyy-mm-dd` and `Feb 2027` are all read.

## 2. Test run

```bash
npm run agency -- import agentcis ./agentcis-export
```

Nothing is written. You get the counts of staff, institutions, courses, students and applications it would add, anything it could not match (an application whose client is not in `clients.csv`), and the stage map: each Agentcis workflow stage and the stage it becomes here.

Agentcis workflows are set up by each agency, so stages are matched by the words in them: "Offer Letter" becomes `conditional_offer`, "Visa Application" becomes `visa_lodged`, "Discontinued" becomes `withdrawn`. If any land wrong, change `mapStage` in `scripts/lib/import.mjs` and run the test again.

## 3. Import

```bash
npm run agency -- import agentcis ./agentcis-export --apply
```

Every row keeps its Agentcis id, so a second run adds nothing. Each imported application gets a note holding the original Agentcis row, so nothing in the export is lost.

## 4. After the import

1. Set each institution's agreement dates and commission terms: `npm run agency -- update institution "<name>" '{"agreement_end":"2027-06-30","commission_pct":15,"commission_basis":"first_year","pays_within_days":30}'`.
2. Add the offer expiry, conditions and deposit dates for open offers (`/offers` will then keep watch).
3. Add visas in progress with who advised and from where (`/add visa`), so `/compliance` can check them.
4. Add commission claims already raised in Agentcis for students enrolled before the switch (`/add commission`), and anything still owed.
5. Run `/attention` and `/compliance` and work the list.

## What maps

| Agentcis | Here |
|---|---|
| Contact (enquiry, prospect, client) | `students`, with `stage` enquiry, prospect or client |
| Assignee | `staff` (created by name if new) |
| Partner | `institutions` |
| Product | `courses` |
| Application and its workflow stage | `applications` and `stage` |
| Notes and activities | Not in the list exports. Ask support for them with the data request, or keep them in Agentcis as a read-only record. |

## What does not carry over

- **Uploaded documents.** The files stay where they are. The checklist here tracks what you have, not the files. Export them before the account closes.
- **Email and SMS history, campaigns and templates.** Draft replies here are written from the history you log.
- **Quotations, payment schedules and invoices you sent students.** Bring the balances across as tasks, or ask us to build the student fee side into your version.
- **Commission invoices already raised in Agentcis.** Add the open ones by hand so the ledger is right from day one.
- **The client portal, agent portal and lead forms.** There is no front end here. See `docs/why-no-front-end.md`.

Enterprise DNA does the whole move for you, maps your own custom fields and stages, and checks the counts with you: https://enterprisedna.co/omni/instead-of/agentcis
