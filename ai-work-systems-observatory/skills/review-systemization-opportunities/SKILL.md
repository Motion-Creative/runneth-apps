---
name: review-systemization-opportunities
description: Review an established Observatory ledger for work that could become a stronger reusable AI system. Use when someone asks "what should we systemize", "where are our AI workflow gaps", "which workflows should become routines", or "review systemization opportunities".
---

# Review systemization opportunities

Identify workflow opportunities without treating people or activity volume as performance.

## Inputs

- Existing `data/system-ledger.json`.
- Existing `data/setup.json`.
- The maturity rubric, evidence rules, and owner-approved success contracts.
- Approved source coverage only.

## Opportunity signals

A workflow can be a candidate when one or more are true:

- The same business job recurs, but execution is still ad hoc.
- A reusable template exists without an owner, trigger, health signal, or maintenance path.
- A system delivers outputs repeatedly, but consumption and use are unverified.
- A high-value decision depends on stale manual collection.
- A workflow has strong use evidence but weak reliability, ownership, or governance.
- Several overlapping systems create duplicate maintenance or inconsistent truth.
- A workflow has enough structure for deterministic collection and agentic interpretation to be separated.

## Exclusions

Do not prioritize from message volume, spend, token use, app count, routine count, or output volume alone. Do not recommend systemizing sensitive or consequential work unless a clear human-control path exists.

## Review method

1. Group opportunities by business job and team, not by individual activity rank.
2. State the evidence that makes each opportunity credible.
3. Label confidence and missing evidence.
4. Propose the smallest next system step: observe, template, assign owner, add trigger, add delivery evidence, add human review, attach outcomes, or validate a baseline.
5. Identify what should remain manual.
6. Keep external action disabled.

## Output

Return a short ranked backlog at the workflow level with:

- Workflow or candidate workflow.
- Current maturity.
- Evidence and confidence.
- Missing operating element.
- Smallest next step.
- Required owner decision.
- Governance or source caveat.

The ranking is a systemization backlog, not a people leaderboard. Use leadership importance, recurrence, reliability risk, evidence quality, and implementation reversibility as the ranking factors.
