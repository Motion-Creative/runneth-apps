# Migration Plan Format

The audit produces one file at `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md`. Use [`templates/migration-plan.md`](../templates/migration-plan.md) as the starting structure.

The plan has five sections. Each is required, even when empty — an empty section is still useful evidence ("nothing was misplaced" is a finding).

## Section 1 — Inventory

Two tables.

### Apps

For each Buildeth app discovered under `/agent/apps/`:

| App name | Primary DB path | ATTACH'd reference DBs |
|---|---|---|

- Primary DB path comes from `<app-dir>/server/src/db.ts` per `inference-rules.md`.
- ATTACH column lists any `_core` or other read-only attaches. Empty for most apps.
- If primary DB cannot be resolved, write `unresolved (see section 4)` and add a corresponding entry in section 4.

### Routines

For each routine returned by `reminder list`:

| Routine name | Type | Write target(s) | Inferred app | Classification |
|---|---|---|---|---|

- Type is the routine shape from `routine-system.md` (one-time, scheduled, monitoring, scheduled-check, upkeep, script).
- Write target(s) are the paths discovered via the source-1/2/3 inference chain in `inference-rules.md`. List all of them when the routine writes to multiple paths.
- Inferred app is the app name from path matching, `none`, or `unclear`.
- Classification is one of: `correctly-db`, `correctly-file`, `misplaced-file`, `misplaced-db`, `no-storage`, `unclear`.

## Section 2 — Misplaced routines

One subsection per routine classified as `misplaced-file` or `misplaced-db`. Order by severity: `misplaced-file` first (an app is missing data), then `misplaced-db` (a DB exists with no reader).

For each misplaced routine, fill in:

- **Routine name** and short ID
- **Current write target**: the path(s) the routine writes to today
- **Target write target**: where the data should live under the storage rules
  - For `misplaced-file` feeding app X: `/agent/brain/<X>/<X>.db`
  - For `misplaced-db` with no app: `/agent/brain/<topic>/log.md` (suggest a topic name based on the routine's purpose)
- **Schema or file shape**: a concrete description of the target. For DB: the SQL `CREATE TABLE` shape (column names + types). For files: the line/entry format.
- **Spec file rewrites**: the lines in the routine's spec at `/agent/brain/playbooks/routines/<name>.md` that need to change. Quote the current Body language and the proposed replacement.
- **Manifest entry updates**: the `storage:` and `feeds-app:` fields that need to be added or changed in `/agent/brain/routines/manifest.md`.
- **Re-registration**: a one-line note that the routine must be deleted and re-added (no `reminder update` exists) after the spec and manifest are updated. Hand off to `routine-planner` for the re-author.

## Section 3 — Shared-DB violations

One subsection per primary DB path that two or more apps share. Order by number of apps sharing (most first).

For each violation:

- **Shared DB path**: the absolute path multiple apps open as primary
- **Apps sharing it**: the list of app names with their directories
- **Recommendation**: which app is canonical (suggest the oldest by directory mtime or by user heuristic); the others should be merged into the canonical app as additional views/routes inside its frontend
- **Consolidation scope**: rough size estimate — number of frontend pages to merge, whether the apps already share frontend components, whether new top-level routes are needed
- **Why this matters**: one short sentence on what breaks under the current split (data drift between two apps' caches, duplicated query logic, schema migrations needing to land in two places, etc.)

Do not attempt the consolidation in the plan. The plan recommends; the user decides and executes outside this skill.

## Section 4 — Unclear cases

One subsection per routine or app classified as `unclear`. Include:

- **Subject**: the routine name or app name
- **What's known**: every piece of evidence found — for routines, the `--content` text, any spec file content found, manifest entry if present; for apps, what `server/src/db.ts` looks like and why the path couldn't be resolved
- **The question**: a direct question for the user — "Does this routine write to a database or only to files?" or "What absolute path does this app's db.ts intend to open?"
- **Suggested next step**: how the user resolves it (e.g., "Read the spec at `/agent/brain/playbooks/routines/<name>.md` and confirm the intended write target.")

The user answers these questions on their own time; the audit does not block on them.

## Section 5 — Historical data

For each routine in section 2, a one-line note on historical data.

| Routine | Current data volume | Backfill recommendation |
|---|---|---|

- Current data volume: rough estimate ("≈40 markdown lines", "≈200 DB rows"). Use `wc -l` on files and `SELECT COUNT(*)` on tables.
- Backfill recommendation: default is **"no — leave old data in place"**. The old file or table stays until the user explicitly asks to import it into the new location. Only recommend backfill when the data is critical for the app to function on day one (e.g., a dashboard would be empty without historical data).

Backfill recommendations never include the actual migration. They describe what migration would look like ("parse markdown ledger lines into rows via a one-time script") but do not produce the script. That belongs to a separate human-driven migration run.

## Language conventions

- Use absolute paths everywhere. Never use `~` or relative paths in the plan.
- Use the routine's `name` (not `shortId`) as the primary identifier. Include `shortId` parenthetically the first time a routine is mentioned in a section.
- Quote spec-file language verbatim when proposing rewrites. Do not paraphrase.
- Use UTC for any timestamps. The plan's own `<YYYY-MM-DD>` in the filename uses the sandbox's local date, but timestamps inside the plan are UTC.
- Use present tense for facts ("Routine X writes to /agent/brain/topic/log.md"), future tense for proposals ("Should write to /agent/brain/app/app.db").
- Do not editorialize. The plan is a structured finding, not a recommendation memo. The recommendations belong in the per-section fields; do not add a separate "summary" or "thoughts" section.

## Stopping conditions

The plan is complete when all five sections have been filled, even if individual sections contain only "none found." Save the file. Do not chain into execution. Report the file path to the user and stop.
