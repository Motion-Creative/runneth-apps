---
type: Template
id: integrations/templates/quirks
title: Integration Quirks Template
scope: org
status: active
template_variant: source
aliases: [quirks template, integration quirks template]
---

# Integration Quirks Template

Use this shape when a platform behaves unexpectedly or a customer corrects how Runneth should handle it.

```yaml
---
type: Integration
id: integrations/<integration-slug>/quirks
title: <Integration Name> Quirks
scope: org
status: draft
aliases: [<integration-name> quirks, <integration-name> gotchas]
---
```

# <Integration Name> Quirks

## Q-001: <Short Title>

**Discovered:** YYYY-MM-DD

**Discovered by:** <person or system>

**Status:** `unhandled` | `handled-in-code` | `handled-by-warning` | `monitoring`

**Symptom:**
What the user saw or what Runneth observed.

**Platform behavior:**
What the platform actually does.

**Detection signal:**
How Runneth can recognize this next time.

**Fix or workaround:**
What should happen instead.

**Wired into:**

- [ ] customer integration note
- [ ] capabilities-and-scopes.md Known Constraints section
- [ ] practical-guide.md
- [ ] code, query, health check, or warning when applicable

**Never-twice check:**
How to confirm the same symptom should not surprise the user again.
