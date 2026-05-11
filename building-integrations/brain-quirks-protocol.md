# Integration Quirks Protocol

## What this is

Every platform has undocumented behaviors, silent failures, and edge cases that
don't appear in any API documentation. This protocol defines how we catch them,
document them permanently, and wire them into the system so the same problem
never surfaces for a user twice.

The rule is absolute: if a user has to tell us about a problem once, that problem
gets handled. If they ever have to tell us again, that is a trust failure.

---

## Where quirks live

Each integration gets a `quirks.md` file at:
```
/agent/brain/integrations/<name>/quirks.md
```

This file is **Layer 1** for its integration — it loads automatically whenever
that integration is active in a conversation. No keyword matching required.
Quirks are always in context when the platform is in play.

---

## Quirk entry format

Each quirk gets a structured entry:

```markdown
### Q-<NNN>: <short title>
**Discovered:** YYYY-MM-DD
**Discovered by:** <person or "system">
**Status:** `unhandled` | `handled-in-code` | `handled-by-warning` | `monitoring`

**Symptom:**
What the user saw or experienced. Exact language if they reported it.

**Platform behavior:**
What the platform actually does — the undocumented or unexpected thing.

**Detection signal:**
How to recognize this quirk programmatically or in context. Be specific enough
that it could be added to a CLI doctor check or an error handler.

**Fix / workaround:**
What resolves it. If handled in code, describe the defensive pattern used.
If handled by warning, what the warning says and when it fires.

**Wired into:**
- [ ] CLI code (which file, what change)
- [ ] CLI doctor command
- [ ] capabilities-and-scopes.md Known Constraints section
- [ ] capabilities-and-scopes.md Updated: YYYY-MM-DD

**Never-twice check:**
How we confirm this cannot surface as a user problem again. Be specific.
"Warning fires before the command runs" is specific.
"We'll handle it" is not.
```

---

## When a quirk gets written

A quirk entry is created immediately when any of the following happen:

**1. User reports unexpected behavior**
Anything a user says that signals the platform didn't behave as expected:
- "That's weird", "shouldn't this return X", "this used to work", "why is this null"
- Explicit corrections about platform behavior
- A user adapting their workflow around a platform limitation they found

Write the entry during the same turn. Do not defer. The corrections.jsonl captures
the correction — the quirks.md captures the platform-specific root cause and the fix.

**2. CLI encounters an unexpected error or edge case**
When a command returns unexpected data, a null where a value should be, a rate
limit not documented in the API, an auth error with a non-standard message.

**3. Context sweep finds a known limitation**
When sweeping a platform, if the official docs mention a known limitation, edge
case, or non-obvious behavior — pre-emptively write a monitoring quirk entry before
anyone hits it.

**4. Doctor command catches a new health pattern**
When the integration health check surfaces a degraded state that doesn't match
any known pattern.

---

## Quirk status definitions

**`unhandled`**
Documented but not yet fixed in code or by warning. The user could still hit this.
These are the highest priority — every unhandled quirk is a pending trust failure.
Unhandled quirks surface in the doctor command output with a clear label.

**`handled-in-code`**
The CLI handles this defensively. The user will never see the raw platform behavior.
Zero user-visible impact.

**`handled-by-warning`**
The CLI cannot fully handle it in code, but warns the user proactively before
they hit the problem. Acceptable only when the workaround requires user action.
The warning must be specific: "TikTok returns null for thumbstop_ratio on ads
with fewer than 1,000 impressions. Your results include X such ads."

**`monitoring`**
A known quirk that's been stable, fully handled, or resolved by the platform.
Kept in the file for institutional memory. Not surfaced in doctor output.

---

## The "never-twice" wiring checklist

Before marking a quirk as `handled-in-code` or `handled-by-warning`, confirm all
of the following are done:

- [ ] The quirk entry is written in `quirks.md` with full detail
- [ ] The `capabilities-and-scopes.md` Known Constraints section is updated
- [ ] The CLI code has been updated OR a proactive warning has been added
- [ ] The doctor command checks for this condition and reports it
- [ ] The quirk has been tested — the fix actually works
- [ ] The person who originally reported it (if a user) would not hit this again

The last check is the real one. Read the quirk from the user's perspective.
If there is any path where they encounter the same symptom again, the fix is
incomplete.

---

## Quirks and the doctor command

Every CLI built by cli-factory must include a doctor command. The doctor command
must:

1. Check for all `unhandled` quirks and surface them clearly:
   ```
   ⚠ Known issue: [symptom in plain language]
      Workaround: [what to do]
      Status: being fixed
   ```

2. Run the detection signal for each `handled-in-code` quirk to verify the fix
   is still working (platform behaviors can change).

3. Report the quirk count as part of its health output:
   ```
   ✓ 3 known quirks — all handled
   ⚠ 1 known quirk unhandled — see above
   ```

---

## Quirks and capabilities-and-scopes.md

The capabilities file's "Known Constraints" section should reflect all
`handled-in-code` and `handled-by-warning` quirks in plain language.
Sync this section whenever a new quirk is confirmed or its status changes.

The capabilities file is what future sweeps read. Quirks captured there
prevent the same discovery process from repeating in future sessions.

---

## Cross-person quirks

Some quirks only appear for specific users based on their auth scope, plan tier,
or account configuration. When a quirk is person-specific:
- Note it in the entry: "Only affects users with [scope/plan/condition]"
- Add it to that person's team file under a "Platform quirks" section
- Wire the detection to check for that condition before warning

---

## Quirk review cadence

The integration-context-sweep skill reviews the quirks file on every run.
Specifically it checks:
- Are there `unhandled` entries? → flag for immediate attention
- Are `handled-in-code` entries still accurate? → verify against current CLI
- Are there new platform behaviors from the sweep that should be pre-emptive
  monitoring entries?

No formal scheduled review needed — the sweep does it naturally on re-run.
