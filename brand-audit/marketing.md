---
hero_headline: "The brand layer. Built once, refreshed weekly, read by everything downstream."
hero_subhead: "Brand identity, products, voice-of-customer, keywords, competitor read, and the pain × persona × angle matrix — six durable files every concept brief and deep dive reads."
install_time: "~2 minutes for the first audit, ~30 seconds per workspace after"
requires: "Brand website URL"
---

## Super powers this unlocks

- Six durable markdown files capture the strategic brand foundation in a structure the rest of the framework reads automatically.
- Every creative deep dive's Strategic Layer section reads `strategy.md` — no re-deriving persona × pain × angle for every ad.
- Every weekly deck cross-checks proposed iteration recommendations against the persona matrix so the team isn't shipping creative for unvalidated personas.
- Reviews, keywords, and competitor signal stay current. Monday refresh catches what shifted over the weekend before Friday's deck.
- Every skill inside is independently callable. Refresh just the review-audit after a new VOC export. Run competitor-analysis standalone after a launch announcement.

## How it works

The audit runs six skills in order: brand-intake → product-catalog → review-audit → brand-relevant-keywords → competitor-analysis → creative-strategy-engine. Each produces its own markdown file in `/agent/brain/brand-audit/<workspace-slug>/`. The final file (`strategy.md`) is the pain × persona × messaging-angle matrix across 5 awareness stages — the file the rest of the framework references on every creative task.

On first run, a single block gets appended to `/agent/user.md` telling Runneth to read the relevant brand-audit files before any creative-strategy work. Narrow reads, not full re-runs. The Monday 8am refresh keeps the bundle current.

Every one of the six underlying skills is also independently callable. If someone asks Runneth to "refresh the competitor read for client X," competitor-analysis runs standalone and updates only its file. The full orchestrator is for the first build and the Monday refresh.

## A real example

Justin at Hungryroot installs brand-audit once. Brand-intake reads hungryroot.com. Product-catalog enumerates the 30+ products and their benefits. Review-audit mines Trustpilot, Amazon reviews, and an uploaded NPS export — surfaces the "5pm panic" pain point as the dominant VOC theme. Competitor-analysis pulls active Meta ads from HelloFresh, Blue Apron, Green Chef. Creative-strategy-engine produces the matrix: "Unconfident Home Cook × evening-rush panic × first-delivery framing" is one validated cell; "Health-Conscious Parent × hidden-veggies × cookbook authority" is another.

When Justin asks two weeks later for a deep dive on FUN34166 ("the 5:30 first delivery ad"), creative-deep-dive doesn't re-mine reviews or re-survey competitors — it reads `strategy.md`, finds the "Unconfident Home Cook × evening-rush" cell, and grounds the strategic-layer section of the diagnostic in that pre-validated framing.

When the Monday refresh runs and Trustpilot shows three new reviews complaining about packaging waste, the diff post lands in #growth-team noting "new pain point appearing: packaging concern, 3 mentions in last 7 days." Justin reacts ✅. The strategy matrix updates to add a new cell. By Friday's deck, the team is already considering test variants that address packaging in the messaging.
