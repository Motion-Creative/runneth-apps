---
name: refresh-creator-corpus
description: Update Creator Intel for one activated workspace by refreshing creator evidence, freshness metadata, and pending review queues. Use only for an explicit manual update or for a separately approved scheduled refresh.
triggers:
  phrases:
    - refresh creator evidence
    - refresh creator intel for
    - update creator evidence
    - update creator intel
  intent: Refresh evidence and freshness state without changing trusted roster or rights.
---

# Update Creator Intel

Update Creator Intel refreshes evidence only. Trusted roster, relationship, rights, and recommendation decisions remain human-owned.

## Hard rules

- Manual refresh is the default.
- Scheduled refresh requires separate consent, owner, workspace, cadence, and delivery.
- Refresh must never silently create or change trusted identities, relationships, rights, or disqualifications.
- Maintain per-source freshness and partial-failure state. Do not collapse the run into one fake global timestamp.
- Use the stored workspace id on every Motion pull.
- Keep Meta and Northbeam separate.
- Use 30, 90, and 365 day language only. Never call 365 days all-time.

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

- Include spend-bearing ads without synced Motion creative assets in eligible and unassigned accounting.
- Recalculate rates from totals. Never average ROAS, CTR, or CPA.
- Store date range, source, currency, attribution settings, filters, grain, matched coverage, and metric definitions alongside each snapshot.

## Failure handling

If one source fails, record the failure on that source only and keep successful source updates. A search or tool error is not an empty result.

## Manual update completion

A manual update must always confirm completion and summarize these sections:

- **What changed**
- **Needs your review**
- **Could not refresh**
- **What stayed unchanged**

If nothing changed, a manual update still says it finished and that nothing changed. Only a scheduled refresh may stay quiet when nothing changed.
