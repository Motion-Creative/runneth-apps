---
type: Template
id: integrations/templates/activation-plan
title: Integration Activation Plan Template
scope: org
status: active
template_variant: source
aliases: [activation plan template, integration activation template]
---

# Integration Activation Plan Template

Use this shape when Runneth has enough context to propose how this organization should use a connected integration.

```yaml
---
type: Integration
id: integrations/<integration-slug>/activation
title: <Integration Name> Activation Plan
scope: org
status: draft
aliases: [<integration-name> activation, <integration-name> setup plan]
---
```

# <Integration Name> Activation Plan

## Setup Context

- Who connected or requested the integration.
- The immediate job or reason for setup.
- Whether this is a lightweight setup or a deeper team setup.

## Integration Type

- Classify the integration using `_protocols/integration-types.md`.
- Note any ambiguity that must be clarified before building schemas, sync logic, or recurring workflows.

## Platform Map

- Alive structures, reports, folders, projects, channels, databases, pipelines, or accounts.
- Legacy or noisy structures to ignore.
- The team's vocabulary for the platform.

## Source Of Truth And Routing

- When this integration should be used.
- When another source should win.
- Which questions should route here.

## Business Logic Required

- Required joins, filters, thresholds, attribution windows, naming conventions, or transformations.
- What goes wrong if Runneth uses the raw API or raw export naively.

## Compound Opportunities

- Workflows that become possible because this integration can combine with Motion, Slack, files, or other connected integrations.

## Proposed Workflows

- Add 2 to 4 concrete workflows this organization should try first.

## First Action

- The first useful next action Runneth should take or offer.

## Open Questions

- Add only questions that materially affect future accuracy or setup.

## Related Files

- `capabilities-and-scopes.md`
- `practical-guide.md`
- `quirks.md`
- `usage-patterns.md`
