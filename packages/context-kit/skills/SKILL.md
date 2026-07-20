---
name: context-kit
description: Builds a customer's Context Kit, the brand knowledge that makes every Runneth answer sharper. Reads the Context Kit state index, confirms what Motion knows, drafts brand-context and every Bucket B item from Motion creative data before asking anything, imports what already lives in Google Drive or Notion, and collects what only the customer knows. Triggers on "build my context kit", "set up my context kit", "context kit", "build my brain", "sharpen Runneth", "what do you still need from me", "what does Runneth know about us".
---

# Context Kit skill

Turn a fresh brain into a filled one. The board app is the mirror; this skill is the doer. Draft from Motion data first, then import, then collect. Never write to `user.md`.

Naming conventions, per-campaign KPI maps, and the Motion query contract are handled by the **ad-naming** companion package. Install that after Context Kit when the account has a structured naming system.

## Single source of truth

Every one of the 15 files lives in `/agent/brain/context-kit/<item-id>.md` and is mirrored to `/agent/apps/context-kit/data/<item-id>.md` so the board can fetch it.

Item ids: brand-context, kpis-goal, spend-threshold, competitors, products, positioning, voice, voc, legal (file legal-compliance.md), briefing-template, source-of-truth, guardrails, media-buying, business-team, landing-pages.

Integration guides: `/agent/brain/context-kit/integrations/<source>.md`, mirrored to `data/integrations/<source>.md`.

## Status meaning
- `confirmed` / `imported`: locked in by the customer (green).
- `drafted`: built from ACTUAL Motion data. Must carry real data, not general knowledge.
- `inferred`: written from general brand knowledge because Motion was unavailable. MUST carry a `sourceNote`.
- `missing`: nothing yet.

## Step 0 — Load state + set brand name

1. Read `/agent/brain/context-kit/context-kit-state.json`.
2. Set top-level `brandName` from `motion workspaces` or brand context before the first state write.
3. Run `motion brand-context --data-query "summary"`, `motion workspace-goal`, `motion spend-threshold`.
4. Note which context sources are connected (Google Drive, Notion, reviews platform).

## Step 0b — Register Knoweth lanes (first run only)

If `context-kit-state.json` shows `lanesRegistered: false` or the field is absent, register the three core lanes before any brain writes:

| Lane ID | Path | Patterns |
|---|---|---|
| `context-kit-core` | `/agent/brain/context-kit/` | `context-kit-state.json`, `guardrails.md`, `legal-compliance.md`, `source-of-truth.md`, `briefing-template.md` |
| `context-kit-brand` | `/agent/brain/context-kit/` | `brand-context.md`, `voice.md`, `voc.md`, `positioning.md`, `products.md`, `competitors.md` |
| `context-kit-performance` | `/agent/brain/context-kit/` | `kpis-goal.md`, `spend-threshold.md` |

Set `lanesRegistered: true` in state. Do not re-register on subsequent runs.

## Step 0c — Keep Motion work in the agent turn

Run every `motion` command directly in this agent turn. Do not put Motion calls in
`task.bash` or script-mode routines: task-scoped broker tokens cannot access the
trusted Motion tool. Deterministic local file processing may use bash.

## Step 1 — Build and open the board (first run only)

Fill `/agent/apps/context-kit/buildeth.app.json` (replace `__CONVERSATION_ID__` and `__WORKSPACE_ID__`), run `app build context-kit`, then `app list` for the URL.

## Step 2 — Bucket A: confirm and auto-draft brand-context

- **kpis-goal:** show the live Motion workspace-goal value. Present, confirm, write the full doc with `## Latest Import From Motion` and blank `## Runneth Instructions`. Mark `confirmed`. Note: the per-campaign KPI map is handled by the **ad-naming** package.
- **spend-threshold:** same pattern.
- **brand-context:** if `motion brand-context` has content, show and confirm; if empty, draft from `motion meta insights --date-range last_30d --sort topSpend --include-metrics`. Foundation only (brand name, origin story, positioning, product description, proof points, 2-sentence tone, 2-sentence audience). Present, confirm, write, save to workspace config, mirror, mark `confirmed`.

## Step 3 — Proactive import + connect offers

