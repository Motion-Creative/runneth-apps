# Health alerts

## What just opened up
Runneth now watches every connected integration and every active routine in this sandbox. When an integration breaks, a token expires, a routine goes overdue, an execution fails, or a dependency chain snaps, it sends a single alert to your configured Slack channel. One follow-up after your silence window if unresolved. A confirmation when things recover.

## Try this now
1. **See the current health state**: `What's the current health state of all my integrations and routines?`
   _You'll get back:_ a summary covering every integration (5-layer check) and every routine (overdue, execution, dependency), grouped by status.
2. **Trigger a manual health check**: `Run a health check right now.`
   _You'll get back:_ the routine fires on demand, results written to `/agent/brain/integration-health/health-state.json`, and a summary in chat.
3. **Investigate a degraded routine**: `Why is [routine name] showing as degraded?`
   _You'll get back:_ the specific failure mode (overdue, execution record missing, dependency broken), the last known good run, and the recommended fix.
4. **Adjust the silence window**: `Change the alert silence window to [hours].`
   _You'll get back:_ the config updated, the next alert cycle reflects the new window.

## Compounds with
- **building-integrations:** Newly connected integrations get auto-added to the health check.
- **integration-capabilities-library:** If a sync fails or scopes get revoked, both surfaces catch it.
