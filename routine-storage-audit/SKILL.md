---
name: routine-storage-audit
description: |
  Use to audit an existing Runneth org for misplaced routine data and
  one-DB-per-app violations. Triggers on "audit my routines", "audit the
  brain", "are my routines storing data correctly", "check my org's storage
  layout", "clean up the brain", "which routines should be writing to the
  app database", "are any apps sharing a database", "do my apps and routines
  match", "find misplaced data", "review where my routines write to". Inventories
  every Buildeth app and every routine, infers each routine's write target,
  classifies routines against the storage rules, and produces a migration
  plan file. Plan only; never modifies state.
---

## Purpose

Audit an existing Runneth org against two storage rules:

1. **A routine that feeds a Buildeth app stores its data in that app's database.** A routine that does not feed an app writes to files in `/agent/brain/`.
2. **One writable database per app, strictly 1:1.** Two apps reading the same writable database is a violation. A shared read-only `_core` ATTACH is allowed.

Produce a migration plan at `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md`. The user reads the plan and decides what to do. This skill never registers, deletes, or changes routines; never edits routine specs; never edits the manifest; never touches any database file; never writes to `/agent/brain/` outside the dated migration plan file.

Use [`routine-planner`](.agents/skills/routine-planner/SKILL.md) — the sibling skill — to re-author a misplaced routine after the user has reviewed the plan. This skill produces inputs for that one; it does not chain into it automatically.

## Required References

Read these before starting the inventory:

- [`references/storage-rules.md`](references/storage-rules.md) — the two rules in detail
- [`references/inference-rules.md`](references/inference-rules.md) — how to find each app's primary DB path and how to find each routine's write target
- [`references/plan-format.md`](references/plan-format.md) — the 5-section migration plan shape

## Workflow

1. **Inventory apps.** List `/agent/apps/*/buildeth.app.json`. For each app:
   - Record the app name from the manifest.
   - Read `server/src/db.ts` and extract the absolute path passed to the SQLite open call (per `references/inference-rules.md`). That path is the app's **primary DB**.
   - Record any `ATTACH DATABASE` paths separately. These are reference attachments and do not count as primary DBs.
2. **Inventory routines.** Run `reminder list` (via `reminder-cli`) to get every routine in the sandbox. For each routine:
   - If `/agent/brain/routines/manifest.md` has an entry by routine name, read its `storage` and `feeds-app` fields when present.
   - Otherwise, read the routine's spec file (typically `/agent/brain/playbooks/routines/<name>.md`). If no spec file exists, fall back to the reminder's `--content` field.
   - Extract every path the routine writes to. Distinguish file paths under `/agent/brain/` from DB paths.
3. **Infer routine → app linkage** per `references/inference-rules.md`:
   - Routine writes to a DB path that matches an app's primary DB → **feeds that app**.
   - Routine writes only to file paths and no DB → **standalone**.
   - Routine writes to a DB path that matches no app → **orphan-db** (note in the plan; the routine is producing structured data that nothing reads).
   - Routine's write target cannot be determined from any source → **unclear** (flag for user review).
4. **Classify each routine** into one of:
   - `correctly-db` — feeds an app, writes to that app's primary DB.
   - `correctly-file` — does not feed an app, writes only to files under `/agent/brain/`.
   - `misplaced-file` — feeds an app's data domain but writes to files instead of the app's DB.
   - `misplaced-db` — writes to a DB but no app reads it (orphan-db falls in here).
   - `no-storage` — does not persist anything (notification-only).
   - `unclear` — write target indeterminate.
5. **Detect shared-DB violations.** Group apps by primary DB path. Any path with 2+ apps is a violation. Build a per-DB record listing the apps that share it. ATTACH-only references to a shared DB do not count.
6. **Write the migration plan** at `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md` using [`templates/migration-plan.md`](templates/migration-plan.md). Fill all five sections per `references/plan-format.md`:
   - Inventory (apps + routines)
   - Misplaced routines (per routine: current vs target, schema or file shape, spec rewrites, manifest updates)
   - Shared-DB violations (per duplicated DB: which apps, recommended consolidation)
   - Unclear cases (per routine: evidence, the question to ask the user)
   - Historical data (per misplaced routine: rough record count, backfill recommendation defaulting to "no")

Then stop. Report the plan file path to the user.

## First Decision

- If the user asks what the audit will do, or what the rules are, answer directly from `references/storage-rules.md`. Do not run anything until the user confirms they want the audit.
- If the user asks for the audit, proceed through the workflow without further confirmation.
- If the org has no apps under `/agent/apps/`, the audit is still useful — only sections 1, 2, 4, and 5 will have content; section 3 (shared-DB violations) will be empty. Run anyway and note in the plan that no apps were found.
- If the org has no routines, stop and tell the user the org has nothing to audit.

## Trigger Tests

This skill should trigger for prompts like:

1. "Audit my routines and tell me which ones are storing data in the wrong place."
2. "Check whether any of my apps are sharing a database."
3. "Are my routines and apps set up correctly?"
4. "Review where each of my routines writes its output."
5. "Clean up my brain — figure out what's misplaced."

## Hard Rules

- **Plan only.** Never call `reminder add`, `reminder delete`, or `reminder complete`. Never edit any file under `/agent/brain/` except the dated migration plan at `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md`. Never edit any file under `/agent/apps/`. Never run any SQL that mutates a database. Never delete data.
- **Read-only inspection only.** Permitted reads: `reminder list` (and `reminder get` if needed for a specific routine), reading files under `/agent/apps/`, reading files under `/agent/brain/`, reading databases with `SELECT` queries. That is the whole tool surface.
- **No inference without evidence.** If a routine's write target is not present in its manifest entry, spec file, or `--content`, classify it as `unclear` and put the question to the user in section 4. Do not guess.
- **Do not classify ATTACH paths as primary DBs.** A routine's DB write target is the path it opens with `new DatabaseSync(...)` or equivalent in the spec's Body, not a path attached read-only with `ATTACH DATABASE`. See `references/inference-rules.md` for how to distinguish.
- **One plan per day per audit run.** If `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md` already exists for today, append a numeric suffix (`-2`, `-3`, ...) rather than overwriting. Old audit plans are evidence; never delete them.
- **Defer execution to `routine-planner`.** When the user wants to act on the plan, point them to `routine-planner` to re-author each misplaced routine. This skill does not re-author routines itself.

## Response Rules

- Final response after the audit completes: a one-paragraph summary plus the absolute path to the plan file. State the headline counts: `<n> apps, <n> routines, <n> misplaced, <n> shared-DB violations, <n> unclear`.
- Do not dump the full plan contents into chat. The plan file is the artifact.
- Do not propose execution. The user reads the plan and decides.
- If the user asks "what should I do first" after seeing the plan, point them at the most-broken category in this order: shared-DB violations, misplaced-file (an app is missing data it should be reading), misplaced-db (a DB exists that nothing reads), unclear.
