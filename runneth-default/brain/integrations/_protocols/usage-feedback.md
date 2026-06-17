---
type: Reference
id: integrations/protocols/usage-feedback
title: Integration Usage Feedback Protocol
scope: org
status: active
aliases: [integration usage feedback, usage patterns, integration learning loop]
---

# Integration Usage Feedback Protocol

Use this to capture how people actually use an integration after setup.

## Where It Goes

Write repeated usage patterns for a specific integration in:

`/agent/brain/integrations/<integration-slug>/usage-patterns.md`

Use `_templates/usage-patterns.md` when creating the file.

## What To Track

- Which questions, commands, reports, fields, filters, metrics, or date windows are used repeatedly.
- What the output is used for next, such as a brief, report, Slack message, decision, or follow-up query.
- What users keep correcting, narrowing, or rephrasing.
- Which proposed workflows never get used.
- Person-specific preferences that should also be saved to that person's team file.

## How It Improves Defaults

If a user repeatedly overrides a default, save that preference in the integration usage file.

Examples:

- They always sort by thumbstop instead of spend.
- They always use a 7-day view instead of 30 days.
- They always compare Northbeam against Meta, but treat Northbeam as the conversion source of truth.
- They always want a Slack-ready summary after the query.

If the pattern is person-specific, add it to the person's team file too. If it applies across the organization, keep it in the integration map and practical guide.

## Trust Rule

Corrections should improve the system, not just the current answer. If a correction exposes a platform quirk, write a quirk. If it exposes a durable usage preference, write a usage pattern. If it exposes a source-of-truth or KPI rule, update the integration map and practical guide.
