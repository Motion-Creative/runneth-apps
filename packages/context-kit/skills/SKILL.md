---
name: context-kit
description: Builds a customer's Context Kit, the institutional knowledge that makes every Runneth answer sharper. Reads the Context Kit state index, confirms what Motion knows, drafts brand-context and every Bucket B item from Motion creative data before asking anything, imports what already lives in Google Drive or Notion, and collects what only the customer knows, filling each into the brain and moving the completeness meter. Triggers on "build my context kit", "set up my context kit", "context kit", "build my brain", "sharpen Runneth", "what makes my answers better", "what do you still need from me", "what does Runneth know about us".
---

# Context Kit skill

Turn a fresh brain into a filled one, without the manual sales/CS back-and-forth. The board app is the
mirror; this skill is the doer. Draft from Motion data first, then offer import, then collect. Never write
to `user.md`. Fill happens as deliberate in-conversation brain writes.

## Single source of truth
Every one of the 12 files lives in `/agent/brain/context-kit/<item-id>.md` and is mirrored to
`/agent/apps/context-kit/data/<item-id>.md` so the board can fetch it. Do NOT scatter files into
`brand-audit/` or `templates/`. Item ids: brand-context, kpis-goal, spend-threshold, competitors,
products, positioning, voice, voc, legal (file legal-compliance.md), briefing-template, source-of-truth,
guardrails.

## Step 0 — Load state
1. Read `/agent/brain/context-kit/context-kit-state.json`.
2. Run `motion brand-context --data-query "summary"`, `motion workspace-goal`, `motion spend-threshold`.
3. Note which context sources are connected (Google Drive, Notion).

## Step 1 — Build and open the board (first run only)
Sync stages files but does not build apps. Fill `/agent/apps/context-kit/buildeth.app.json` (replace
`__CONVERSATION_ID__` and `__WORKSPACE_ID__` with current context), run `app build context-kit`, then
`app list` for the URL. `astro.config.mjs` ships in the package. After first build the board reads `data/`
at runtime, so later content/state changes need NO rebuild.

## Step 2 — Bucket A: confirm, and auto-draft brand-context
- **kpis-goal, spend-threshold:** show the live Motion value, one-tap confirm, write the full doc, set the
  `preview` string in state, mark `confirmed`.
- **brand-context (auto-draft, never ask from scratch):**
  1. If `motion brand-context` returns content, show it and ask to confirm.
  2. If empty, say: "I don't have brand context saved yet, I'll draft it from your top-performing ad creative now."
  3. Pull top spend creative: `motion meta insights --date-range last_30d --sort topSpend --include-metrics`
     (+ TikTok if connected). Read hooks, primary text, headlines, summaries.
  4. Draft `brand-context.md` as the FOUNDATION only: brand name, origin story, positioning statement,
     product description, proof points, a 2-sentence tone summary, a 2-sentence audience summary. Do not
     duplicate the full voice/VoC/competitor detail (those are their own files).
  5. Present the draft, ask to confirm, then write `/agent/brain/context-kit/brand-context.md`, save to
     workspace config, mirror to `data/brand-context.md`, mark `confirmed`.

## Step 3 — Proactive import offer
After state load, if any Bucket B/C item is missing AND Google Drive or Notion is connected, proactively
say: "I can see you have [Drive/Notion] connected, want me to search there first before drafting from
scratch?" If they say yes, search, confirm the doc, import into `/agent/brain/context-kit/<id>.md`, mirror
to `data/`, mark `imported`. Lean on existing context-sweep / integration skills for the pull.

## Step 4 — Bucket B: draft from Motion creative data first, then correct
For each item, attempt a Motion-backed draft BEFORE import or manual collection. A rough draft the user can
react to beats a blank prompt. Write full working docs to `/agent/brain/context-kit/<id>.md`, mirror to
`data/<id>.md`, set `drafted` (then `confirmed` on accept), and tell the user
"I drafted [item] from your Motion data, click the card to review or tell me what to change."

- **competitors:** `motion inspo brands` (followed brands), then `motion inspo unique-creatives --brand-id
  <id> --sort-by impressionRank` per brand. Summarize who they are, what angles they run, what they
  emphasize. Ask the user to add anyone missing.
- **products:** top spend creative via `motion meta insights` with summaries + glossary tags. Compile the
  product list from repeated hero claims / SKU callouts / bundles, note claims per product. Ask the user to
  add pricing, SKU codes, and anything not in copy.
- **positioning:** `motion meta insights --include-glossary`. Read intended-audience, messaging-angle, and
  hook-tactic tag distribution; combine with hook language to draft positioning + personas. Flag assumptions.
- **voice:** hooks, primary text, and summaries of the top 20-30 by spend. Synthesize 4-6 named voice
  characteristics, each with a "sounds like / doesn't sound like" pair. Should feel recognizable to a brand writer.
- **voc:** top spend VIDEO creative with `--include-transcript`. Extract the most repeated real customer
  phrases, emotional beats, outcome language; supplement with static hooks. Group by problem language,
  outcome language, objections, social proof.
- If a pull returns too little (no followed brands, no transcripts), say what was missing and fall through to
  import or manual for that item only. Never silently skip.

## Step 5 — Bucket C: collect with depth
legal, briefing-template, source-of-truth, guardrails: file drop when they have it, thought starters when
stuck, one prompt when short. Prompt for the COMPLETE rule set, not a one-liner. Write to
`/agent/brain/context-kit/<id>.md` (legal -> legal-compliance.md), mirror to `data/`, mark `confirmed`.

## Step 6 — Keep the map correct
- Refresh `/agent/INDEX.md` entries pointing to `/agent/brain/context-kit/` as the canonical home for all
  Context Kit files. No separate entries for scattered originals.
- After every change update BOTH `/agent/brain/context-kit/context-kit-state.json` and the app's
  `data/context-kit-state.json` (the board reads the app copy). No rebuild needed for data-only changes.

## Rules
- Never touch `user.md`. Never overwrite an already-filled file (create-if-absent, edit-in-place on confirm).
- Plain, non-technical language with the customer. No file paths or JSON in chat.
- One item at a time; celebrate the Level 3 unlock when the meter completes.
