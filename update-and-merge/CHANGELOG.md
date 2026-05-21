# Changelog — Update and Merge

## v1.0.0 — 2026-05-19

Initial release. Smart merge layer for upstream use-case updates.

### Scope

Handles every file an installed use-case touches:

- `user.md` snippet blocks — LLM-driven semantic conflict check against adjacent user-written rules
- Skill files (`SKILL.md`, scripts, libs) — three-way textual diff against ancestor
- Config files (`install-config.json`, etc.) — same three-way model, conservative bias
- Brain templates and other regular files — three-way diff

### Scan mode

Called by `use-case-sync` for each installed use-case with `update_available`. Enumerates every file in the upstream `install-config.json` `installs[]` array. For each file, runs a three-way merge:

- **Local vs upstream:** what's on disk now vs what the new repo version says
- **Local vs ancestor:** what's on disk now vs what was originally installed at the currently-installed version (resolved from `installed_commit_sha`, or by walking commits to find the matching install-config version, or conservative-flag mode if ancestor is unknown)
- **Decision:** if local matches ancestor, user didn't customize — clean replace. If local differs from ancestor, user customized — flag conflict.

For `user.md` snippets specifically, structural diff plus LLM semantic check against adjacent user-written rules.

### Resolve mode

Called from an admin's chat reply to a pending plan. Interprets natural language per file ("apply upstream on search.py, keep mine on SKILL.md, go with option 2 on the user.md conflict"), builds final content per file, applies atomically, updates `installed.json` (including `installed_commit_sha`), and marks the plan resolved.

### Setup mode

Runs at first install and any time an admin asks to change notifications. Branches on Slack connection state. Proactively suggests connecting Slack if not connected. File-only mode is the explicit decline path.

### Source-of-truth model

- `installed.json` and upstream `install-config.json` track the use-case version. These are authoritative.
- The version embedded in a snippet sentinel tracks the snippet's own revision and can legitimately differ from the use-case version.
- Sentinel presence (for snippet-bearing use-cases) indicates installation.
- `installed_commit_sha` on installed.json (new in v1.0.0) anchors the merge ancestor. Pre-existing installs without it fall back to commit-history walk or conservative-flag mode.

### Org-agnostic

No hardcoded channel IDs, workspace IDs, admin names, or org-specific paths. All variable values read at runtime from `/agent/brain/permissions/config.json` and `/agent/brain/permissions/admins.md`.

### Out of scope (v1)

- Use-cases without an `install-config.json` (manual installs)
- Cross-use-case conflicts (two use-cases installing to the same path)
- Deleting locally-installed files that have been removed from the upstream use-case (logs and surfaces, but doesn't delete)
- Patching other use-case skills (e.g., `install-use-case`) to write `installed_commit_sha` on install — surfaced as a follow-up task

### Follow-ups already surfaced

- `install-use-case` should be updated to write `installed_commit_sha` to `installed.json` so ancestor resolution is precise for new installs. Until then, ancestor resolution uses the commit-history-walk fallback.
