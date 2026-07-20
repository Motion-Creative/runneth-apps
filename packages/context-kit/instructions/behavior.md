# Context Kit package instructions

This package installs the Context Kit: brand knowledge that makes every Runneth answer sharper. It seeds structured-but-empty scaffolds, a status index, the Context Kit board app, and the Context Kit skill.

Naming conventions, per-campaign KPI maps, and the Motion query contract are in the **ad-naming** companion package. Install Context Kit first, then ad-naming.

## Knoweth lane model

Context Kit registers three lanes on first run. The skill handles registration — do NOT use `user.md` guards.

| Lane | What it injects | When it fires |
|---|---|---|
| `context-kit-core` | State, guardrails, legal, source-of-truth, briefing-template | Always |
| `context-kit-brand` | Brand-context, voice, voc, positioning, products, competitors | Creative, briefing, concept turns |
| `context-kit-performance` | KPIs-goal, spend-threshold | Performance and reporting turns |

If **ad-naming** is installed, it registers its own `ad-naming` lane covering the naming decoder, KPI map, and query contract. If **creative-corpus** is installed, it registers its own `creative-corpus` lane. Neither is owned or registered by this package.

## What Runneth should know from moment one

- Board app at `agent_apps/context-kit`. Package sync stages files but does NOT build apps. Build: fill `buildeth.app.json`, then `app build context-kit`.
- Board is client-rendered: fetches `data/context-kit-state.json` and `data/*.md` at runtime. Rebuild only needed for source changes, not content.
- State: `/agent/brain/context-kit/context-kit-state.json` (source of truth), mirrored to `data/context-kit-state.json`.
- Lanes: registered by the skill on first run. Check `lanesRegistered` in state.
- Refresh workflow: registered by the skill on first run. Check `refreshWorkflowId` in state.

## Self-improvement loop (always on)

Fires on every creative-strategy turn.

1. The relevant lane files are already injected. Use them.
2. If a needed file was empty or thin, AFTER the answer:
   - Say plainly what was missing.
   - Make ONE specific offer to capture it.
   - On yes: write the file, mirror to `data/`, update state, refresh INDEX.
3. Keep it to one offer per turn.

## Bucket A import contract

Each Auto-filled item uses two sections:
- `## Latest Import From Motion` — most recent value from Motion.
- `## Runneth Instructions` — customer corrections and rules.

On conflict, follow `Runneth Instructions`. A refresh updates only `Latest Import From Motion`.

## Integration source guides (Your tools tab, Bucket D)

Files at `/agent/brain/context-kit/integrations/<source>.md`, mirrored to `data/integrations/<source>.md`. The ad-platform guide (the account-specific Motion query contract) is provided by ad-naming when installed — do not create it here. Other guides use thoughtStarters until the customer connects that source.

## Rules

- Never write into `user.md`.
- Prefer importing from Drive/Notion before asking the customer to type.
- Scaffolds are create-if-absent. Never overwrite a file the customer has filled.
- Refresh INDEX.md as each item is filled.
