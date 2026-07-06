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
