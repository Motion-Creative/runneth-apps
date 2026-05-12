# Storage Rules

The two rules every Runneth org follows.

## Rule 1 — Routines that feed apps use the app's database. Standalone routines write to files.

A routine **feeds an app** when its output is consumed by a Buildeth surface — anything under `/agent/apps/<surface>/` with a `buildeth.app.json` manifest.

- **Feeds an app** → write to that app's primary SQLite database at `/agent/brain/<app-name>/<app-name>.db`. The app reads the same path via `node:sqlite` `DatabaseSync`.
- **Does not feed an app** → write to files under `/agent/brain/<topic>/`. Default to a single append-only markdown ledger at `/agent/brain/<topic>/log.md`. Switch to a per-day file at `/agent/brain/<topic>/<YYYY-MM-DD>.md` only when the user genuinely skims by date.
- **Notification-only routine** (sends to chat or Slack, persists nothing) → no storage. This is valid; do not invent a file for it.

The rule is symmetrical. A routine writing to files when an app needs to query the data is a violation. A routine writing to a database when nothing reads it is also a violation — the database is overhead the org cannot justify.

## Rule 2 — One writable database per app. Strictly 1:1.

Each app owns exactly one writable database. Two apps reading the same writable database is a violation, even if the data is the same shape.

The remedy is to merge the two apps into one app with multiple views. The Buildeth playbook calls these "surfaces" — search, browse, tagger — they belong inside one app's frontend with multiple routes or pages, not split across two app directories that both open the same DB.

### Read-only `ATTACH` is allowed for shared reference data

When two or more apps need the same reference entities — products, customers, campaigns, taxonomies, lookup tables — they may attach a shared `/agent/brain/_core/core.db` read-only:

```typescript
db.exec("ATTACH DATABASE '/agent/brain/_core/core.db' AS core")
```

Constraints on `_core`:

- Created lazily. Do not create it preemptively. It exists only when 2+ apps actually need shared reference data.
- Agent-owned. No app writes to `_core`. Only the agent (a routine running in the brain, not in any app's request path) populates and updates it.
- Read-only ATTACH from each app. Never read-write.
- Holds only stable reference data — products, customers, campaigns, taxonomies. Not transactional data, not per-app state.

A read-only ATTACH to `_core` does **not** count as a shared-DB violation. The audit only flags two apps opening the **same primary writable DB**.

## Routine write targets

When a routine fires, its body writes to **one** of the following:

- The primary DB of exactly one app (when feeding that app).
- One or more files under a single topic directory in `/agent/brain/<topic>/` (when standalone).
- Nothing (when notification-only).

A routine that writes to a DB **and** to files needs scrutiny. Usually one of the two writes is incidental (logging, audit trail) and not the routine's real output. In the audit plan, record both targets and flag the routine for the user to confirm which write is the substantive one.
