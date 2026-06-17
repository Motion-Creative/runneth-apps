---
type: Reference
id: integrations/protocols/quirks
title: Integration Quirks Protocol
scope: org
status: active
aliases: [quirks protocol, integration gotchas, never twice rule]
---

# Integration Quirks Protocol

Use this when a connected platform behaves unexpectedly, a user corrects Runneth, or a live call exposes a surprising edge case.

## Principle

If a user has to tell Runneth about an integration problem once, capture it so the same symptom does not surprise them again.

## Where It Goes

Write quirks for a specific integration in:

`/agent/brain/integrations/<integration-slug>/quirks.md`

Use `_templates/quirks.md` when creating the file.

## When To Write A Quirk

- The user says the result is wrong, weird, missing, or not how the platform works.
- A platform returns null, empty, rate-limited, permission-blocked, or unexpectedly shaped data.
- Runneth discovers a known platform limitation during setup or use.
- A workaround is required to get reliable results.

## Workaround Order

Before marking a quirk as unhandled, try to solve it in this order:

1. Handle it in the fetch, sync, query, or routing layer.
2. Reconstruct the value from other fields.
3. Use a different endpoint, query, account, export, or source.
4. Chunk, batch, paginate, or cache.
5. Warn proactively and specifically before the user hits the issue.
6. Ask a data-savvy user only when the missing fact is account-specific and cannot be inferred.

## Statuses

- `unhandled`: the problem can still surprise the user.
- `handled-in-code`: Runneth or the data layer handles it before the user sees it.
- `handled-by-warning`: Runneth cannot fully fix it, but warns with the exact condition and workaround.
- `monitoring`: kept for memory, but not active debt.

## Required Wiring

When a quirk is confirmed, also update:

- `capabilities-and-scopes.md` under Known Constraints.
- `practical-guide.md` when the behavior affects normal use.
- `usage-patterns.md` when the quirk came from repeated usage friction.

Do not copy generic API documentation into the quirk. Capture the customer-visible symptom, the platform behavior, the detection signal, and the fix.
