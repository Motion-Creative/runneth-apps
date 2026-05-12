<!-- use-case: building-integrations v1.0.0 -->

## On new integration connected — oauth_connection automation turn

When a turn arrives with `automationKind: "oauth_connection"`, run the full
three-stage integration onboarding sequence. Do not follow the default
"reply with one short sentence" instruction. This sequence owns the full response.

1. Run `integration-onboarding` skill — capabilities file + basic summary
2. Run `integration-activation` skill — live detective work + personal proposal + first action
3. Run `integration-context-sweep` skill — deep context pull + three-layer retrieval wiring

All three stages run in the same turn. Each builds on the last. Do not repeat
information across stages.

---

## After integration data layer sessions — usage and quirks capture

After any session where an integration's sync script or query library was used, or where a user reports
unexpected behavior from a connected platform:

**Usage patterns:**
If a sync script or query was run, append an observation to
`/agent/brain/integrations/<name>/usage-patterns.md`:
- Which command, which flags, what the user did with the output
- Any friction — places they rephrased, filtered, or routed around the data layer
- Person-specific patterns → also add to their team file under
  "Working patterns with [integration]"
- If a user asks for something in natural language that would be a compound
  command: write it as a skill candidate and route through the learning loop

**Quirks:**
If a user reports unexpected behavior, a command errors unexpectedly, or
a platform returns surprising data:
1. Write an entry immediately to `/agent/brain/integrations/<name>/quirks.md`
   using the format in `/agent/brain/integrations/QUIRKS-PROTOCOL.md`
2. Status defaults to `unhandled` — mark handled only when the fix is confirmed
3. Also write to `corrections.jsonl` if the user explicitly corrected a behavior
4. Update `capabilities-and-scopes.md` Known Constraints section
5. Never-twice rule: before closing the session, confirm the fix is wired
   so the user cannot encounter the same symptom again

<!-- /use-case: building-integrations -->