If any Bucket B/C item is missing:
- Drive/Notion connected: offer to search there first.
- No reviews platform: suggest connecting it (powers voice-of-customer).

Import confirmed docs, mirror, mark `imported`.

## Step 4 — Bucket B: glossary spine, then draft each item

Pull the ground-truth spine once:
1. `motion ai-glossary`
2. Run:
   ```
   motion meta insights \
     --date-range last_30d \
     --sort topSpend \
     --glossary-category intended-audience \
     --glossary-category messaging-angle \
     --glossary-category hook-tactic \
     --glossary-category visual-format \
     --glossary-category asset-type \
     --glossary-category offer-type \
     --glossary-category seasonality
   ```
   Read the returned category data for each creative.
3. For VoC, take up to 20 top-spend creative asset IDs and enrich them in batches of
   no more than 15:
   ```
   motion meta insights \
     --scope creative-asset-id \
     --creative-asset-id <id> \
     --date-range last_365d \
     --summary-sections hookOrHeadline \
     --summary-sections creativeBreakdown \
     --summary-sections messagingAndPositioning \
     --summary-sections emotionalAndAudienceInsight \
     --summary-sections adDescription
   ```
   Repeat `--creative-asset-id` for each ID in the batch.

Category-to-item mapping:
- `intended-audience` → positioning + voc
- `messaging-angle` → positioning + voice
- `hook-tactic` → voice + voc
- `visual-format` + `asset-type` → voice
- `offer-type` → products
- `seasonality` → products + competitors

Per-item fallback chain (explicit, sequential):
1. Motion glossary spine + summary sections → draft, status `drafted`.
2. Motion empty → Drive/Notion if connected → status `imported`.
3. Neither → general brand knowledge → status `inferred` + `sourceNote`.
4. Still unreliable → leave `missing`, show thought starters.

After each: mirror to `data/<id>.md`, tell the user what was drafted.

**voice**: 4-6 named characteristics with sounds-like/doesn't-sound-like pairs.
**voc**: 7-category swipe file (pain, emotional language, desire, before/after,
objections, competitor complaints, trigger events). Preserve exact customer-facing
language when present in summary sections; do not label generated prose as a transcript.

## Step 5 — Bucket C: collect with depth

legal, briefing-template, source-of-truth, guardrails, media-buying, business-team, landing-pages: file drop when they have it, thought starters when stuck. Write, mirror, mark `confirmed`.

## Step 6 — Keep the map correct

- Refresh `/agent/INDEX.md` for all `/agent/brain/context-kit/` files.
- Update BOTH state copies after every change.

## Step 7 — Offer the weekly refresh routine

After the completeness meter hits 100%, offer:

```
routine add \
  --name "Context Kit weekly refresh" \
  --cron "0 9 * * 1" \
  --delivery "Send a summary in a new web conversation." \
  --prompt "Start an agent turn and read the installed context-kit skill. Refresh Context Kit directly in that agent turn using its current Motion commands; never call Motion from task.bash. Preserve every Runneth Instructions section, update only Motion-derived content, mirror changed files and state, and open a new conversation summarising shifts in voice, VoC, or competitors plus anything stale for 3+ weeks."
```

Save routine ID to state as `refreshRoutineId`.

## Rules
- Never touch `user.md`.
- Create-if-absent; edit-in-place on confirm. Never overwrite a filled file.
- Reserve `drafted` for real Motion data. Use `inferred` + `sourceNote` for general-knowledge drafts.
- Plain language with the customer. No file paths or JSON in chat.

## Bucket A: two-section import contract

- `## Latest Import From Motion` — current Motion value.
- `## Runneth Instructions` — customer corrections and rules.

On conflict, follow `Runneth Instructions`. A refresh updates only the import section.

## Bucket D: integration source guides

Files at `/agent/brain/context-kit/integrations/<source>.md`, mirrored to `data/integrations/<source>.md`. The ad-platform guide (workspace ID, attribution windows, conversion events, metric gotchas) is provided by the **ad-naming** package when installed. Other guides (asset-library, data-warehouse, reviews) use their thoughtStarters until the customer connects that source.

Bucket D excluded from completeness meter.
