# Update and Merge

Smart merge layer that decides how to apply upstream use-case updates to the local install. Handles every file an installed use-case touches — user.md snippet blocks, skill files, scripts, configs, brain templates — with conflict awareness against local customizations.

## What problem this solves

`use-case-sync` today detects when an installed use-case has a new repo version and pings Slack with "want me to upgrade?". That tells the admin something changed, but it doesn't decide what's safe to apply automatically and what needs human attention. Today, if the admin says yes, the install re-runs and any local customizations to installed files are silently overwritten.

`update-and-merge` adds three things:

1. **Per-file three-way merge.** For every file an installed use-case touches, compare local vs ancestor vs upstream. If local matches ancestor, the user didn't customize this file — clean replace. If local differs from ancestor, the user customized — surface a diff and ask.
2. **Semantic check on user.md snippets.** The snippet block in user.md gets an LLM-driven semantic conflict check against adjacent user-written rules (not just textual diff), because the dangerous case is "new upstream rule silently overrides a rule the org wrote."
3. **Consolidated plan mode.** When any file in a use-case has a real conflict, all changes for that use-case are staged into one consolidated plan file. Admin reviews per-file, replies with natural-language choices, the same skill applies the resolution.

## How it gets invoked

- **Scan mode** — triggered by `use-case-sync` Step 6 for each installed use-case with `update_available`. Enumerates files, runs three-way merge per file, applies clean changes or stages the use-case in a plan file.
- **Resolve mode** — triggered when an admin replies in chat to a pending plan. Interprets natural language per file and applies.
- **Setup mode** — runs at first install and any time an admin asks to reconfigure notifications.

## Three-way merge model

For each regular file an installed use-case touches:

| local | ancestor | upstream | decision |
|---|---|---|---|
| == upstream | (any) | (current) | unchanged, skip silently |
| == ancestor (known) | (known) | != local | clean replace — user didn't customize |
| != ancestor (known) | (known) | != local | conflict — user customized |
| (any) | unknown | != local | conflict (conservative default) |
| missing locally | (any) | (current) | clean add |

For user.md snippet blocks: same model plus an LLM semantic check that catches "new upstream rule overrides a user-written rule sitting elsewhere in user.md."

### Ancestor resolution

Order of preference:

1. `installed.json[<id>].installed_commit_sha` is set → fetch each file at that SHA
2. Not set, but installed version is known → walk the commit history of the use-case folder. First commit whose `install-config.json` version matches the installed version is the ancestor.
3. Neither works → "ancestor unknown" — conservative-flag mode (treat any local-vs-upstream diff as a potential conflict).

### Note on dependencies

For ancestor resolution to be precise on new installs going forward, `install-use-case` should be updated to write `installed_commit_sha` to `installed.json`. Until that lands, ancestor resolution falls back to the commit-history-walk path, which is correct but slower. The commit-walk path is the default fallback for pre-existing installs.

## Per-use-case all-or-nothing on conflict

If any file in a use-case has a conflict, the whole use-case stages — no files apply until the admin resolves. This avoids leaving the use-case in a partially-upgraded state that's hard to reason about (e.g., new SKILL.md applied but old support script kept).

Within a single resolution turn, the admin can pick different choices per file ("apply upstream on search.py, keep mine on SKILL.md") and the skill applies the mixed result atomically.

## Notifications

Org-agnostic. No hardcoded channel IDs. All variable config reads at runtime from:

- `/agent/brain/permissions/config.json` → `admin_slack_channel`
- `/agent/brain/permissions/admins.md` → admin identity verification

On install, setup mode walks the admin through configuring the channel. If Slack isn't connected, setup proactively suggests connecting it. If the admin declines Slack entirely, the skill falls to **file-only mode** — plan files live on disk and a one-line notice surfaces on the next admin session-open.

## Dependencies

- `use-case-sync` — must be installed and configured. `update-and-merge` is invoked from Step 6 of that skill.
- `OPENAI_API_KEY` — required for the user.md semantic conflict-check step. Pre-provisioned in most Motion workspaces.
- `GITHUB_TOKEN` — required for fetching upstream files and walking commit history. Pre-provisioned.
- Slack (optional) — required only if the admin wants real-time conflict alerts. File-only mode is the explicit fallback.

## What's out of scope (v1)

- Use-cases without an `install-config.json` (manual installs)
- Cross-use-case conflicts (two different use-cases installing to the same path)
- Deletion of locally-installed files that have been removed from the upstream use-case (logged, not deleted)
- Patching `install-use-case` to write `installed_commit_sha` — separate follow-up task

## Files in this folder

| File | Purpose |
|---|---|
| `SKILL.md` | The skill itself. Installed at `/agent/.agents/skills/update-and-merge/SKILL.md`. |
| `conflict-prompt.txt` | LLM prompt template for the user.md semantic conflict check. Installed alongside SKILL.md. |
| `behavior-snippet.md` | Sentinel-wrapped block injected into `/agent/user.md` so conversation-level Runneth knows the skill exists. |
| `install-config.json` | Install manifest. |
| `CHANGELOG.md` | Human-readable changelog. |
| `README.md` | This file. |

## How to install (manually)

If `install-use-case` is wired up in your sandbox, run it with `--use-case-id update-and-merge`. Otherwise follow the `post-install` steps in `install-config.json` manually.
