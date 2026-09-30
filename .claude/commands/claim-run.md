---
description: The intake claim run: commission claimable now, grouped by institution, ready to invoice.
---

1. Run `npm run agency -- claim-run`.
2. Run `/compliance` first. Any claim flagged under the AU onshore transfer rule must not be claimed: block it with `npm run agency -- block <ref> --reason="..."`.
3. For each institution the operator approves: `npm run agency -- draft-commission-claim <institution>` writes the covering email to `drafts/`, and `npm run docs -- commission-claim` renders the tax invoice to `docs-out/`.
4. Once the invoice number is issued from the accounting system: `npm run agency -- invoice <institution> --invoice=<number>`.

Nothing sends from here.
