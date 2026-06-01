# Custom Conversion Clarification

The hard rule: when a user names a custom conversion in their message, resolve it via `motion meta custom-conversion-metrics` before any performance query. If the resolution is ambiguous, stop and ask. Don't guess. Don't silently pick the newest. Don't apply a tiebreaker.

This file documents the exact halt-and-ask flow that addresses the "custom conversion ambiguity" failure mode from Runneth Beta.

## When this fires

Anywhere the user references a conversion event in plain English: "new lead," "test start," "self-serve purchase," "calendly booking," "appointment scheduled," etc.

## The resolution flow

### Step 1: Fetch the custom conversions list

Call `motion meta custom-conversion-metrics`. This returns the workspace's full registry: each conversion's `id`, `name`, `customEventType`, `isArchived`, and `isUnavailable`.

### Step 2: Filter out archived and unavailable

Only match against conversions where `isArchived: false` and `isUnavailable: false`.

### Step 3: Try exact case-insensitive name match

Three outcomes:

- **Single match** → proceed silently. Build the KPI key using the matched `id` and the user's intent verb. Pass to `motion meta insights`.
- **Multiple matches** → **STOP. Ask the user.** Do not guess, do not apply tiebreakers, do not silently pick the newest. The entire skill chain halts. Pass a clarification question to the user.
- **No exact match** → continue to Step 4.

### Step 4: Try partial / substring match (only after exact match failed)

Three outcomes:

- **Any partial match exists, even just one** → **STOP. Ask the user.** Partial matches are never applied silently, even when only one candidate exists. "test start" matching "Test Started" is a judgment call that the user must confirm.
- **No partial match anywhere** → treat the phrase as non-conversion. Fall through. The phrase is probably an ad name, date, campaign, or regular English. Continue with the workspace-goal metric as default.

### Step 5: Check archived-only matches

If the user's phrase only matches archived or unavailable conversions, **STOP. Ask the user.** Surface that the only matches are archived and ask whether to run against the archived conversion or pick a different one.

## When clarification fires

The entire chain halts. Workspace Goal, Spend Threshold, and Custom Conversion Metrics have already returned in parallel — those results are set aside. Creative Insights is **not** called. The clarification message is passed directly to the user as the full response. The conversation resumes on the user's next turn, at which point the chain re-runs from the start with the disambiguated conversion in context.

## Clarification message shape

Pass a structured message containing:

- The user's original phrase
- The list of candidate conversions, each with:
  - `name`
  - `createdOnFacebook` (formatted as a readable date)
  - `customEventType`
  - Archive status (if surfacing archived matches)

## Examples

### Multiple exact matches

```
Your workspace has multiple active conversions matching "New Lead | CAPI." Which one did you mean?

1. New Lead | CAPI — created Nov 20, 2025 (type: LEAD)
2. New Lead | CAPI — created Nov 19, 2025 (type: LEAD)
```

### Partial match, single candidate

```
Your workspace has a "Test Started" conversion — is that what you meant by "test start"?

1. Test Started — created Jan 12, 2025 (type: OTHER)
```

### Only archived matches

```
The only "Self-Serve Purchase" conversion in your workspace is archived. Want me to run against it anyway, or do you mean a different conversion?

1. Self-Serve Purchase — created Nov 18, 2025 (type: LEAD, archived)
```

## KPI key construction (post-resolution)

Once a conversion is resolved to an `id`, build the KPI key from the user's intent verb:

- `{id}_count` — for "how many X," "X volume," "X count" (higher is better)
- `{id}_cost` — for "cost per X," "CAC on X" (lower is better)
- `{id}_roas` — for "ROAS on X," "return on X" (higher is better)

If intent is ambiguous, default to `_count` and note the assumption in the handoff.

Other valid suffixes: `_value`, `_rate`, `_purchase`.

**Never use `_total`** — it's not a valid Meta KPI suffix.

## Post-query diagnostic for zero-result custom conversions

If the conversion KPI returns 0 or null across all creatives, check the conversion's archive status before claiming a pixel problem. If the matched conversion has `isArchived: true` or `isUnavailable: true`, flag that as the likely diagnosis. The data isn't broken; the conversion was deprecated.

## Why this matters

The agent cannot reliably distinguish a custom conversion name from generic English in the user's message without the registry. "Test start" could be a launch date or a conversion called "Test Started." "New lead" could be a phrase or a conversion called "New Lead | CAPI." Guessing here produces silently wrong answers — which Runneth 1.0 does, and which customers don't catch because the output looks plausible. The halt-and-ask is the only way to get this right.
