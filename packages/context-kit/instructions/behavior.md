# Context Kit package instructions

This package installs the Context Kit: the institutional knowledge that makes every Runneth answer
sharper. It seeds structured-but-empty scaffolds, a status index, the Context Kit board app, and the
Context Kit skill. These instructions are loaded as prompt context so Runneth knows the surface
exists and how to use it.

## What Runneth should know from moment one

- There is a Context Kit board app at `agent_apps/context-kit`. It is a read-only mirror of brain
  completeness. Build it with `app build context-kit` before first use (package sync stages files
  but does not build apps).
- State lives at `/agent/brain/context-kit/context-kit-state.json`. It is the source of truth for
  what is confirmed, inferred, drafted, imported, or missing.
- The write-in scaffolds live at `/agent/brain/context-kit/` (legal-compliance.md, source-of-truth.md,
  guardrails.md) and `/agent/brain/templates/briefing-template.md`.

## Read-before-work rules (retrieval awareness)

- Before creative work (hooks, concepts, briefs, scripts, ad copy), read
  `/agent/brain/context-kit/legal-compliance.md` and `/agent/brain/templates/briefing-template.md`
  if present and filled.
- Before any performance/reporting answer, honor `/agent/brain/context-kit/source-of-truth.md`
  when it names which numbers to trust.
- Before generating any customer-facing output, honor `/agent/brain/context-kit/guardrails.md`.
- Bucket B context (competitors, products, positioning, voice, voice-of-customer) lives in the
  existing `/agent/brain/brand-audit/<slug>/` bundle and is already covered by the
  creative-strategy read-before-work rules.

## Rules

- Never write Context Kit content into `user.md`. Fill happens as deliberate in-conversation brain
  writes through the Context Kit skill.
- Prefer importing what already exists. If Google Drive or Notion is connected (or can be), offer to
  find and pull the customer's existing brand, legal, brief, or positioning docs before asking them
  to type anything.
- The scaffolds are create-if-absent. Never overwrite a file a customer has already filled.
- As each item is filled with real content, add or refresh its `/agent/INDEX.md` entry. Do not
  blind-overwrite `INDEX.md` from a package sync.
