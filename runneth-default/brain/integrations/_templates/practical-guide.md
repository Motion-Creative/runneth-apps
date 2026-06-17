---
type: Template
id: integrations/templates/practical-guide
title: Integration Practical Guide Template
scope: org
status: active
template_variant: source
aliases: [practical guide template, integration guide template]
---

# Integration Practical Guide Template

Use this shape for the "how this actually works here" guide. This is not generic API documentation.

```yaml
---
type: Integration
id: integrations/<integration-slug>/practical-guide
title: <Integration Name> Practical Guide
scope: org
status: draft
aliases: [<integration-name> practical guide, how to use <integration-name>]
---
```

# <Integration Name> Practical Guide

## The One Thing To Know

- Add the most important practical rule that would save a future teammate time.

## Business Logic Required

- Add required filtering, normalization, joining, attribution-window handling, or source-of-truth logic.

## Correct Approach Vs. Naive Approach

### <Pattern Name>

**Why it matters:** Add what goes wrong without this pattern.

**Naive approach:** Add the tempting but wrong or incomplete approach.

**Correct approach:** Add the approach Runneth should use.

## Verified Working Patterns

- Add patterns that have been tested or confirmed in this organization.

## Known Landmines

- Add the highest-risk surprises for this organization, ordered by impact.

## Community Or Team Notes

- Add relevant community, team, or internal learnings that are specific enough to be useful later.

## Related Files

- `capabilities-and-scopes.md`
- `activation.md`
- `quirks.md`
- `usage-patterns.md`
