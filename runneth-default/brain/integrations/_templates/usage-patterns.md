---
type: Template
id: integrations/templates/usage-patterns
title: Integration Usage Patterns Template
scope: org
status: active
template_variant: source
aliases: [usage patterns template, integration usage template]
---

# Integration Usage Patterns Template

Use this shape to preserve what Runneth learns from repeated use of an integration.

```yaml
---
type: Integration
id: integrations/<integration-slug>/usage-patterns
title: <Integration Name> Usage Patterns
scope: org
status: draft
aliases: [<integration-name> usage, <integration-name> working patterns]
---
```

# <Integration Name> Usage Patterns

## <Command, Question, Or Workflow Name>

**Last observed:** YYYY-MM-DD

**Use frequency:** high | medium | low | unused

**Primary users:** Add names only when the pattern is person-specific.

**How it is actually used:**
Add the real workflow, not a generic capability summary.

**What happens after the output:**
Add whether the result usually becomes a brief, report, Slack message, decision, follow-up query, or other action.

**Friction observed:**
Add errors, repeated rephrasing, filters users keep adding, or places where the output misses the job.

**Personalization signals:**
Add metric preferences, date windows, output formats, routing preferences, or recurring follow-up patterns.

**Suggested improvement:**
Add one concrete improvement tied to observed use.
