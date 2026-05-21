---
name: setup-brand-audit
description: One-time setup for brand-audit. Asks for the brand site URL, the review sources to mine, the competitor shortlist, and the Slack channels for the Monday refresh ping. Runs automatically after install and can be re-invoked any time with "set up brand-audit", "reconfigure brand-audit", or "personalize brand-audit".
---

# Setup — brand-audit

Five questions. One at a time. Write each answer immediately. Confirm at the end.

---

## Trigger

```yaml
triggers:
  phrases:
    - "set up brand-audit"
    - "personalize brand-audit"
    - "reconfigure brand-audit"
  intent: "User wants to configure or re-configure brand-audit for their workspace"
```

Also runs automatically as the final post-install step.

---

## Execution

### Step 1 — Resolve workspace

Default to Motion context's workspace. Confirm in the first message: "Setting up brand-audit for `<workspace name>`. Five quick questions."

### Step 2 — Brand site URL (required)

> What's the brand's primary website? Brand-intake reads this to extract identity, value prop, and voice signal.

Accept one URL. Validate it loads. Write to `_config/<workspace-slug>.json` → `brand_site_url`.

### Step 3 — Review sources (optional but strongly recommended)

> Where can I read this brand's customer reviews? Multiple sources are great. Examples: Trustpilot URL, Amazon product pages, an internal NPS export uploaded to the conversation, App Store / Play Store URLs, G2 page. Without review sources, the VOC layer will be incomplete.

Accept zero or more sources. Each one as a URL, a known platform name, or a "I'll upload it" placeholder. If they say none, flag it — the bundle will be incomplete but functional. Write to `review_sources: [...]`.

### Step 4 — Competitor shortlist (optional)

> Who are the brand's 3-7 closest competitors? If you skip this, I'll auto-detect from the brand site, the category, and search-share data, but a curated list is better.

Accept zero or more competitor names or URLs. Write to `competitors: [...]`. If empty, the `competitor-analysis` skill auto-detects on first run.

### Step 5 — Refresh ping channels (required)

> Which Slack channel(s) should I ping when the Monday refresh surfaces material changes? Same default as paid-strategy-audit (channels only, no DMs). If brand-audit is being installed alongside paid-strategy-audit, you can say "same as paid-strategy" and I'll inherit those channels.

Accept one or more channel IDs (or "same as paid-strategy" to inherit). Validate membership. Write to `ping_channels: [...]`. Optional inline user tags `ping_user_tags: [...]`.

### Step 6 — Refresh day/time (optional)

> Monday at 08:00 in your timezone is the default refresh window — lands before the Friday deck so the deck reads the latest. Want to keep that, or pick a different day/time?

Default Monday 08:00 in the workspace timezone resolved from `/agent/.runtime/timezone`. Override if requested. Write to `refresh_schedule`.

### Step 7 — Confirm and schedule

> Locked in for `<workspace name>`:
> - Brand site: `<url>`
> - Review sources: `<list or "none configured — VOC will be a gap">`
> - Competitors: `<list or "auto-detect on first run">`
> - Refresh pings: `<channels>` `<tags if any>`
> - Refresh window: `<day at HH:MM timezone>`
>
> You can re-run "set up brand-audit" any time to change these. Running the first brand-audit now.

Confirm the Monday reminder is in the reminder system. Then trigger the main brand-audit skill for first run.

---

## Re-invocation behavior

When the trigger fires on a workspace that already has a config:

1. Read current config.
2. Show what's set.
3. Ask which fields they want to change.
4. Only re-ask those fields.
5. Write changes and confirm.

Do not blow away existing config silently.

---

## Anti-patterns

- **Don't ask all five questions at once.**
- **Don't accept a DM target** for the ping channels — channels only.
- **Don't proceed past Step 2 without a valid brand site URL** — brand-intake needs it.
- **Don't skip the gap warning when review sources are empty** — the team should know VOC will be incomplete.
