# Integration capabilities library

The agent always has an accurate, sourced reference for what every connected integration can do and what permissions it needs — created the moment a new integration appears, refreshed whenever the user asks.

---

## What this enables

When someone asks what Slack can do, what GitHub scopes are needed, or whether Notion supports file uploads — the agent answers from a live, sourced document rather than from memory or inference. When a new integration is connected, a capabilities-and-scopes file is created automatically by fetching the official API docs. Ask any time ("sync the capabilities file for GitHub", "document my integrations") and the files are re-reviewed and patched if anything changed.

---

## Install time

~5 minutes. No post-install steps.

---

## Requires

Nothing. Works in any fresh sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `integrations-index.md` | `{{INTEGRATIONS_DIR}}README.md` | Seeds the integration library index. Skipped if already exists. |
| `skill.md` | `/agent/.agents/skills/integration-capabilities-sync/SKILL.md` | Installs the sync skill. Skipped if already exists. |
| `behavior-snippet.md` | `user.md` → after `## System routines` | Adds behavior: check the library before answering integration questions; trigger skill when a new integration is detected. |

---

## What to customize

| Token | Default | When to change |
|---|---|---|
| `{{INTEGRATIONS_DIR}}` | `/agent/brain/integrations/` | Change if your brain uses a different directory structure |

---

## How it works

**On install:** The library index and skill are seeded. The behavior snippet tells the agent to check the library before answering integration questions and to trigger the skill when a new integration is detected.

**On new integration:** The agent detects that no `capabilities-and-scopes.md` exists for the integration, runs the sync skill scoped to that integration only, fetches the official API docs and scopes reference, and creates the file. Source URLs are always recorded in the file.

**On request:** When the user asks for a refresh ("sync the capabilities file for GitHub", "document my integrations"), the skill re-fetches docs for the named integrations (or all of them), diffs against the existing files, patches only what changed, updates the Last reviewed date, and logs material changes to the brain changelog. The skill never creates a scheduled routine; users who want a periodic refresh can ask Runneth to schedule one themselves.

**When answering questions:** The agent reads from the library file first. If no file exists, it runs the skill to create one before answering. It never answers integration capability or scope questions from memory alone.

---

## Fallbacks

- `integrations-index.md` and `skill.md` are both skipped if the destination already exists — safe to re-install
- Behavior snippet falls back to appending to `user.md` if `## System routines` section is not found
- If a docs URL cannot be fetched for an integration, the skill writes a stub file stating documentation could not be located — it never fills in capabilities from memory
- For unknown integrations not in the skill's known-URL table, the skill uses WebSearch to find the official docs before creating the file

---

## Version history

See `install-config.json` changelog.
