---
name: import-from-ai
description: Import saved memories, custom instructions, projects, and recurring preferences from ChatGPT, Claude, or Gemini into Runneth's brain. Hand the user a provider-specific extraction prompt, parse the resulting upload, triage every item inline against the existing brain (flagging conflicts and raise candidates), render a read-only HTML review, parse chat-based approval (ranges, categories, negatives, raises), confirm explicitly, then write approved items to the user's imports directory and roll them up into a per-user imports profile. Items the user explicitly raises go to their main profile, org brain, or user.md (admin-gated). All imports are indexed so they surface at session-open. Default scope is per-user imports only — nothing else gets touched without an explicit raise. Triggers include "import my ChatGPT context", "bring over my Claude memory", "import from Gemini", or a new user mentioning substantial history in another AI provider.
---

# import-from-ai

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
2. Read the matching prompt: `/agent/.agents/skills/import-from-ai/prompts/<provider>.md`.
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
   python3 /agent/.agents/skills/import-from-ai/lib/parse.py \
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
- **Bucket** — the single most important triage decision. Every non-noise item is either:
  - **`behavioral`** — the item shapes how Runneth should interact with this person every session. Tone, voice, format defaults, working style, communication preferences, signature shapes for briefs/replies, things they always or never want. These need to load at session-open so they're always-on.
  - **`contextual`** — useful when relevant, not always. Project knowledge, decisions about specific things, memories of specific facts, working session artifacts. Indexed and retrieved on-demand.
  Category is a hint, not a rule. A `saved_memory` like "prefers concise replies" is behavioral. A `saved_memory` like "manages six skincare brands" is contextual. Read the content and decide.
- **Default actions by bucket:**
  - Behavioral → writes to `<home_base>imports/<provider>/<category>/<slug>.md` for the durable record AND appends to a labeled section in `<home_base><handle>.md` so it loads every session.
  - Contextual → writes to `<home_base>imports/<provider>/<category>/<slug>.md` only. Gets indexed in `/agent/INDEX.md` for retrieval.
  - Neither default touches `/agent/user.md` or `/agent/brain/org/`. Those are explicit raises only.
- **Raise flags** — informational only, layered on top of the bucket. Set when an item looks like it would also belong somewhere bigger:
  - `raise_to_org` — looks like content that would benefit the whole team (brand voice docs, frameworks, methodology).
  - `raise_to_user_md` — looks like an org-wide standing instruction (rare, admin-gated).
- **Durability confidence** — `high`, `medium`, or `low`. How reusable does this look six months out.
- **Conflict flag** — set when the item contradicts something already in `<home_base><handle>.md`, `/agent/user.md`, or `/agent/brain/org/`. List the conflicting file(s). Conflicts on behavioral items matter most because they go to `<handle>.md`.
- **Suggested action** — one of `import` (default for anything not noise), `import-with-edits`, `skip`.

**The contract:**
- Behavioral items DO auto-append to `<handle>.md` in a clearly labeled, dated section. Never overwriting existing content.
- Contextual items NEVER touch `<handle>.md`. They live in `imports/` and surface through INDEX.
- Raises to org or `user.md` are never automatic. The user calls them explicitly during chat approval.

Write your triage decisions into the manifest at `./workdir/imports/<import-id>/manifest.json` under each item's `triage` field. Then render the review:

```bash
python3 /agent/.agents/skills/import-from-ai/lib/render-review.py \
  --manifest "./workdir/imports/<import-id>/manifest.json" \
  --output "./artifacts/import-review-<import-id>.html" \
  --design-system "/agent/workspaces/<workspaceId>/config/brand-design-system/design-system.json"
```

If no design-system.json exists, the renderer falls back to brain-level (`/agent/brain/org/brand/design-system.json`) or inferred defaults.

Hand the HTML back as a file link widget. State the counts: total items, items by category, conflicts flagged, promotion candidates.

---

## Phase 4 — Parse approval, confirm, write, then raise

The user replies in chat with approval signals. Parse generously:

- `approve all` / `approve everything` / `looks good, save it all`
- `approve 1-15, 22, 31` (ranges and explicit numbers)
- `approve all preferences, skip working sessions` (category-level)
- `approve all but 7 and 12` (negative selection)
- `approve everything, raise 3 and 15 to org` (default approve + explicit raise)
- `approve all, raise 5 and 12 to my profile`
- `approve all, raise 22 to standing instructions`
- `let me look again` (no writes, re-render)

Resolve the parse to two concrete action lists:
1. **Imports** — every approved item, headed for `imports/`.
2. **Raises** — the subset the user explicitly raised, with their target (`profile`, `org`, `user_md`).

**Restate and gate.** Before writing, restate what you parsed in plain language. Separate behavioral from contextual from raises so the user sees the contract clearly:

> "Heard: approve all 64 items. 12 are behavioral preferences (tone, format defaults, voice patterns) and will append to your profile so they load every session. 52 are contextual (projects, memories, decisions) and go to imports for retrieval when relevant. Then raising item 3 to the team brain. Skipping the 9 noise items. Say `go` to write."

Wait for explicit confirmation (`go`, `do it`, `confirmed`, `yes`). Anything ambiguous re-asks.

**On confirmation, write in this order:**

### Step 1 — durable imports record (always)

For every approved item, regardless of bucket:

