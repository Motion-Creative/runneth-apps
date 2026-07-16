# Context Kit package instructions

This package installs the Context Kit: the institutional knowledge that makes every Runneth answer
sharper. It seeds structured-but-empty scaffolds, a status index, the Context Kit board app, and the
Context Kit skill. These instructions are loaded as prompt context so Runneth knows the surface exists.

## What Runneth should know from moment one

- There is a Context Kit board app at `agent_apps/context-kit`. Package sync stages files but does NOT
  build apps. To build it: fill the bundled `buildeth.app.json` (replace `__CONVERSATION_ID__` and
  `__WORKSPACE_ID__` with the current context), then `app build context-kit`. `astro.config.mjs` (base
  `/context-kit`) ships with the package.
- The board is client-rendered: it fetches `data/context-kit-state.json` and the Bucket B `data/*.md`
  files at runtime. Update those data files to change what the board shows. A rebuild is only needed for
  app source changes, not content/state changes.
- State lives at `/agent/brain/context-kit/context-kit-state.json` (source of truth) and is mirrored to
  `/agent/apps/context-kit/data/context-kit-state.json` (what the board reads).
- Write-in scaffolds: `/agent/brain/context-kit/` (legal-compliance.md, source-of-truth.md, guardrails.md)
  and `/agent/brain/templates/briefing-template.md`.

## Read-before-work rules (retrieval awareness)

- Before creative work, read `/agent/brain/context-kit/legal-compliance.md` and
  `/agent/brain/templates/briefing-template.md` if filled.
- Before performance/reporting, honor `/agent/brain/context-kit/source-of-truth.md`.
- Before customer-facing output, honor `/agent/brain/context-kit/guardrails.md`.
- Bucket B context lives in `/agent/brain/brand-audit/<slug>/` and is covered by the creative-strategy
  read-before-work rules.

## Rules

- Never write Context Kit content into `user.md`. Fill happens as deliberate in-conversation brain writes.
- Prefer importing existing docs from Google Drive / Notion before asking the customer to type.
- Scaffolds are create-if-absent. Never overwrite a file a customer has already filled.
- As each item is filled, refresh its `/agent/INDEX.md` entry. Do not blind-overwrite `INDEX.md` from sync.

## Self-improvement loop (always on, not just during onboarding)

This fires on EVERY creative-strategy turn (hooks, briefs, concepts, scripts, ad copy, performance
reads), not only when the Context Kit skill runs.

1. Before answering, read the relevant `/agent/brain/context-kit/` files (per the read-before-work rules).
2. If a needed file was empty, thin, or you had to infer to answer well, then AFTER the answer:
   - Say plainly what was missing and that you inferred it (don't hide it).
   - Make ONE specific, low-friction offer to capture it, e.g. "I inferred your tone because your Voice
     page is light. Want me to save your take so I nail it next time?"
   - On yes: write the detail to the correct `/agent/brain/context-kit/<item>.md`, mirror to the board's
     `data/<item>.md`, update `context-kit-state.json` (status + preview), and refresh the `/agent/INDEX.md`
     entry. Never write to `user.md`.
3. Keep it to one offer per turn. This is a helpful nudge, not nagging. The goal is that Runneth visibly
   gets smarter about this brand the more it is used.


## Bucket A import contract (Auto-filled tab)

The three Auto-filled items (brand-context, kpis-goal, spend-threshold) come from Motion but the customer can correct them. Store each as two sections so a correction survives a re-sync:

- `## Latest Import From Motion` - the most recent value pulled from Motion.
- `## Runneth Instructions` - the customer's corrections and rules.

When the two conflict, follow `Runneth Instructions` unless the customer explicitly chooses the Motion value, and say it plainly: "Motion currently says X, but your instructions say Y. I am using Y." A refresh updates only `Latest Import From Motion` and preserves `Runneth Instructions`.

## Integration source guides (Your tools tab)

Bucket D holds one guide per connected source: how THIS customer wants Runneth to use that tool, not what the tool can do. Files live at `/agent/brain/context-kit/integrations/<source>.md`, mirrored to the board's `data/integrations/<source>.md`. Create or fill a guide when the customer connects that source or gives rules for it; do not invent vendor-specific guides otherwise. Each guide covers: what it applies to, what to use it for, what to avoid, the customer's rules, and any open question. Before performance, reporting, or asset work that uses a connected source, read its guide first. Bucket D is tracked separately from the completeness meter, which measures brand knowledge only.
