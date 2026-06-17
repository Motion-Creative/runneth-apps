---
type: Reference
id: integrations
title: Integration Maps
scope: org
status: active
aliases: [integrations, connected apps, data sources]
---

# Integration Maps

Use this folder for organization-specific instructions about connected integrations.

Platform-level facts about what an app is, how its API works, and which commands to use belong to Runneth's integration guides and registered app skills. This folder is for how this organization wants those integrations used.

## What Belongs Here

- Which source should be treated as the source of truth for each kind of question.
- KPI definitions, attribution windows, naming conventions, and custom fields.
- Important folders, channels, databases, lists, pipelines, reports, or review sources.
- Reporting preferences and recurring deliverables that depend on an integration.
- Known gotchas, exclusions, and open questions to confirm with the team.

## File Shapes

- Use `<integration-slug>.md` for a simple lightweight integration note.
- Use `<integration-slug>/index.md` when the integration needs a richer setup folder.
- Use `_templates/integration-map.md` for the main map.
- Use `_templates/capabilities-and-scopes.md` after an integration is connected or first used.
- Use `_templates/activation-plan.md` when Runneth has enough context to propose workflows.
- Use `_templates/practical-guide.md` for the practical "how this actually works here" layer.
- Use `_templates/quirks.md` when platform behavior surprises Runneth or a user corrects it.
- Use `_templates/usage-patterns.md` when repeated use reveals durable defaults or preferences.

## Protocols

- Use `_protocols/integration-types.md` to classify the integration before deep setup.
- Use `_protocols/quirks.md` when deciding how to capture gotchas and prevent repeat trust failures.
- Use `_protocols/usage-feedback.md` when repeated usage should improve defaults, routing, or person-specific context.

## How To Add An Integration Map

Create a new file or folder when a connected integration needs durable customer-specific instructions. Start with the smallest useful shape, then add companion files only when there is enough evidence to justify them.
