---
name: build-creator-dashboard
description: Build the openable creator dashboard app for one activated workspace, with an ROI page, creator profiles, and a spend leaderboard. Use when someone asks to build, open, or refresh their creator dashboard.
triggers:
  phrases:
    - build my creator dashboard
    - open my creator dashboard
    - creator roi dashboard
    - show my creator dashboard
  intent: Render the confirmed roster and performance as a three-page app matched to the reference template.
---

# Build the creator dashboard

This skill builds the openable dashboard over the workspace's confirmed state. It reads state; it does not create trust or pull new evidence. The layout matches the reference template (Alysha's Q2 creator ROI report): three tabs.

## Requirements

- The workspace must be activated and have a confirmed roster.
- Build the app through the app builder. Keep durable data in the app `data/` directory as JSON derived from workspace state; the app is the view, not the source of truth.
- Private to the workspace by default. Confirm visibility when handing it back.

## Before building

- Ask which date window(s) the dashboard should cover, and never assume last year. Offer last 30, 60, and 90 days plus last 365, and support switching between them so the customer can see the difference across windows. Default to all four if they do not narrow it.
- Build the complete dashboard in one pass. Do not ship a trimmed single view: the creator profile cards and the per-creator Events and Sales performance (and cost per outcome where cost data exists) are core, not optional add-ons. Only leave a piece out when its data genuinely is not available, and say so.

## The three tabs

### Tab structure and required contents

The dashboard has three tabs plus a global window selector, and rebuilds this way for every workspace. The window selector offers 30/60/90/365 days and recuts every tab. Everything is real: hooks from ad transcripts, thumbnails from the actual ads, products parsed from ad names, talent type from the roster source, conversions from the workspace's events. Never fabricate a field; leave it out and say so when the data is missing.

- **ROI report tab:** a KPI strip (active creators, spend, and the workspace's conversion buckets) plus the ROI panel per the cost-integrity rule below.
- **Creators tab:** one rich card per active creator, matching the reference design. Each card carries: avatar, name, talent type and category; a conversions badge for the window; a plain-English line (type, ads in the window, the products/campaigns they ran, and the window's conversions and spend); the verbatim **top hook** from the creator's top ad transcript; a **work-samples** row of that creator's top ad thumbnails; **campaign/product tags**; and a footer stat row (ads, conversions, spend).
- **Leaderboard tab:** a table of every active creator with spend, the conversion buckets, and cost per outcome where cost exists.

### 1. ROI report (conditional)

- Appears only when both are true: an Account Context doc exists (for the product, campaign, and funnel split) and a roster cost source is connected (for creator fees).
- Without Account Context, you can still show spend and return per creator but not the product or funnel slice.
- Without a cost source, leave this tab out rather than faking margin.
- Present ROI only at the level the cost data actually supports. Media spend and return come from Meta; creator fees come from the connected cost source.
- Cost integrity, hard rule: if creator fees are tracked per creator or per campaign, ROI may be shown at that level. If fees are only program-wide (one total, no per-creator or per-campaign split), show only the total ROI of the whole creator network: total creator fees plus total media spend against total return. Never allocate program-wide fees across creators, products, campaigns, or funnel buckets, not even labeled as directional or an estimate. Fabricated allocation is never allowed.
- Media-only cost per outcome comes straight from Meta and may be shown per bucket, since it needs no fee allocation. The all-in, fee-loaded view stays at the level the fee data supports.
- Default to total-network ROI. Go more granular only when the customer explicitly asks and the cost data exists to support it.

### 2. Creators

- One card or row per confirmed creator: talent type, ads, the performance measure (spend and the workspace measure), formats, the verbatim hook from their top ad, and thumbnails.
- Pull thumbnails and hooks from evidence and Meta; do not invent them.

### 3. Leaderboard

- Creators ranked by spend.

## Rules

- Reproduce Motion-provided fields, labels, scope, grain, and windows exactly. Do not relabel or resegment.
- Surface the classification logic that decides what is in or out of each section where the person can see it, not only in code.
- Keep video files out of image and chart fields; use still thumbnails for tables and charts and video URLs only for video cards.
- Never present interpolated or estimated numbers as source data.
