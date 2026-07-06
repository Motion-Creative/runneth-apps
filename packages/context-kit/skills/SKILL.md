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
4. Compute completeness and resolve the workspace slug for brand-audit paths.

## Step 1 — Open the board
- If the app is not built yet, run `app build context-kit`, then `app list` for the verified URL.
- Hand the URL back. Never invent it.

## Step 2 — Bucket A: confirm (fast)
For brand-context, kpis-goal, spend-threshold: show the live value plainly and ask for a one-tap
confirm. On confirm, set the item `confirmed`. Do not re-collect what Motion already holds.

## Step 3 — Import mode (try this before drafting or asking, for every remaining item)
Before researching or asking a customer to type, ask: "Do you already have this written down in
Google Drive or Notion?"
- If Drive or Notion is connected, search it for the relevant doc (brand guidelines, legal/claims,
  brief template, positioning, competitor list), show what you found, confirm it's the right one,
  and import it into the correct brain path. Mark the item `imported` then `confirmed`.
- If not connected, offer the native connect flow first. Only fall through to draft/write-in if they
  decline or don't have it.
- Lean on the existing context-sweep / integration skills to do the search + pull rather than
  reinventing retrieval.

## Step 4 — Bucket B: draft, then confirm
For competitors, products, positioning, voice, voice-of-customer not covered by an import: run the
matching skill (product-catalog, competitor-analysis, brand-audit strategy/review passes, Inspo
followed brands + boards for competitors). Show the draft, invite corrections, write into the
existing `/agent/brain/brand-audit/<slug>/` bundle, mark `confirmed`. No parallel files.

## Step 5 — Bucket C: collect (only what import/research can't cover)
For legal, briefing-template, source-of-truth, guardrails still unfilled: pick the lightest mode.
File drop when they have the doc, thought starters when stuck (scaffolds carry these), one quick
prompt when short. Write into the scaffold file, replace the `_(empty)_` block, mark `confirmed`.

## Step 6 — Keep the map correct
- After each item is filled with real content, add or refresh its `/agent/INDEX.md` entry.
- Update `context-kit-state.json` after every change so the board stays honest.
- Re-run `app build context-kit` (or refresh its data copy) so the meter reflects new state.

## Rules
- Never touch `user.md`.
- Never overwrite an already-filled file (create-if-absent, edit-in-place only on confirm).
- Plain, non-technical language with the customer. No file paths or JSON in chat.
- One item at a time; celebrate the Level 3 unlock when the meter completes.
