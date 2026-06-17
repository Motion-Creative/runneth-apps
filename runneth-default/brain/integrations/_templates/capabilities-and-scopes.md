---
type: Template
id: integrations/templates/capabilities-and-scopes
title: Integration Capabilities And Scopes Template
scope: org
status: active
template_variant: source
aliases: [capabilities and scopes template, integration capabilities template]
---

# Integration Capabilities And Scopes Template

Use this shape for the first durable note after an integration is connected or first used.

```yaml
---
type: Integration
id: integrations/<integration-slug>/capabilities-and-scopes
title: <Integration Name> Capabilities And Scopes
scope: org
status: draft
aliases: [<integration-name> capabilities, <integration-name> scopes]
---
```

# <Integration Name> Capabilities And Scopes

## What This Integration Is

- Add a short, plain-language description of what this integration gives Runneth access to.

## Core Capability Areas

- Add what Runneth can read, answer, create, update, or deliver through this integration.

## Access And Setup

- Auth model.
- Connected account or workspace.
- Scopes granted.
- Any setup state that affects what Runneth can do.

## Data Access And Sensitivity

- What can be read.
- What can be written.
- What is sensitive or should be handled carefully.

## Verified Vs. Theoretical

- Mark capabilities as verified only after Runneth has tested or successfully used them.
- Keep untested capabilities as theoretical.

## Known Constraints

- Add confirmed limitations, permission gaps, rate limits, missing fields, or quirks.
- Link to the matching quirks file when one exists.
