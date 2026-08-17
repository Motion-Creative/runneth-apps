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

## The three tabs

### 1. ROI report (conditional)

- Appears only when both are true: an Account Context doc exists (for the product, campaign, and funnel split) and a roster cost source is connected (for creator fees).
- Without Account Context, you can still show spend and return per creator but not the product or funnel slice.
- Without a cost source, leave this tab out rather than faking margin.
- When shown, present program investment (creator fees plus media spend), the event vs content or product split from account context, cost per outcome, and a short method note. Label any fee allocation as directional when there is no per-campaign fee split.

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
