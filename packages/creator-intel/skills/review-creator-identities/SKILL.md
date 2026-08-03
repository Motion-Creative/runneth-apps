---
name: review-creator-identities
description: Apply human confirmation, correction, merge, alias, disqualification, and relationship decisions to pending creator proposals for one activated workspace. Use only when the customer is explicitly reviewing named candidates or pending identity decisions.
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

## Allowed decision types

- confirm a candidate as a trusted creator identity
- reject a candidate
- mark a candidate unresolved but keep them pending
- merge duplicate candidates into one stable creator id
- attach current and previous handles as aliases
- record workspace relationship state such as UGC, paid media, organic, partnership, or whitelisting
- record disqualification and its reason

## What to update

- `identities.json`: stable creator ids, Motion creator ids when known, canonical names, aliases, merge history, correction history, audit timestamps
- `relationships.json`: workspace relationship state, disqualification state, hard eligibility flags
- `pending-review.json`: remove or update only the named candidates
- `audit.jsonl`: append the exact human decision and affected ids

## Explicit boundaries

- Do not infer rights approval from confirmation.
- Do not infer performance ownership from identity confirmation.
- Do not backfill unmentioned candidates just because one candidate was confirmed.
- Do not remove upstream provenance just because the local decision differs. Keep both and mark the confirmed local decision as authoritative for behavior.
