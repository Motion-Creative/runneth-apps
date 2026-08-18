---
name: build-creator-dashboard
description: Build or open the private creator dashboard app for one activated workspace, with creator profiles, a spend leaderboard, and an optional ROI tab. Use when someone asks to build, show, open, or refresh their creator dashboard or leaderboard.
triggers:
  phrases:
    - build my creator dashboard
    - open my creator dashboard
    - creator roi dashboard
    - show my creator dashboard
    - creator leaderboard
    - who are our best creators
  intent: Render confirmed roster and performance as two core tabs plus an ROI tab only when its required inputs exist.
---

# Build the creator dashboard

This skill owns the openable dashboard over the workspace's confirmed state. It never creates trust. It can invoke the refresh workflow for missing or stale requested snapshots after one explicit disclosure and approval. The layout matches the reference template (Alysha's Q2 creator ROI report): two core tabs plus an optional ROI tab.

## Requirements

- The workspace must be activated and have a confirmed roster.
- Route the browser-openable app through the built-in `/runneth/skills/app-builder/SKILL.md` lifecycle. Keep app-ready JSON in the app `data/` directory derived from workspace state; the app is the view, not the source of truth.
- Use the dashboard app shell and the built-in design-system components. Use `creative-table` pagination for leaderboards with more than 10 rows and `creative-card` for creator evidence; do not hand-roll equivalent controls.
- Keep OAuth protection enabled by default. Ask private versus public when creating the app, choose private when the person does not choose, and confirm the final visibility when handing it back.

## Before building

- Ask which date window(s) the dashboard should cover, and never assume last year. Offer last 30, 60, and 90 days plus last 365, and support switching between them so the customer can see the difference across windows. Default to all four if they do not narrow it.
- Treat a requested snapshot as stale when it is more than 24 hours old. Before refreshing any missing or stale window, disclose that Creator Intel will read Meta and write workspace performance snapshots plus private app data, then wait for one explicit yes. That yes covers the named refresh windows and app build only.
- If approved, invoke `refresh-creator-corpus` for only the missing or stale requested windows before deriving app data. For 60 days, use explicit inclusive dates: `endDate` is yesterday and `startDate` is 59 calendar days before it; never send the unsupported `last_60d` preset.
- If refresh is declined, use only existing snapshots, label their as-of dates, and omit a requested window that has no snapshot. Do not imply it is current or fabricate it.
- When the person asks only to open an existing ready app and its data is current, return the existing protected URL without rebuilding. A refresh request updates app `data/`; rebuild app source only when the structure changed.
- Build the complete dashboard in one pass. Do not ship a trimmed single view: the creator profile cards and the per-creator Events and Sales performance (and cost per outcome where cost data exists) are core, not optional add-ons. Only leave a piece out when its data genuinely is not available, and say so.

## Two core tabs plus conditional ROI

### Tab structure and required contents

The dashboard always has Creators and Leaderboard plus a global 30/60/90/365-day selector. Add ROI only when both Account Context and a connected creator-cost source exist. Everything is real: hooks from ad transcripts, thumbnails from the actual ads, products parsed from ad names, talent type from the roster source, and conversions from the workspace's events. Never fabricate a field; leave it out and say so when the data is missing.

- **Creators tab:** one rich card per active creator, matching the reference design. Each card carries: avatar, name, talent type and category; a conversions badge for the window; a plain-English line (type, ads in the window, the products/campaigns they ran, and the window's conversions and spend); the verbatim **top hook** from the creator's top ad transcript; a **work-samples** row of that creator's top ad thumbnails; **campaign/product tags**; and a footer stat row (ads, conversions, spend).
- **Leaderboard tab:** a table of every active creator with spend, the conversion buckets, and cost per outcome where cost exists.
- **ROI report tab, conditional:** a KPI strip (active creators, spend, and the workspace's conversion buckets) plus the ROI panel per the cost-integrity rule below.

### 1. ROI report (conditional)

- Appears only when both are true: an Account Context doc exists (for the product, campaign, and funnel split) and a roster cost source is connected (for creator fees).
- Without either input, leave the ROI tab out rather than faking margin. Creators and Leaderboard may still show Meta spend, conversions, and media-only cost per outcome.
- Present ROI only at the level the cost data actually supports. Media spend and return come from Meta; creator fees come from the connected cost source.
- Cost integrity, hard rule: if creator fees are tracked per creator or per campaign, ROI may be shown at that level. If fees are only program-wide (one total, no per-creator or per-campaign split), show only the total ROI of the whole creator network: total creator fees plus total media spend against total return. Never allocate program-wide fees across creators, products, campaigns, or funnel buckets, not even labeled as directional or an estimate. Fabricated allocation is never allowed.
- Media-only cost per outcome comes straight from Meta and may be shown per bucket, since it needs no fee allocation. The all-in, fee-loaded view stays at the level the fee data supports.
- Default to total-network ROI. Go more granular only when the customer explicitly asks and the cost data exists to support it.

### 2. Creators (core)

- One card or row per confirmed creator: talent type, ads, the performance measure (spend and the workspace measure), formats, the verbatim hook from their top ad, and thumbnails.
- Pull thumbnails and hooks from evidence and Meta; do not invent them.

### 3. Leaderboard (core)

- Creators ranked by spend.

## Rules

- Reproduce Motion-provided fields, labels, scope, grain, and windows exactly. Do not relabel or resegment.
- Surface the classification logic that decides what is in or out of each section where the person can see it, not only in code.
- Keep video files out of image and chart fields; use still thumbnails for tables and charts and video URLs only for video cards.
- Never present interpolated or estimated numbers as source data.
