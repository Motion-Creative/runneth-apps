# Integration Capabilities Index

This directory is the canonical source of truth for what each connected integration can do and what permissions it needs. Every file is sourced directly from official API documentation and auto-reviewed nightly.

**Do not hand-edit these files.** They are maintained by the `integration-capabilities-sync` skill. If something looks stale, run the skill manually or wait for the next nightly pass.

---

## Connected Integrations

| Integration | File | Last Reviewed |
|---|---|---|

---

## Adding a New Integration

When a new integration is connected, the `integration-capabilities-sync` skill automatically:
1. Detects the new integration (compares health state to existing capability files)
2. Fetches the official API documentation and scopes/permissions reference
3. Creates a new `capabilities-and-scopes.md` file in a new subdirectory here
4. Indexes it in this README and in `/agent/INDEX.md`

To trigger manually: tell the agent a new integration was connected, or ask it to run the integration-capabilities-sync skill.

---

## File Structure

```
{{INTEGRATIONS_DIR}}
  README.md                        ← this file
  <integration-name>/
    capabilities-and-scopes.md     ← capabilities and scopes reference
```

---

## Nightly Review

The nightly routine re-fetches official API docs and scopes docs for each integration, diffs against the current file, patches anything that changed, updates the Last reviewed date, and logs material changes to the brain changelog.

---

*Maintained by the `integration-capabilities-sync` skill.*
