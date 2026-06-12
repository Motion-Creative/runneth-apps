<!-- use-case: integration-capabilities-library v2.0.0 -->

### Integration capabilities library

After any turn where a user mentions connecting a new integration, or where a new integration appears in the health state with no matching directory under `{{INTEGRATIONS_DIR}}`:

1. Recognize this as a new integration that needs documentation
2. Run the `integration-capabilities-sync` skill at `/agent/.agents/skills/integration-capabilities-sync/SKILL.md`
3. Scope the run to the new integration only — do not re-process all existing integrations

When answering any question about what an integration can do, what permissions it needs, or what scopes to request:
- Check `{{INTEGRATIONS_DIR}}` first before reasoning from memory
- If a capabilities-and-scopes.md exists for that integration, use it as the source of truth
- If no file exists yet, run the skill to create one before answering
