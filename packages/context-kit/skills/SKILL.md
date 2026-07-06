---
name: context-kit
description: Builds a customer's Context Kit, the institutional knowledge that makes every Runneth answer sharper. Reads the Context Kit state index, confirms what Motion knows, drafts brand-context and every Bucket B item from Motion creative data (AI glossary tag distribution first) before asking anything, imports what already lives in Google Drive or Notion, researches real customer language for voice-of-customer, and collects what only the customer knows, filling each into the brain and moving the completeness meter. Triggers on "build my context kit", "set up my context kit", "context kit", "build my brain", "sharpen Runneth", "what makes my answers better", "what do you still need from me", "what does Runneth know about us".
---

# Context Kit skill

Turn a fresh brain into a filled one, without the manual sales/CS back-and-forth. The board app is the
mirror; this skill is the doer. Draft from Motion data first, then import, then collect. Never write to
`user.md`. Fill happens as deliberate in-conversation brain writes.

## Single source of truth
Every one of the 12 files lives in `/agent/brain/context-kit/<item-id>.md` and is mirrored to
`/agent/apps/context-kit/data/<item-id>.md` so the board can fetch it. Do NOT scatter files into
`brand-audit/` or `templates/`. Item ids: brand-context, kpis-goal, spend-threshold, competitors,
products, positioning, voice, voc, legal (file legal-compliance.md), briefing-template, source-of-truth,
guardrails.

## Status meaning (drives the board color, keep it honest)
- `confirmed` / `imported`: locked in by the customer (green).
- `drafted` (butter): built from ACTUAL Motion data (glossary tags, creative summaries, transcripts, Inspo).
- `inferred` (blue): written from general brand knowledge because Motion was unavailable. MUST carry a
  `sourceNote` explaining that, so the customer knows to scrutinize it.
- `missing`: nothing yet.

## Step 0 — Load state + set brand name
1. Read `/agent/brain/context-kit/context-kit-state.json`.
2. Set top-level `brandName` from `motion workspaces` (current workspace name) or brand context, BEFORE the
   first state write, so the board title reads "<Brand>'s Context Kit" from first load.
3. Run `motion brand-context --data-query "summary"`, `motion workspace-goal`, `motion spend-threshold`.
4. Note which context sources are connected (Google Drive, Notion, reviews platform, Shopify, attribution).

## Step 1 — Build and open the board (first run only)
Sync stages files but does not build apps. Fill `/agent/apps/context-kit/buildeth.app.json` (replace
`__CONVERSATION_ID__` and `__WORKSPACE_ID__`), run `app build context-kit`, then `app list` for the URL.
`astro.config.mjs` ships in the package. After first build the board reads `data/` at runtime, no rebuild
needed for content/state changes.

## Step 2 — Bucket A: confirm, and auto-draft brand-context
- **kpis-goal, spend-threshold:** show the live Motion value, one-tap confirm, write the full doc, set the
  `preview` string, mark `confirmed`.
- **brand-context (auto-draft, never ask from scratch):** if `motion brand-context` has content, show and
  confirm; if empty, draft from `motion meta insights --date-range last_30d --sort topSpend --include-metrics`
  (+ TikTok if connected). Foundation only (brand name, origin story, positioning statement, product
  description, proof points, 2-sentence tone, 2-sentence audience). Present, confirm, write, save to workspace
  config, mirror to `data/`, mark `confirmed`.

## Step 3 — Proactive import + connect offers
If any Bucket B/C item is missing:
- Drive/Notion connected: "I see you have [Drive/Notion] connected, want me to search there first?"
- No reviews platform: suggest it (powers the best voice-of-customer).
Import confirmed docs into `/agent/brain/context-kit/<id>.md`, mirror to `data/`, mark `imported`.

## Step 4 — Bucket B: glossary tag distribution is the data spine, then fallback chain
Before drafting ANY Bucket B item, pull the ground-truth spine once:
1. `motion ai-glossary` (which tag categories exist for this workspace).
2. `motion meta insights --include-glossary --date-range last_30d --sort topSpend` and read the tag
   distribution from `creatives[].glossaryTags[]`. This is what the brand actually bets spend on.

Category-to-item mapping (use as the factual spine, then layer language on top):
- `intended-audience` -> positioning (who the top-spend ads target)
- `messaging-angle` -> positioning + voice (what they lead with, how they frame claims)
- `hook-tactic` -> voice + voc (how ads open, which customer-language patterns win spend)
- `visual-format` + `asset-type` -> voice (UGC vs polished vs demo vs testimonial)
- `offer-type` -> products (which offer structures attach to which products)
- `seasonality` -> products + competitors

Per-item **fallback chain** (explicit, sequential):
1. Motion first: glossary spine + creative summaries + hooks; Inspo brands for **competitors**; video
   transcripts (`--include-transcript`) for **voc**; `review-audit` + `brand-relevant-keywords` + web research
   for real customer language on **voc** (ad transcripts are only a labeled supplement there).
2. Good Motion signal -> draft, status `drafted`.
3. Motion empty or errors -> if Drive/Notion connected, search + import, status `imported`.
4. Neither -> draft from general brand knowledge, status `inferred`, and set a `sourceNote` like
   "Drafted from general brand knowledge, Motion ad data was unavailable. Review and correct."
5. Even that unreliable -> leave `missing` and show thought starters / ask.
After each: mirror the file to `data/<id>.md`, tell the user "I drafted [item], click the card to review or
tell me what to change." Never silently skip; say what was missing.

Content depth: **voice** is the brand's voice (4-6 named characteristics with sounds-like/doesn't pairs).
**voc** is the customer's voice: a 7-category swipe file (pain, emotional language, desire, before/after,
objections, competitor complaints, trigger events), near-verbatim, plus the Sarah Levinger lived-context
layer (generation, what shaped their trust, 5-10 trigger moments with the emotion on each).

## Step 5 — Bucket C: collect with depth
legal, briefing-template, source-of-truth, guardrails: file drop when they have it, use the item's
thoughtStarters when stuck, one prompt when short. Prompt for the COMPLETE rule set. Write to
`/agent/brain/context-kit/<id>.md` (legal -> legal-compliance.md), mirror to `data/`, mark `confirmed`.

## Step 6 — Keep the map correct
- Refresh `/agent/INDEX.md` entries pointing to `/agent/brain/context-kit/` as the canonical home.
- After every change update BOTH state copies (`/agent/brain/context-kit/context-kit-state.json` and the
  app's `data/context-kit-state.json`). No rebuild needed for data-only changes.

## Rules
- Never touch `user.md`. Never overwrite an already-filled file (create-if-absent, edit-in-place on confirm).
- Reserve `drafted` for real Motion-data content; use `inferred` + a `sourceNote` for general-knowledge drafts.
- Plain, non-technical language with the customer. No file paths or JSON in chat.
- One item at a time; celebrate the Level 3 unlock when the meter completes.
