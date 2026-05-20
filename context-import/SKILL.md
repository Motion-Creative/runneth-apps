---
name: context-import
description: Import saved memories, custom instructions, projects, and recurring preferences from ChatGPT, Claude, or Gemini into Runneth's brain. Hand the user a provider-specific extraction prompt, parse the resulting upload, triage every item inline against the existing brain (flagging conflicts), render a read-only HTML review, parse chat-based approval (ranges, categories, negatives, promotions), confirm explicitly, then write approved items to the user's home base with optional promotion to org or user.md. Default scope is per-user. Triggers include "import my ChatGPT context", "bring over my Claude memory", "import from Gemini", or a new user mentioning substantial history in another AI provider.
---

# context-import

A four-phase flow: **hand over**, **parse**, **review**, **write**.

## Prerequisites — check before anything else

```bash
[ -f /agent/brain/admin/workspace-map.json ] && echo "OK" || echo "MISSING"
```

If MISSING, stop and route the user through `add-roles-permissions` first. This skill writes to `/agent/brain/users/<handle>/imports/` and needs identity resolution working.

## Resolve identity

Use the same surface-aware resolver pattern as `team-member-memory`:

- **Slack:** `bash /agent/brain/admin/slack-whoami.sh <currentMessage.authorId>`
- **Motion web:** read `userEmail` from the conversations DB, then `bash /agent/brain/admin/motion-whoami.sh <userEmail>`

Both return `{ scope, handle, home_base, status }`. Use `home_base` as the import root.

If `status: "collision"`, stop and follow the permissions collision flow. Do not proceed with the import.

---

## Phase 1 — Hand over the extraction prompt

1. Resolve the source provider from the user's language. If ambiguous, ask once: "ChatGPT, Claude, or Gemini?"
2. Read the matching prompt: `/agent/.agents/skills/context-import/prompts/<provider>.md`.
3. Hand it over with plain-language instructions:
   - Where to paste it (which AI, which interface, paid tier required for ChatGPT/Claude Code Interpreter).
   - What the AI will produce (a JSON file, possibly inside a ZIP if attachments exist).
   - How to save it (download from Code Interpreter / analysis tool, or copy-paste and save manually for Gemini).
   - What to do next ("drop the file into this chat when ready").
4. Stop and wait for the upload. Do not narrate progress.

---

## Phase 2 — Parse the upload

When the user uploads the file:

1. Generate an import ID: `<provider>-<UTC-timestamp>` (e.g. `chatgpt-20260520T143052Z`).
2. Run the parser:

   ```bash
   python3 /agent/.agents/skills/context-import/lib/parse.py \
     --input "./uploads/<filename>" \
     --output "./workdir/imports/<import-id>/manifest.json" \
     --user-handle "<handle>" \
     --home-base "<home_base>" \
     --provider "<provider>" \
     --import-id "<import-id>"
   ```

3. The parser handles JSON files and ZIPs. It validates against `schemas/manifest.json`, content-hash dedupes against existing files under `<home_base>imports/`, and writes the normalized manifest.
4. If the parser detects truncation (incomplete JSON, ChatGPT cut-off markers, "and so on" trailing language), it writes `truncation: true` in the manifest. Surface the fallback continuation prompt to the user and stop here.

If parsing fails for any other reason, surface the exact error and the prompt to try again.

---

## Phase 3 — Triage inline, then render the review

You (Runneth) do the triage. No separate model. Read the manifest with the user's brain in context. For every item, decide:

- **Category confirmation** — does it actually belong in the category the source AI labeled it? Move it if not.
- **Suggested scope** — `user` (default), `org` (cross-team), `user.md` (always-on standing instruction), or `skip` (noise).
- **Durability confidence** — `high`, `medium`, or `low`. How reusable does this look six months out.
- **Conflict flag** — set when the item contradicts something already in `<home_base>` or `/agent/user.md` or `/agent/brain/org/`. List the conflicting file(s).
- **Suggested action** — `import`, `import-with-edits`, `promote-org`, `promote-user-md`, `skip`.

Write your triage decisions into the manifest at `./workdir/imports/<import-id>/manifest.json` under each item's `triage` field. Then render the review:

```bash
python3 /agent/.agents/skills/context-import/lib/render-review.py \
  --manifest "./workdir/imports/<import-id>/manifest.json" \
  --output "./artifacts/import-review-<import-id>.html" \
  --design-system "/agent/workspaces/<workspaceId>/config/brand-design-system/design-system.json"
```

If no design-system.json exists, the renderer falls back to brain-level (`/agent/brain/org/brand/design-system.json`) or inferred defaults.

Hand the HTML back as a file link widget. State the counts: total items, items by category, conflicts flagged, promotion candidates.

---

## Phase 4 — Parse approval, confirm, write

The user replies in chat with approval signals. Parse generously:

- `approve all` / `approve everything` / `looks good, save it all`
- `approve 1-15, 22, 31` (ranges and explicit numbers)
- `approve all preferences, skip working sessions` (category-level)
- `approve all but 7 and 12` (negative selection)
- `approve everything, promote 3 and 15 to org` (default approve + explicit promotion)
- `let me look again` (no writes, re-render)

Resolve the parse to a concrete action list per item: `import-to-user`, `import-to-org`, `import-to-user-md`, or `skip`.

**Restate and gate.** Before writing, restate what you parsed in plain language:

> "Heard: approve items 1-15 and 22, promote item 7 to org. Skip the rest. That's 16 items to your imports, 1 to org, 41 skipped. Say `go` to write."

Wait for explicit confirmation (`go`, `do it`, `confirmed`, `yes`). Anything ambiguous re-asks.

**On confirmation, write:**

- **Per-user items** → `<home_base>imports/<provider>/<category>/<slug>.md` with front-matter: `import_id`, `source_provider`, `source_id`, `imported_at`.
- **Promoted to org** → `/agent/brain/org/<appropriate-subpath>/<slug>.md`. Resolve subpath by category (`brand/`, `voice/`, `templates/`, etc.) or ask if unclear.
- **Promoted to user.md** → append a labeled block to `/agent/user.md`. **Admin-gated.** If the importing user is not an admin per `admins.md`, do not write. Stage the change to `./workdir/imports/<import-id>/user-md-pending.md` and tell the user to route through the org-change request flow.

Update `/agent/INDEX.md` immediately for everything written under `/agent/brain/`. Update the conversation one-pager with what was imported.

**Final summary in chat:** count by category, count by scope, paths to a few representative items as file links, anything deferred for admin approval, and one natural next step.

---

## Conflict resolution

When a conflict was flagged and the user approves anyway, ask once more before writing:

> "Item 22 conflicts with `/agent/user.md` (you previously said X, this item says Y). Overwrite, keep both, or skip?"

Default to `keep both` (append, don't replace) unless the user says overwrite. Conflicts are the most common silent-mistake vector. Never overwrite without an explicit instruction.

---

## Re-imports

If the user re-runs the import later, the parser dedupes by content hash. The manifest still surfaces the new items only. The flow runs normally; the final summary names the dedupe count.

---

## Surface

Web (Motion) and Slack both supported. On Slack, the HTML review is delivered as a file link the user opens in browser. The approval grammar works the same in either surface.
