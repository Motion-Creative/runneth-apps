---
name: review-creator-identities
description: Apply human confirmation, correction, merge, alias, disqualification, relationship, and rights decisions to pending creator proposals for one activated workspace. Use only when the customer is explicitly reviewing named candidates or pending identity decisions.
triggers:
  phrases:
    - review pending creator identities
    - apply these creator decisions
    - confirm these creator matches
    - merge these creator records
  intent: Apply human decisions to named creator proposals and audit the result.
---

# Review creator identities

This is the human confirmation gate. It is the only skill that can turn pending proposals into trusted local decisions.

## Hard rules

- Silence changes nothing.
- Partial answers affect only the named candidates.
- Existing confirmed entries do not let new candidates bypass review.
- `[AUTO]` or pending proposals never become trusted without explicit confirmation.
- Corrections, merges, alias changes, and disqualifications must be auditable.
- Rights are a separate decision from identity or relationship confirmation.

## Allowed decision types

- confirm a candidate as a trusted creator identity
- reject a candidate
- mark a candidate unresolved but keep them pending
- merge duplicate candidates into one stable creator id
- attach current and previous handles as aliases
- record whether the customer already works with the creator and the creator's production role, such as UGC creator or on-camera talent
- record disqualification and its reason
- record or defer usage rights separately, including brand ads, partnership ads from the creator's account, and organic content

## What to update

- `identities.json.identities[]`: stable creator ids, Motion creator ids when known, canonical names, aliases, merge history, correction history, audit timestamps
- `relationships.json.relationships[]`: workspace relationship state, disqualification state, hard eligibility flags
- `rights.json.rights[]`: explicit rights decisions and unresolved rights follow-up
- `pending-review.json.items[]`: remove or update only the named candidates
- `audit.jsonl`: append one canonical event for each decision type with the exact affected ids

## Explicit boundaries

- Do not infer rights approval from confirmation.
- Do not infer performance ownership from identity confirmation.
- Do not backfill unmentioned candidates just because one candidate was confirmed.
- Do not remove upstream provenance just because the local decision differs. Keep both and mark the confirmed local decision as authoritative for behavior.

## Rights follow-up

After a creator relationship is confirmed, if rights are still unknown, ask exactly:

> What can you use this creator for: brand ads, partnership ads from their account, organic content, or are you not sure?

## Visible completion requirements

The visible completion must:

- state the exact changes that were applied
- list which people are still pending and why
- say when rights were left unchanged
- keep rights decisions separate from identity confirmation
