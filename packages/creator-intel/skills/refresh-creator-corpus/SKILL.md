---
name: refresh-creator-corpus
description: Manually refresh creator evidence, freshness metadata, and pending review queues for one activated workspace. Use only for explicit refresh asks or for a separately approved scheduled refresh.
triggers:
  phrases:
    - refresh creator evidence
    - refresh creator intel for
    - update creator evidence
  intent: Refresh evidence and freshness state without changing trusted roster or rights.
---

# Refresh creator corpus

Refresh updates evidence only. Trusted roster, relationship, rights, and recommendation decisions remain human-owned.

## Hard rules

- Manual refresh is the default.
- Scheduled refresh requires separate consent, owner, workspace, cadence, and delivery.
- Refresh must never silently create or change trusted identities, relationships, rights, or disqualifications.
- Maintain per-source freshness and partial-failure state. Do not collapse the run into one fake global timestamp.
- Use the stored workspace id on every Motion pull.

## What refresh may update

- new evidence rows in `evidence-map.json`
- new pending proposals in `pending-review.json`
- source freshness and failure details in `refresh-state.json`
- new performance snapshots under `performance/`
- append-only audit entries in `audit.jsonl`

## What refresh may not update

- confirmed roster decisions
- relationship state
- rights approval state
- recommendation outcome claims unless a launched ad or brief carries the exact stored recommendation id

## Evidence refresh rules

- Keep Meta and Northbeam separate.
- Use 30, 90, and 365 day language only. Never call 365 days all-time.
- Include spend-bearing ads without synced Motion creative assets in eligible and unassigned accounting.
- Recalculate rates from totals. Never average ROAS, CTR, or CPA.
- Store date range, source, currency, attribution settings, filters, grain, matched coverage, and metric definitions alongside each snapshot.

## Failure handling

If one source fails, record the failure on that source only and keep successful source updates. A search or tool error is not an empty result.
