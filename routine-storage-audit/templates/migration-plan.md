# Storage Audit — <YYYY-MM-DD>

Audit run: <UTC timestamp>
Sandbox: <conversation id or sandbox identifier>
Auditor: routine-storage-audit skill

**Headline**: <n> apps, <n> routines, <n> misplaced, <n> shared-DB violations, <n> unclear.

---

## 1. Inventory

### Apps

| App name | Primary DB path | ATTACH'd reference DBs |
|---|---|---|
| <app-name> | /agent/brain/<app-name>/<app-name>.db | _core (read-only) |
| ... | ... | none |

<!-- If no apps were found, replace the table with: "No apps found under /agent/apps/." -->

### Routines

| Routine name | Type | Write target(s) | Inferred app | Classification |
|---|---|---|---|---|
| <Routine Name> | scheduled | /agent/brain/<app>/<app>.db | <app-name> | correctly-db |
| <Routine Name> | scheduled | /agent/brain/<topic>/log.md | none | correctly-file |
| <Routine Name> | scheduled | /agent/brain/<topic>/log.md | <app-name> (inferred) | misplaced-file |
| <Routine Name> | scheduled | /agent/brain/<orphan>/<orphan>.db | none | misplaced-db |
| <Routine Name> | upkeep | (none — chat output) | none | no-storage |
| <Routine Name> | monitoring | <unresolved> | <unclear> | unclear |

---

## 2. Misplaced routines

<!-- One subsection per misplaced routine. Order: misplaced-file first, then misplaced-db. Delete the section header line "None found." if any subsections are present. -->

None found.

### <Routine Name> (`<shortId>`)

- **Current write target**: <path>
- **Target write target**: <path>
- **Schema or file shape**:

```sql
CREATE TABLE <table_name> (
  id INTEGER PRIMARY KEY,
  fired_at TEXT NOT NULL,
  <field_name> <TYPE>,
  ...
);
```

<!-- For file targets, replace the SQL with the line/entry format, e.g.:
```
## <YYYY-MM-DD> <HH:MM> UTC
<field>: <value>
<field>: <value>

---
```
-->

- **Spec file rewrites** at `/agent/brain/playbooks/routines/<slug>.md`:

  Current Body language (verbatim):
  > <quote current spec text>

  Proposed replacement:
  > <quote proposed spec text>

- **Manifest entry updates** at `/agent/brain/routines/manifest.md`:

  ```yaml
  storage: <new path>
  feeds-app: <app-name | null>
  ```

- **Re-registration**: delete the routine and re-add via `routine-planner` after the spec and manifest are updated. There is no `reminder update`.

---

## 3. Shared-DB violations

<!-- One subsection per primary DB path that 2+ apps open. Delete "None found." if any violations are listed. -->

None found.

### Shared DB: `/agent/brain/<path>.db`

- **Apps sharing it**:
  - `/agent/apps/<app-a>/` — <app-a>
  - `/agent/apps/<app-b>/` — <app-b>
- **Recommendation**: merge into one app with multiple views. Canonical app: <app-a> (or <app-b>, with reasoning).
- **Consolidation scope**: <n> frontend pages to merge, <yes/no> shared components today, <n> new routes needed inside the canonical app.
- **Why this matters**: <one short sentence on what breaks under the current split>.

---

## 4. Unclear cases

<!-- One subsection per unclear routine or app. Delete "None found." if any are listed. -->

None found.

### <Subject name>

- **What's known**: <every piece of evidence found>
- **The question**: <a direct question for the user>
- **Suggested next step**: <how the user resolves this>

---

## 5. Historical data

<!-- One row per routine listed in section 2. Delete the table if section 2 is empty. -->

| Routine | Current data volume | Backfill recommendation |
|---|---|---|
| <Routine Name> | ≈<n> <records/lines> at <current path> | No — leave old data in place. <Optional: when backfill would matter and how it would look.> |

---

## Next steps

When you're ready to act on this plan:

1. Resolve any unclear cases in section 4 first.
2. Address shared-DB violations in section 3 by consolidating apps (this is a code refactor outside this skill).
3. For each misplaced routine in section 2, use the `routine-planner` skill to re-author the routine with the corrected storage placement. The audit does not auto-execute the migration.

Old audit plans are evidence. Do not delete prior `storage-audit-<date>.md` files when running future audits.
