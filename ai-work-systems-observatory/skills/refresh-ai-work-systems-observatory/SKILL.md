---
name: refresh-ai-work-systems-observatory
description: Refresh an established AI Work Systems Observatory using its saved source scope and governance rules. Use on "refresh the Observatory", "update the Observatory", "rerun the AI operating review", or a scheduled Observatory refresh.
---

# Refresh AI Work Systems Observatory

Refresh the existing private dashboard without changing its approved scope.

## Preconditions

- Read the app manifest plus `data/setup.json` and `data/system-ledger.json`.
- Treat `data/setup.json` as the saved source and visibility contract.
- A bare "refresh" or "update" reruns every established source unchanged. It does not authorize a new source, wider date range, public visibility, or person-level detail.
- If the app or setup contract is missing, use the setup skill instead of guessing.

## Deterministic refresh

1. Run the local collector against the approved inventory sources.
2. Keep source failures visible and continue with available sources.
3. Validate the collected ledger before replacing app data.
4. Preserve manual baselines, success contracts, owner confirmations, and outcome evidence unless the source explicitly supersedes them.
5. Update execution status, delivery evidence, source coverage, and stale-inference flags.
6. Never convert missing data to zero.
7. Never infer value from activity or cost.

## Agentic reconciliation

When the saved cadence or explicit request includes reconciliation:

1. Review new candidate workflows and changes to existing workflow evidence.
2. Reconfirm ownership only from live account links or explicit owner evidence.
3. Lower confidence or mark stale when confirmation expired.
4. Recalculate maturity only from the documented rubric.
5. Identify systemization opportunities without ranking people.
6. Keep the evidence ladder intact.

## App update

Update the durable JSON files under the existing app `data/` directory. The dashboard runtime-loads this data, so a source-only refresh should not require a rebuild. Build and verify only when source code or the app manifest changed.

## Scope change

If the requester names a new source, visibility rule, cadence, or outcome definition, show the exact change and ask for approval before updating `data/setup.json` or using the new source.

## Completion

Report what changed, which sources succeeded or failed, which inferences became stale, and which decisions now need review. Keep the response short and link the existing app.
