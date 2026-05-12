# Inference Rules

How to determine each app's primary database path and each routine's write targets, from evidence already on disk and in the sandbox.

The audit is read-only. Every rule below describes a read, never a write.

## App inventory

### Finding apps

Apps live under `/agent/apps/<surface-name>/`. An app is the directory that contains a `buildeth.app.json` file. Use:

```bash
find /agent/apps -maxdepth 2 -name buildeth.app.json -type f
```

For each match, the parent directory name is the app name (also confirmed by the `name` field inside `buildeth.app.json`).

### Finding an app's primary DB path

The primary DB is the SQLite file the app opens read-write for its own data. Read `<app-dir>/server/src/db.ts`. Look for the SQLite construction call:

```typescript
import { DatabaseSync } from "node:sqlite"
const db = new DatabaseSync("/agent/brain/<app-name>/<app-name>.db")
```

The string argument is the **primary DB path**. There is exactly one of these per app under the storage rules.

When the path is built from a constant or environment variable, follow the binding once. If the path cannot be resolved to a literal absolute path with at most one indirection, mark the app's primary DB as **unresolved** and add a question for the user in section 4 of the plan.

### Distinguishing primary opens from `ATTACH`

A primary DB is opened with `new DatabaseSync(path)`. An attached DB is added with:

```typescript
db.exec("ATTACH DATABASE '/agent/brain/_core/core.db' AS core")
```

ATTACH does not count as a primary DB. Record attached paths separately (the audit may want to confirm `_core` exists and is read-only) but do not treat them as the app's own database. An app may have zero ATTACHes; that's normal.

### When `db.ts` is missing or unusual

If `server/src/db.ts` does not exist, search the rest of `<app-dir>/server/` for `DatabaseSync(` and use the first absolute-path argument found. If still nothing is found, mark the app's primary DB as **unresolved**.

## Routine inventory

### Listing routines

Run `reminder list` via `reminder-cli`. The output contains every active routine in the sandbox with its `shortId`, `name`, `content`, `cron` or `nextDueDate`, and `condition` fields.

### Finding a routine's write targets

For each routine, gather write targets from three sources in this priority order. Stop at the first source that gives a confident answer; only fall back to the next when the previous is silent or missing.

#### Source 1 — Manifest entry

Read `/agent/brain/routines/manifest.md`. If the file exists, parse it as YAML and find the entry whose `name` matches the routine name from `reminder list`.

A manifest entry following the new convention has these fields:

```yaml
- name: Daily Performance Pull
  storage: /agent/brain/perf-dashboard/perf-dashboard.db
  feeds-app: perf-dashboard
```

When `storage` and `feeds-app` are both present, trust them and stop. This is the most reliable source because it was written by `routine-planner` at registration time.

Older manifest entries may not have these fields. In that case, fall through to source 2.

#### Source 2 — Spec file

The routine's spec lives at `/agent/brain/playbooks/routines/<slug>.md` (slug derived from the routine's name). If the spec exists, scan its Body section for path-like strings starting with `/agent/brain/`:

- Paths ending in `.db` → DB write target.
- Paths ending in `.md`, `.txt`, `.json`, `.csv`, or with no extension under a topic directory → file write target.

Capture every distinct path. A routine that names multiple paths writes to multiple targets — record all of them and note the multi-target case for the plan.

If the Body section is missing or vague (e.g., "update the brain" with no path), the spec is not specific enough. Fall through to source 3.

#### Source 3 — Reminder `--content` field

When no manifest entry and no spec file resolve the question, read the routine's `--content` field directly (via `reminder get <shortId>`). Apply the same path-pattern scan as source 2.

If `--content` is also silent on write targets, mark the routine **unclear** and record what evidence you did find (the routine's name, its purpose as stated in `--content`) for section 4 of the plan.

### Handling multi-path routines

A routine that writes to both a DB and one or more files needs scrutiny. Record both targets and flag the routine. Two common patterns:

- DB is the substantive output, files are incidental (log lines, debug breadcrumbs) → still a `correctly-db` or `correctly-file` classification based on the DB target.
- Files are the substantive output, DB write is leftover from an earlier draft → a violation that may need cleanup.

Do not silently pick one. Put the routine in section 2 (misplaced) or section 4 (unclear) with both paths surfaced for the user to confirm.

## Routine → app linkage

For each routine that writes to a DB path:

- If the DB path matches the **primary DB** of exactly one app → the routine **feeds that app**.
- If the DB path matches **no** app's primary DB → the routine is writing to an **orphan DB**. Classify as `misplaced-db` (a DB exists with no reader).
- If the DB path matches **two or more** apps' primary DBs → those apps are in a shared-DB violation (section 3). The routine itself feeds whichever app is canonical; the violation is on the app side. Note the routine and let the user resolve the app side first.

For each routine that writes only to files:

- Routine is **standalone**. Classify as `correctly-file`.

For each routine that writes to neither files nor a DB (the work fires and posts to chat / Slack / nothing):

- Routine is **notification-only**. Classify as `no-storage`.

## Edge cases

- **Routine with no manifest entry, no spec file, and ambiguous `--content`**: classify as `unclear`. Surface the routine's name, the conversation it was created in (from the reminder's metadata), and what its `--content` actually says, in section 4.
- **Spec file exists but references a path that does not exist on disk**: still treat the path as the routine's stated write target. The audit is about intent and rule compliance, not whether the path has been created yet.
- **Routine writes to `/agent/brain/_core/core.db`**: this is the agent-owned reference DB. The routine that maintains `_core` is a special case — it does not feed any single app, it maintains shared reference data. Classify as `correctly-db` with a note explaining the special role. Do not flag as `misplaced-db`.
- **App's primary DB path is unresolved (source 2 of finding the path failed)**: any routine that writes to a `/agent/brain/<that-app-name>/...db` path is **probably** feeding that app, but cannot be confirmed. Note this pair in section 4 and ask the user to confirm the app's actual DB path.
- **Two manifest entries with the same `name`**: this should not happen, but if it does, treat both as the same routine for inventory purposes and add a note in section 4 that the manifest has a duplicate entry needing cleanup. The duplicate is a manifest-hygiene issue, not a storage-placement issue.
