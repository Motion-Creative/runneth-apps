---
name: build-and-confirm-roster
description: Build the creator roster from naming conventions and the connected creator database, then confirm every creator with the person in one pass. Use when someone sends their roster, points at their creator database, or asks to build or confirm the roster. This is the single identify-and-confirm skill.
triggers:
  phrases:
    - build the roster from
    - build our creator roster
    - review this creator tracker
    - confirm my creators
    - import this creator roster
    - scan these ad names for creators
  intent: Turn naming conventions and the creator database into a confirmed roster in one table, driving all open questions to zero.
---

# Build and confirm the roster

This is the single roster skill. It replaces the older separate propose and review steps. It identifies creators from real sources, shows them in one table, and drives every open question to zero with the person. It is the human confirmation gate: nothing becomes trusted without an explicit yes.

## Requirements

- The workspace must be set up at `/agent/brain/creator-intel/workspaces/<workspaceId>/`.
- Work from explicit sources only: the connected creator database (Notion, sheet, Asana, etc.) and Meta ad-name evidence built from the workspace naming conventions.

## How to build

1. Read the connected roster source for names, handles, talent type, and any rights column.
2. Pull the full creator library with the stored workspace id using `motion meta ads --grain ads --include-associated-objects --date-range last_365d` with no `--limit`, paging through every result. This is a full-library pull over the last 365 days, not a recent-window sample, so every creator with any ad in the year is included. Treat ad rows, ad names, associated creative assets, and ads without synced Motion creative assets as evidence.
3. Tie ads to creators using the stored `adCreatorNamingConvention` from setup. If it was not captured or is uncertain, infer the pattern from the ad names, show the person the pattern you found, and confirm it before trusting any match. Match Meta to the database where possible. Where a match is not possible, keep the creator as unresolved rather than dropping them. Skip matching cleanly when there is nothing to match.
4. For creator resolution against Motion, use `motion inspo creators` for exact name or handle. If a broad search hits the known schema issue, say the search failed and fall back to supported category, follower, or exact name and handle pulls. A tool error is not an empty result.
5. Capture per creator: identity and handles, talent type, the simple rights object, and what the creator represents (their topics and the angles they can carry). Representation matters because Stage 4 gap analysis depends on it.

## Rights are simple here

Store rights as one object on the relationship record, not a separate ledger:

- `usageScope`: `none | some | all`
- `whitelisting`: boolean
- `expiryNote`: optional free text

If the roster source has a rights column, read it. Otherwise apply the setup default and confirm per creator only where it is unknown.

## One table, all open questions, drive to zero

The customer-facing review is **one table of every creator** from the full-year pull, not batched and never truncated. List every creator, even when there are many; do not show only the top few or a sample. Alongside it, show a single overview of every open question grouped as:

- Ready to confirm
- Needs your input
- Could not match
- Conflicts

For each creator show name, handle, matched profile when available, talent type, source, and the exact uncertainty. Then end with:

> Confirm the clear ones, or correct anyone by name. Anything you do not mention stays pending.

Silence changes nothing, and partial replies affect only the named creators. Apply only the decisions the person names. New or removed upstream entries never silently change a confirmed local decision. When a confirmed creator still has unknown rights, ask once:

> What can you use this creator for: brand ads, partnership ads from their account, organic content, or are you not sure?

The skill is not done until it has walked every open item and confirmed there are no pending creators left, or the person has explicitly chosen to leave specific ones pending.

## What to write

- `identities.json.identities[]`: stable creator ids, handles, aliases, Motion creator id when known, representation topics and angles, correction and merge history, timestamps
- `relationships.json.relationships[]`: relationship types, disqualification state, hard eligibility, and the simple rights object
- `evidence-map.json.evidence[]`: the ad to creator mapping ledger
- `pending-review.json.items[]`: update or clear only the named creators
- `audit.jsonl`: one canonical event per decision batch with the exact affected ids

## Boundaries

- Do not infer rights approval from identity confirmation.
- Do not credit full performance to every creator in a mashup or flexible ad.
- Do not treat an internal editor or owner token (for example an editor field in the ad name or an owner column) as the on-camera creator. The creator is the talent tag, not whoever edited or owns the ad.
- Do not backfill unmentioned creators because one was confirmed.
- Keep upstream provenance even when the local decision differs, and mark the local decision authoritative.
