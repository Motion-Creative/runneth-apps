---
type: Template
id: integrations/templates/integration-map
title: Integration Map Template
scope: org
status: active
template_variant: source
aliases: [integration map template, integration setup template]
---

# Integration Map Template

Use this shape when creating the main customer-specific integration map. For lightweight setup, this can be the only file. For richer setup, create a folder at `/agent/brain/integrations/<integration-slug>/` and use this as `index.md` alongside the companion templates in this folder.

```yaml
---
type: Integration
id: integrations/<integration-slug>
title: <Integration Name>
scope: org
status: draft
aliases: [<integration-name>]
---
```

# Integration Name

Use this file for how this organization wants Runneth to use <Integration Name>.

## Integration Type

- Classify using `/agent/brain/integrations/_protocols/integration-types.md`.
- If the app can be used in meaningfully different ways, ask one specific question before creating deep setup notes.

## What This Integration Is Used For Here

- Add the confirmed jobs this integration supports for this organization.

## Source Of Truth Rules

- Add when this integration should win over other connected sources.

## Objects, Fields, And Routing

- Important objects.
- Important fields.
- Important folders, channels, lists, reports, databases, or pipelines.
- Questions that should route here.
- Alive structures to prioritize.
- Legacy or noisy structures to ignore.

## KPI And Attribution Preferences

- KPI definitions.
- Attribution windows.
- Naming conventions.
- Exclusions or filters.

## Write-Back And Delivery Targets

- Places Runneth should write, post, save, or deliver outputs.
- Permission or approval constraints before writing.

## Example Questions

- Add examples of questions Runneth should answer with this integration.

## Retrieval And Related Files

- Add whether this file should be loaded whenever the integration is in play, only for specific task types, or on request.
- Link related files such as `capabilities-and-scopes.md`, `activation.md`, `practical-guide.md`, `quirks.md`, and `usage-patterns.md` when they exist.

## Standing Instructions

- Add durable instructions the team has confirmed.

## Gotchas And Open Questions

- Add known data quirks, missing context, or questions to confirm.
