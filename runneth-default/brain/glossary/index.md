---
type: Reference
id: glossary
title: Customer Glossary
scope: org
status: active
aliases: [glossary, customer definitions, KPI setup, attribution setup]
---

# Customer Glossary

Use this folder for team-confirmed definitions that make analysis, briefs, and reports consistent.

These files are customer-owned. The templates define the shape, but the actual values should come from the customer's setup, Motion data, connected integrations, saved strategy, or direct confirmation from the team.

## Canonical Terms

- `primary-kpi`: the metric the account is graded on and whether higher or lower is better.
- `attribution`: click/view windows and source of truth for conversion reads.
- `winner-definition`: the bar for calling a creative a winner or loser.
- `ad-states`: how the team distinguishes test, scaling, evergreen, paused, and similar states.
- `naming-conventions`: how campaign, ad set, and ad names map to funnel, product, audience, offer, or test.
- `funnel-stages`: how prospecting, retargeting, retention, and other stages are detected.
- `voice-rules`: copy rules, banned words, and tone constraints.
- `channel-roles`: what each connected channel is for and whether it has a KPI override.

## How To Use

Start with a template under `_templates/`, seed the value from available evidence, and mark it as unconfirmed until the team verifies it. Do not treat an inferred glossary term as locked.

Glossary files should be referenced by strategy, reporting, integration, and brief files rather than duplicating the same definition in multiple places.
