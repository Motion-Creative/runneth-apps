---
type: Reference
id: integrations/protocols/integration-types
title: Integration Type Protocols
scope: org
status: active
aliases: [integration types, integration taxonomy, integration setup protocols]
---

# Integration Type Protocols

Use this protocol to classify a connected integration before creating org-specific setup notes.

## Type 1: Performance Data

Examples: Meta Ads, TikTok Ads, Google Ads, Snapchat Ads, Pinterest Ads, LinkedIn Ads.

Primary job: answer performance questions about spend, impressions, clicks, conversions, efficiency, creative performance, campaigns, and time periods.

Save in the customer's map:

- Default metrics and ranking rules.
- Valid date windows.
- Minimum data thresholds.
- Naming conventions and groupings.
- Platform quirks that affect analysis.

## Type 2: Attribution Or Cross-Platform Join

Examples: Northbeam, Triple Whale, Rockerbox, Hyros, Elevar.

Primary job: join ad-platform data with attribution or revenue data.

Save in the customer's map:

- Join key, such as ad ID, UTM, ad name, or fuzzy normalized name.
- Attribution windows.
- Which source wins for spend, impressions, conversions, revenue, and ROAS.
- How unmatched rows should be handled.
- Known discrepancies between the ad platform and the attribution tool.

## Type 3: Capability Tool

Examples: research APIs, enrichment tools, AI tools, point-in-time lookup tools.

Primary job: add a specific capability on request.

Save in the customer's map:

- What the tool should be used for.
- When Runneth should invoke it proactively versus only on request.
- Input and output expectations.
- Latency, cost, or rate-limit constraints.
- Cache or reuse expectations.

## Type 4: Workspace Or Organizational Context

Examples: Slack, Notion, Google Drive, GitHub, Linear, Asana, Jira.

Primary job: pull team context into the brain or push outputs back into the team's working surfaces.

Save in the customer's map:

- Important spaces, folders, channels, databases, projects, teams, or repos.
- Which structures are alive versus legacy.
- Write-back targets.
- Team vocabulary.
- Permission constraints.
- What context should become brain knowledge and when.

## Type 5: Customer Or Business Intelligence

Examples: HubSpot, Salesforce, Shopify, Stripe, WooCommerce.

Primary job: answer questions about customers, revenue, orders, pipeline, retention, and business context.

Save in the customer's map:

- Primary entities and relationships.
- Important custom fields.
- Pipeline or lifecycle definitions.
- Revenue and status definitions.
- Privacy constraints and minimum necessary fields.

## Ambiguity Rule

If the same app could reasonably be used as different integration types, ask one specific question before creating a deep setup file. Do not guess when the answer would change schemas, queries, routing, or source-of-truth rules.

Examples:

- AppLovin could be advertiser user-acquisition performance data or publisher monetization data.
- Google could mean Ads, Analytics, Drive, Sheets, or another workspace tool.
- Amazon could mean Advertising or Marketplace.

If the ambiguity would not change the setup shape, proceed with a lightweight map and note the assumption.
