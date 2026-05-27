# Routine Storage Audit

Audits an existing Runneth org for misplaced routine data and one-database-per-app violations, then writes a migration plan. **Plan only** — it never moves data, edits routines, or touches a database. You read the plan and decide.

## What it checks

Two storage rules:

1. **A routine that feeds a Buildeth app stores its data in that app's database.** A routine that doesn't feed an app writes to files under `/agent/brain/`.
2. **One writable database per app, strictly 1:1.** Two apps sharing one writable database is a violation (a shared read-only `_core` ATTACH is fine).

## What it produces

A dated migration plan at `/agent/brain/migrations/storage-audit-<YYYY-MM-DD>.md` with five sections:

- **Inventory** — every Buildeth app (and its primary DB) and every routine (and where it writes)
- **Misplaced routines** — current vs. target location, with the fix
- **Shared-DB violations** — which apps share a database and how to split them
- **Unclear cases** — routines whose write target can't be determined, with the question to ask
- **Historical data** — rough record counts and a backfill recommendation (defaults to "no")

## How to use it

Ask your Runneth to "audit my routines" (also: "audit the brain", "check my org's storage layout", "find misplaced data"). It inventories every app and routine, classifies each routine against the rules, writes the plan, then stops and reports the plan's path.

To act on the plan, hand the misplaced routines to the `routine-planner` skill to re-author them — this skill produces the inputs for that one; it does not execute anything itself.

## Safety

Read-only inspection only: `reminder list`, reading files under `/agent/apps/` and `/agent/brain/`, and `SELECT` queries. It never registers, deletes, or edits routines; never edits the manifest; never writes anywhere except the dated plan file.
