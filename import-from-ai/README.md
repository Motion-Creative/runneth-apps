# import-from-ai

**Pull saved memories, custom instructions, projects, and recurring preferences out of ChatGPT, Claude, or Gemini in one paste. Runneth reviews everything, flags conflicts against the existing brain, and writes only what the user approves.**

A new Runneth user often has months or years of context already living inside another AI. This use case collapses the ramp-up into a single review session.

**Install time:** ~5 minutes
**Requires:** [add-roles-permissions](../add-roles-permissions) (must be installed first)

---

## Prerequisites

`add-roles-permissions` must be installed and have at least one admin mapped. `import-from-ai` writes to the user's permissions home base (`/agent/brain/users/<handle>/imports/`), so identity resolution must work before this can run.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `SKILL.md` | `/agent/.agents/skills/import-from-ai/SKILL.md` | The skill that owns the import flow |
| `prompts/chatgpt.md` | `/agent/.agents/skills/import-from-ai/prompts/chatgpt.md` | Extraction prompt for ChatGPT |
| `prompts/claude.md` | `/agent/.agents/skills/import-from-ai/prompts/claude.md` | Extraction prompt for Claude |
| `prompts/gemini.md` | `/agent/.agents/skills/import-from-ai/prompts/gemini.md` | Extraction prompt for Gemini |
| `schemas/manifest.json` | `/agent/.agents/skills/import-from-ai/schemas/manifest.json` | Canonical schema all providers normalize to |
| `lib/parse.py` | `/agent/.agents/skills/import-from-ai/lib/parse.py` | Parser: reads upload, normalizes, dedupes |
| `lib/render-review.py` | `/agent/.agents/skills/import-from-ai/lib/render-review.py` | HTML review renderer |
| `behavior-snippet.md` | `user.md` | Adds a routine trigger that surfaces the flow at the right moments |

---

## End-to-end flow

1. User asks Runneth to import context from another AI.
2. Runneth hands over the provider-specific extraction prompt with plain-language instructions.
3. User pastes it into ChatGPT / Claude / Gemini. That AI produces a structured JSON file (or ZIP if attachments exist).
4. User uploads the file to Runneth.
5. `parse.py` normalizes the upload to a manifest, content-hash dedupes against the user's existing imports.
6. Runneth reads the manifest with the user's full brain in context and triages every item: bucket (behavioral or contextual), category, durability, conflicts, raise flags.
7. `render-review.py` emits a read-only HTML at `./artifacts/import-review-<import-id>.html`.
8. User reviews and signals approval in chat. Approval grammar supports ranges, categories, negatives, raises, and bucket overrides ("approve 1-15, 22, raise 7 to org, move 12 to behavioral").
9. Runneth restates the parsed approval, requires an explicit "go".
10. Behavioral items append to `<handle>.md`; contextual items go to `imports/`; raised items go to org or `user.md` (admin-gated). `/agent/INDEX.md` updates immediately. Final summary in chat.

---

## Triage is inline, not a separate model

The agent itself does the per-item triage. No standalone classifier model, no extra API call. The advantage: the triage runs with the user's existing brain loaded, so it can detect duplicates and flag conflicts with what's already saved. An isolated API call can't do that.

---

## Provider coverage at v1

- **ChatGPT** (uses Code Interpreter to package a ZIP)
- **Claude** (uses the analysis tool to package a ZIP)
- **Gemini** (outputs JSON inline; user saves manually)

Magnus and other providers are forkable additions. A new provider is a new prompt template plus a few lines in the parser.

---

## Bucket model

The defining design decision: every imported item is either **behavioral** or **contextual**. Triage assigns the bucket; the bucket decides where the write lands.

- **Behavioral** — shapes how Runneth interacts with this person every session. Tone, voice, format defaults, working style, communication preferences, things they always or never want.
  - Lands in `imports/<provider>/<category>/<slug>.md` as the durable record.
  - Also appends to `<home_base><handle>.md` in a clearly labeled, dated section. Never overwriting existing profile content.
  - Loads at every session-open, so the preferences are always-on.
- **Contextual** — useful when relevant, not always. Project knowledge, decisions about specific things, memories of specific facts, working session artifacts.
  - Lands in `imports/<provider>/<category>/<slug>.md`.
  - Rolls up into a per-user `imports/<handle>.md` overview.
  - Gets indexed in `/agent/INDEX.md` so it surfaces on-demand when relevant.
  - Never auto-touches `<handle>.md`.

## Raises

Raises are explicit user calls during chat approval. Never automatic.

- **Raise to org** → `/agent/brain/org/<subpath>/<slug>.md`. Admin-gated. Non-admin raises stage to `./workdir/imports/<import-id>/org-pending/` and route through the org-change request flow.
- **Raise to user.md** → appended to `/agent/user.md` in a labeled block. Admin-gated, same staging behavior for non-admins.
- **Move to behavioral** (bucket override) → if a contextual item should actually be behavioral, the user says so and the skill reclassifies it before writing.

---

## Fallbacks

- **add-roles-permissions not installed:** Skill stops and tells the user to install it first.
- **Upload not parseable:** Skill explains what went wrong and offers the fallback continuation prompt.
- **Source AI truncated output:** Skill detects partial JSON and hands over a follow-up prompt that resumes from where the truncation happened.
- **Re-importing same content:** Content-hash dedupe makes it a no-op with a clear "already imported, nothing new" report.
- **Re-importing from the same provider:** New behavioral block appended to `<handle>.md` with a date; prior block from that provider marked as superseded (not deleted; the user owns deletes).
- **No items approved:** Skill still requires the explicit "go" before writing. No silent saves.

---

## Version history

See `install-config.json` changelog.
