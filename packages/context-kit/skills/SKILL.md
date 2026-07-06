---
name: context-kit
description: Builds a customer's Context Kit, the institutional knowledge that makes every Runneth answer sharper. Reads the Context Kit state index, confirms what Motion knows, drafts brand-context and every Bucket B item from Motion creative data before asking anything, imports what already lives in Google Drive or Notion, researches real customer language for voice-of-customer, and collects what only the customer knows, filling each into the brain and moving the completeness meter. Triggers on "build my context kit", "set up my context kit", "context kit", "build my brain", "sharpen Runneth", "what makes my answers better", "what do you still need from me", "what does Runneth know about us".
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
3. Note which context sources are connected (Google Drive, Notion, and any reviews platform).

## Step 1 — Build and open the board (first run only)
Sync stages files but does not build apps. Fill `/agent/apps/context-kit/buildeth.app.json` (replace
`__CONVERSATION_ID__` and `__WORKSPACE_ID__` with current context), run `app build context-kit`, then
`app list` for the URL. `astro.config.mjs` ships in the package. After first build the board reads `data/`
at runtime, so later content/state changes need NO rebuild.

## Step 2 — Bucket A: confirm, and auto-draft brand-context
- **kpis-goal, spend-threshold:** show the live Motion value, one-tap confirm, write the full doc, set the
  `preview` string in state, mark `confirmed`.
- **brand-context (auto-draft, never ask from scratch):** if `motion brand-context` returns content, show it
  and confirm; if empty, say you'll draft it from top-performing creative, pull
  `motion meta insights --date-range last_30d --sort topSpend --include-metrics` (+ TikTok if connected),
  and draft the FOUNDATION only (brand name, origin story, positioning statement, product description, proof
  points, 2-sentence tone summary, 2-sentence audience summary). Present, confirm, write, save to workspace
  config, mirror to `data/`, mark `confirmed`. Do not duplicate the voice/voc/competitor detail here.

## Step 3 — Proactive import + connect offers
After state load, if any Bucket B/C item is missing:
- If Google Drive or Notion is connected: "I can see you have [Drive/Notion] connected, want me to search
  there first before drafting from scratch?"
- If NO reviews platform is connected: proactively suggest it, because it powers the best voice-of-customer:
  "Connecting your reviews platform (Yotpo, Okendo, Trustpilot, Amazon) gives me your real customer language,
  the single richest input for hooks and angles. Want to connect it?"
Import confirmed docs into `/agent/brain/context-kit/<id>.md`, mirror to `data/`, mark `imported`. Lean on
existing context-sweep / integration skills for the pull.

## Step 4 — Bucket B: draft from real data first, then correct
For each item, attempt a data-backed draft BEFORE asking. Write full working docs to
`/agent/brain/context-kit/<id>.md`, mirror to `data/<id>.md`, set `drafted` (then `confirmed` on accept), and
tell the user "I drafted [item], click the card to review or tell me what to change."

- **competitors:** `motion inspo brands` (followed brands), then `motion inspo unique-creatives --brand-id
  <id> --sort-by impressionRank` per brand. Who they are, what angles they run, what they emphasize.
- **products:** top spend creative via `motion meta insights` with summaries + glossary tags. Product list
  from repeated hero claims / SKU callouts / bundles. Ask user for pricing/SKU codes not in copy.
- **positioning:** `motion meta insights --include-glossary`. Read intended-audience, messaging-angle, and
  hook-tactic tag distribution + hook language to draft positioning + personas. Flag assumptions.
- **voice (the BRAND's voice, not the customer's):** hooks, primary text, and summaries of the top 20-30 by
  spend. Synthesize 4-6 named voice characteristics, each with a "sounds like / doesn't sound like" pair.
  This is how the brand should write.
- **voc (voice-of-customer = how the CUSTOMER sounds, NOT the brand):** real, unfiltered customer language.
  Ad transcripts are the WEAKEST source (they are the brand's scripted version of the customer), so do not
  rely on them. Draft it this way:
  1. If a reviews platform is connected, run the `review-audit` skill over the real reviews.
  2. Generate customer-language search terms with the `brand-relevant-keywords` skill (search the customer's
     problem, not the brand name), then web-research Reddit, review sites, and social comments for real quotes.
  3. Use Motion video transcripts (`--include-transcript`) only as a supplement, labeled as ad-mediated
     (best for UGC/testimonial phrasing).
  Layer in the lived-context frame (Sarah Levinger): which generation, what shaped their trust, and 5-10
  trigger moments (specific everyday situations where the problem fires) with the emotion attached to each.
  Output a swipe file in 7 categories, near-verbatim: pain points, emotional language, desire statements,
  before/after arcs, objections, competitor complaints, trigger events. If no reviews platform is connected,
  say so and suggest connecting one, then proceed with web research and transcripts.
- If a pull returns too little, say what was missing and fall through to import or manual for that item only.

## Step 5 — Bucket C: collect with depth
legal, briefing-template, source-of-truth, guardrails: file drop when they have it, thought starters when
stuck, one prompt when short. Prompt for the COMPLETE rule set. Write to `/agent/brain/context-kit/<id>.md`
(legal -> legal-compliance.md), mirror to `data/`, mark `confirmed`.

## Step 6 — Keep the map correct
- Refresh `/agent/INDEX.md` entries pointing to `/agent/brain/context-kit/` as the canonical home.
- After every change update BOTH `/agent/brain/context-kit/context-kit-state.json` and the app's
  `data/context-kit-state.json`. No rebuild needed for data-only changes.

## Rules
- Never touch `user.md`. Never overwrite an already-filled file (create-if-absent, edit-in-place on confirm).
- Plain, non-technical language with the customer. No file paths or JSON in chat.
- One item at a time; celebrate the Level 3 unlock when the meter completes.