- Write `<home_base>imports/<provider>/<category>/<slug>.md` with front-matter: `import_id`, `source_provider`, `source_id`, `imported_at`, `content_hash`, `bucket`, and any active `raise_flags`.

This is the durable record. Even behavioral items live here so they can be re-applied, dedupe-checked, and audited later.

### Step 2a — append behavioral items to `<handle>.md` (when any approved items are behavioral)

For every behavioral item, append into `<home_base><handle>.md` under a single labeled section dated by import. Never overwrite existing content. Never modify sections outside the imported block.

Use this exact block shape so future imports can detect and supersede their own prior blocks cleanly:

```markdown
<!-- import-from-ai: <import-id> -->
## Imported preferences from <Provider> (<YYYY-MM-DD>)

> Imported via import-from-ai. Edit or delete freely.

### Tone and voice
[compiled from imported custom_instruction + voice_pattern items, each with a backref to its imports/ file]

### Format and working preferences
[compiled from imported recurring_preference items, with backrefs]

### Always or never
[compiled from saved_memory items classified as behavioral, with backrefs]
<!-- /import-from-ai: <import-id> -->
```

On re-import from the same provider, append a new block and mark the prior block from that provider as superseded with a one-line note at the top of the old block. Do not delete prior blocks automatically. The user owns deletes.

If no behavioral items were approved, skip this step.

### Step 2b — contextual imports rollup (when any approved items are contextual)

Create or update `<home_base>imports/<handle>.md`. This is a digestible per-user overview of contextual imports. It is not loaded at session-open; INDEX-based retrieval surfaces it when relevant.

Structure:

```markdown
# <display_name> — imported context

> Contextual context imported from <providers list>. Retrieved on-demand via INDEX.
> Behavioral preferences from these imports live in <handle>.md so they load every session.

## Latest imports
- <date> from <provider>: N items, K behavioral (applied to profile), M raised (resolved/pending)

## Projects from <provider>
[list of imported projects with one-line summaries and links to granular files]

## Key decisions and stances
[compiled from key decisions]

## Saved memories worth keeping
[significant non-behavioral memories]

## Working sessions
[notable working sessions with date and summary]

## See also
- Granular files: <home_base>imports/<provider>/
- Behavioral preferences (loaded every session): <home_base><handle>.md
```

Regenerated (not appended) on each import so it stays coherent. The granular files in `<provider>/<category>/` are the durable record; this is the readable summary.

### Step 3 — raises (only what the user explicitly raised)

For each raise, ask the user one more confirming question per raise target before writing:

- **Raise to org** → `/agent/brain/org/<appropriate-subpath>/<slug>.md`. Resolve the subpath by category (`brand/`, `voice/`, `templates/`, etc.) or ask if unclear. Org writes are admin-gated; if the importing user is not an admin per `admins.md`, stage the file to `./workdir/imports/<import-id>/org-pending/` and route through the org-change request flow.
- **Raise to user.md** → append a labeled block to `/agent/user.md`. **Admin-gated.** Non-admins get the change staged to `./workdir/imports/<import-id>/user-md-pending.md` and routed through the org-change request flow.

Note: there is no separate "raise to profile" path. Behavioral items go to `<handle>.md` automatically via Step 2a. If a contextual item should actually be behavioral, the user can say so during approval ("move 12 to behavioral") and the skill reclassifies it before writing.

### Step 4 — indexing (always)

Indexing is non-negotiable. Contextual imports that don't surface through INDEX are dead weight. Behavioral imports load directly via `<handle>.md`, but their granular files still get indexed for audit traceability.

- Update `/agent/INDEX.md` immediately. Add one entry per granular imported file under `<home_base>imports/<provider>/...`, plus one entry for the contextual imports rollup `<home_base>imports/<handle>.md`. Aliases pull from item title, category, provider, and bucket so retrieval has multiple handles.
- Create or update `<home_base>imports/INDEX.md` as a per-user local index of imports. Section per provider, one line per imported item with date, bucket, and one-line summary.
- Update the conversation one-pager with what was imported (behavioral count, contextual count, raise count).

**Final summary in chat:** count by bucket, count by scope (imports vs raises vs deferred), paths to a few representative items as file links, anything deferred for admin approval, and one natural next step.

Make the contract explicit in the summary:
- Behavioral items appended to `<handle>.md` under a labeled section. They load at every session.
- Contextual items live in `imports/`. They surface through INDEX when relevant.
- Raises (if any) wrote where the user explicitly directed.

---

## Conflict resolution

When a conflict was flagged and the user approves anyway (or raises the item), ask once more before writing:

> "Item 22 conflicts with `/agent/user.md` (you previously said X, this item says Y). Overwrite, keep both, or skip?"

Default to `keep both` (append, don't replace) unless the user says overwrite. Conflicts are the most common silent-mistake vector. Never overwrite without an explicit instruction.

Conflicts on imports-only items (no raise) almost never matter — the imports/ directory is the user's sandbox. Surface the conflict in the review HTML for awareness, but the import itself proceeds without a second confirmation.

---

## Re-imports

If the user re-runs the import later, the parser dedupes by content hash. The manifest still surfaces the new items only. The flow runs normally; the final summary names the dedupe count.

---

## Surface

Web (Motion) and Slack both supported. On Slack, the HTML review is delivered as a file link the user opens in browser. The approval grammar works the same in either surface.
