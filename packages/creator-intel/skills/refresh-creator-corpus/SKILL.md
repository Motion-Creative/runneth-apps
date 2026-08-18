---
name: refresh-creator-corpus
description: Refresh Creator Intel evidence and freshness for one activated workspace. Use for an explicit manual update or a separately approved scheduled refresh. It updates evidence and pending review only, never trusted decisions.
triggers:
  phrases:
    - refresh creator evidence
    - refresh creator intel for
    - update creator evidence
    - update creator intel
  intent: Refresh Meta evidence and freshness without changing trusted roster, rights, or recommendations.
---

# Refresh Creator Intel

Refresh updates evidence only. Trusted roster, relationship, rights, and recommendation decisions stay human-owned.

## Hard rules

- Manual refresh is the default.
- A scheduled refresh requires separate consent, owner, cadence, and delivery.
- Refresh must never silently create or change trusted identities, relationships, rights, or disqualifications.
- Use the stored workspace id on every Motion pull.
- Default to Meta. Do not ask about Northbeam. Only include another source if the workspace performance measure already names one.
- Maintain per-source freshness and partial-failure state. Do not collapse the run into one fake global timestamp.
- Use 30, 90, and 365 day language only. Never call 365 days all-time.

## What refresh may update

- new evidence rows in `evidence-map.json.evidence[]`
- new pending proposals in `pending-review.json.items[]`
- source freshness and failure details in `refresh-state.json.sources[]`
- new Meta performance snapshots under `performance/` (created on demand, e.g. `meta-30d.json`; never pre-created)
- one canonical append-only audit event per source attempt in `audit.jsonl`, including partial failures

## What refresh may not update

- confirmed roster decisions
- relationship state
- rights state
- recommendation outcome claims unless a launched ad or brief carries the exact stored recommendation id

## Evidence rules

- Include spend-bearing ads without synced Motion creative assets in eligible and unassigned accounting.
- Recalculate rates from totals. Never average ROAS, CTR, or CPA.
- Store date range, source, currency, attribution, filters, grain, matched coverage, and metric definitions alongside each snapshot.

## Failure handling

If one source fails, record the failure on that source only and keep successful source updates. A search or tool error is not an empty result.

## Manual update completion

A manual update always confirms completion and summarizes:

- **What changed**
- **Needs your review**
- **Could not refresh**
- **What stayed unchanged**

If nothing changed, a manual update still says it finished and that nothing changed. Only a scheduled refresh may stay quiet when nothing changed.
