---
name: static-template-library
description: >
  Run on "harvest templates", "build the template library", "mint new templates",
  "refresh the template pack", or the library cadence in config. Harvests competitor
  and cohort statics the workspace already accesses, classifies each against the
  existing pattern list, and mints net-new reusable format templates
  (layout/scene/on-image-copy prompt skeletons only) into the routing index with
  priority order and tag maps. UNKNOWN classifications are surfaced for human
  correction, never silently skipped.
---

# Static Template Library

The template engine behind `generate-static-ads`. Canonical files under
`/agent/brain/static-ad-generation/<scope>/templates/`:

- `routing-index.json` — pattern list, priority order, maps from performance-tag
  values to templates, tag-to-mechanic maps.
- `prompt-pack.md` — the reusable pattern prompts.
- `guaranteed-queue.json` — newly approved templates that get a generation slot
  regardless of score, then move to its generated list.

Any older registry/config set found in the workspace is archived material: never read
it, never write to it.

## Harvest

Pull competitor and cohort statics from sources the workspace already accesses
(ad-platform creative pulls for recent windows, shared folders, channels where the
team drops swipes). No new scraping sources — if the team wants a source connected,
that goes through the standard integration connect flow.

## Classify

Read each static against the existing pattern list:

- **Match** — an existing pattern covers it; record the sighting (frequency feeds
  priority order).
- **Variant** — an existing pattern with a meaningful twist; note the twist as a
  candidate mechanic.
- **Net-new** — no pattern covers it; candidate for minting.
- **UNKNOWN** — cannot classify; surface it immediately with its identifying signals
  for a human call. Never silently skip.

## Mint

For each net-new pattern (and approved variant):

1. Write the prompt skeleton into `prompt-pack.md`: structure/layout, scene, on-image
   copy slots, staging, ratio. Template text never contains product geometry or brand
   names — patterns must render for any product with that product's reference photos.
2. Register it in `routing-index.json` with its performance tags, mechanic tags, and a
   starting priority.
3. When the team approves a minted template for guaranteed testing, add it to
   `guaranteed-queue.json` so the next generation run gives it a slot regardless of
   score.

## Prune and reorder

On each pass: bump priority for patterns with fresh winning signal (own-account first,
cohort second), demote patterns the learning logs suppress, and flag stale patterns
(no sightings, no wins, fully covered in the dedup ledger) to the user before removing
anything. Removal is always confirmed, never silent.
