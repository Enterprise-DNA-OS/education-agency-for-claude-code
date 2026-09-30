---
description: Bring your Agentcis clients, partners, products and applications across.
---

Read `docs/replace-agentcis.md` first.

1. Put the Agentcis exports as CSV in one folder: `clients.csv`, `partners.csv`, `products.csv`, `applications.csv` (any that exist).
2. Dry run: `npm run agency -- import agentcis <folder>`. Show the counts, the stage map (Agentcis stage to ours) and anything unmatched.
3. If a stage mapped wrong, fix it in `scripts/lib/import.mjs` (`mapStage`) and run the dry run again.
4. Only when the operator says yes: add `--apply`. A second run adds nothing.
5. After it: set each institution's agreement dates and commission terms with `/update institution`.
