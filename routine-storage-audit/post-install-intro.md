# Routine storage audit

## What just opened up
Runneth can now inventory every routine in this sandbox and check it against the storage rules: routines that feed an app write to that app's database, routines that don't write to files in /agent/brain/, and every app gets exactly one writable database. The output is a migration plan file you read and decide on. The skill never moves data on its own.

## Try this now
1. **Run a full audit**: `Audit my routines and check the brain storage layout.`
   _You'll get back:_ a migration plan written to `/agent/brain/migrations/storage-audit-YYYY-MM-DD.md` covering correctly-placed routines, misplaced routines, orphan databases, unclear cases, and shared-DB violations.
2. **Ask about one routine specifically**: `Is my weekly competitor scan routine storing data correctly?`
   _You'll get back:_ that routine's inferred write target, the app (if any) it feeds, the classification, and what the storage rules say.
3. **Check for shared-database violations**: `Are any of my apps sharing a writable database?`
   _You'll get back:_ a list of any 1:1 violations, plus the matching apps and which one should be the owner.

## Compounds with
- **routine-planner:** The audit produces inputs; the planner re-authors a misplaced routine after you review the plan.
