# Ad Naming package instructions

This package builds the account intelligence layer: naming decoder, per-campaign KPI map, and Motion query contract. Install after Context Kit, before Creative Corpus.

## Knoweth lane

One lane covers all three ad-naming brain files:

| Lane ID | Path | Patterns |
|---|---|---|
| `ad-naming` | `/agent/brain/ad-naming/` | `naming-decoder.md`, `kpi-map.md`, `query-contract.md` |

The skill registers this lane on first run. Check `lanesRegistered` in `/agent/brain/ad-naming/ad-naming-state.json`.

## What each file does

- **naming-decoder.md** — the account's ad naming taxonomy: each dimension (prefix, full name, observed values, plain-language meanings), a decode template, and worked examples. Used by the creative corpus to decode ad names in corpus files. Used by the agent to decode any ad name in chat.
- **kpi-map.md** — per-campaign KPI targets: one row per campaign segment derived from the naming decoder, showing the optimization target, dominant conversion event, and decision rules (testing cut / graduation threshold). Supplements `kpis-goal.md` in Context Kit.
- **query-contract.md** — the account's Motion CLI contract: workspace ID, attribution windows (click/view), conversion events with their exact metric keys, thumbstop availability, and data-layer gotchas (null fields, timeout risks). Read before any performance pull.

## Read-before-work rules

- Before any performance or reporting turn: read `query-contract.md` for attribution windows and metric key contracts.
- Before any ad name analysis: read `naming-decoder.md` to decode dimensions.
- Before any campaign-level analysis or KPI comparison: read `kpi-map.md`.

The `ad-naming` lane injects these automatically. If a file is still empty, say so rather than inferring.

## Refresh workflow

Registered by the skill on first run. Refreshes all three files from live Motion data on demand or on the weekly schedule offered after first build. Saves `refreshWorkflowId` and `refreshTaskId` in state.

## Works independently

Ad Naming does not require Context Kit to be installed, though the two are designed to be used together. If Context Kit is installed, the ad-naming skill can supplement `kpis-goal.md` in the context-kit board by adding the per-campaign KPI map as a linked reference.

## Rules

- Never write ad-naming content into `user.md`.
- naming-decoder.md and kpi-map.md are derived from real Motion data — status `drafted`. If Motion is unavailable, status `inferred` with sourceNote.
- query-contract.md is auto-discovered on first run. Customer review recommended before treating as canonical.
