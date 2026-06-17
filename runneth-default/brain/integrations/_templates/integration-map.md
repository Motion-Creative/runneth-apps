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

Use this shape when creating a customer-specific integration map.

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

## What This Integration Is Used For Here

- Add the confirmed jobs this integration supports for this organization.

## Source Of Truth Rules

- Add when this integration should win over other connected sources.

## Objects, Fields, And Routing

- Important objects.
- Important fields.
- Important folders, channels, lists, reports, databases, or pipelines.
- Questions that should route here.

## KPI And Attribution Preferences

- KPI definitions.
- Attribution windows.
- Naming conventions.
- Exclusions or filters.

## Example Questions

- Add examples of questions Runneth should answer with this integration.

## Standing Instructions

- Add durable instructions the team has confirmed.

## Gotchas And Open Questions

- Add known data quirks, missing context, or questions to confirm.
