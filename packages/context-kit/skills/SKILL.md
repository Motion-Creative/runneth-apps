---
name: context-kit
description: Builds a customer's Context Kit, the institutional knowledge that makes every Runneth answer sharper. Reads the Context Kit state index, confirms what Motion already knows, imports what already lives in Google Drive or Notion, drafts what Runneth can research, and collects what only the customer knows, filling each into the brain and moving the completeness meter. Triggers on "build my context kit", "set up my context kit", "context kit", "build my brain", "sharpen Runneth", "what makes my answers better", "what do you still need from me", "what does Runneth know about us".
---

# Context Kit skill

Turn a fresh brain into a filled one, without the manual sales/CS back-and-forth. The Context Kit
board app is the mirror; this skill is the doer. Never write to `user.md`. Fill happens as deliberate
in-conversation brain writes. Always prefer importing what already exists over asking the customer to
retype it.

## Step 0 — Load state
1. Read `/agent/brain/context-kit/context-kit-state.json`.
2. Run `motion brand-context --data-query "summary"`, `motion workspace-goal`, `motion spend-threshold`
   to hydrate the three Bucket A items with live values.
3. Check which context sources are connected (Google Drive, Notion) so import is offered when available.
4. Resolve the workspace slug for brand-audit paths.

## Step 1 — Build and open the board (first run only)
Package sync stages files but does NOT build the app. On first run:
1. Fill the bundled manifest: in `/agent/apps/context-kit/buildeth.app.json`, replace `__CONVERSATION_ID__`
   with the current conversation id and `__WORKSPACE_ID__` with the current workspace id. The rest of the
   v3 manifest (oauthEnabled, data dir, static dist/index) and `astro.config.mjs` (base `/context-kit`)
   ship in the package, so no trial-and-error is needed.
2. Run `app build context-kit`, then `app list` for the verified URL. Hand the URL back. Never invent it.
3. After the first build, the board reads `data/` at runtime (client-side fetch), so later state/content
   updates show on refresh with NO rebuild. Only rebuild if you change the app source itself.

## Step 2 — Bucket A: confirm (fast) + write the full working doc
For brand-context, kpis-goal, spend-threshold: show the live value plainly and ask a one-tap confirm.
On confirm: set the item `confirmed`, set its `preview` string in the state index (short human summary
for the card), and write the full working document. `brand-context.md` (#10) is the *foundation only*:
brand name, story, positioning statement, product description, proof points, and a 2-sentence tone/audience
summary. Do NOT concatenate the Bucket B detail into it. Do not re-collect what Motion already holds.

## Step 3 — Import mode (try before drafting or asking, for every remaining item)
Ask: "Do you already have this in Google Drive or Notion?" If connected, search for the relevant doc,
confirm it, import into the correct brain path, set `imported` then `confirmed`. If not connected, offer
the native connect flow first. Only fall through to draft/write-in if they decline or don't have it. Lean
on existing context-sweep / integration skills for the search + pull.

## Step 4 — Bucket B: draft rich, then confirm, then mirror to the board
For competitors, products, positioning, voice, voice-of-customer: run the matching skill (product-catalog,
competitor-analysis, brand-audit strategy/review passes, Inspo followed brands + boards for competitors).
Write FULL working documents into `/agent/brain/brand-audit/<slug>/` (#9): competitor tone/audience/
positioning breakdowns, complete product feature lists, full personas with motivations and objections, all
voice-of-customer quotes and patterns. Thin summaries fail here. Then:
- set status `drafted` (customer reviews) then `confirmed` on accept.
- MIRROR each file into `/agent/apps/context-kit/data/<file>.md` (competitors.md, products.md,
  positioning.md, voice.md, voc.md) so the board's click-to-expand can fetch it at runtime.

## Step 5 — Bucket C: collect with depth
For legal, briefing-template, source-of-truth, guardrails: file drop when they have the doc, thought
starters when stuck, one prompt when short. Prompt for the COMPLETE rule set, not a one-liner (#9). Write
into the scaffold file, fully populating the `## Your answers` section. Mark `confirmed`.

## Step 6 — Keep the map correct
- After each item is filled with real content, add or refresh its `/agent/INDEX.md` entry.
- Update `/agent/brain/context-kit/context-kit-state.json` AND the app's `data/context-kit-state.json`
  after every change (the board reads the app copy). No rebuild needed for data-only changes.

## Rules
- Never touch `user.md`.
- Never overwrite an already-filled file (create-if-absent, edit-in-place only on confirm).
- Plain, non-technical language with the customer. No file paths or JSON in chat.
- One item at a time; celebrate the Level 3 unlock when the meter completes.
