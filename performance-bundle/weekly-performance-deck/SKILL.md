---
name: weekly-performance-deck
description: Produces an on-brand weekly performance deck as an openable HTML page at a dated app route, framed against last week's deck so the narrative continues over time. Walks each funnel stage with stage overview, new launches and active tests, deep dives on top creatives or creatives that shifted, and concrete recommendations for next week. Composes paid-strategy-audit (funnel frame), creative-deep-dive (per-creative diagnoses), and brand-kit (visual style + brand screenshots). Runs every Friday by default. Triggers on schedule, on explicit request ("build the weekly deck", "Friday deck", "performance deck", "generate this week's deck"), or as a follow-up after a fresh audit.
---

# Weekly Performance Deck

You are producing the team's weekly performance deck. The deck is the hero deliverable for this use case — a brand-styled HTML page at a dated app route, posted to Slack as a share link anyone can open.

The deck is not a data dump. It's an episode of an ongoing show. Every slide is framed against last week's deck. Stable things get one-line "still holding" notes. Things that changed get focus. Things that are new get full treatment.

---

## Core principle

**Continue the narrative.** Read last week's deck before drafting any slide. The deck's value compounds — week 17 should reference week 16's recommendations and report on what happened to them.

**Use the strategy brief as the frame, not the data.** The audit's `<channel>-strategy.md` decides which funnel stages exist, what their validated metrics are, what counts as "scaling." Don't infer stages from a fresh data pull — read the brief.

**Recommendations come from the deep dives, not from the deck.** When a creative meets the deep-dive threshold, run `creative-deep-dive`. When a test reaches readable spend, run `creative-deep-dive` on every creative in the test. The deck composes those outputs — it doesn't replace them.

**The deck is brand-styled, not Motion-styled.** Read the brand-kit, use the brand's colors / typography / motion. The Motion design system is the structural base; the brand kit is the visual override.

---

## What this skill produces

Per workspace, every Friday:

1. **A new dated route on the deck app:** `/weekly-deck/<YYYY-MM-DD>` under the workspace's deck app. Routes accumulate — previous Fridays remain at their original URLs.
2. **A snapshot file** at `/agent/brain/paid-strategy/weekly-deck/<workspace-slug>/<YYYY-MM-DD>--snapshot.json` capturing what the deck said about every funnel stage, every active test, every recommendation. Next week reads this file to frame against.
3. **A Slack post** to the configured channels (same channels as the audit drift, by default) with the absolute share URL and a one-line summary.

---

## Inputs the deck reads before drafting

In this order:

1. **The workspace's paid-strategy briefs.** Every `<channel>-strategy.md` under `/agent/brain/paid-strategy/<channel>/<workspace-slug>/`. If 2+ channels, also `/agent/brain/paid-strategy/overall-strategy.md`.
2. **The brand kit.** `/agent/brain/brand-kit/<workspace-slug>--brand-kit.md`. If absent, invoke `brand-kit` for the workspace first.
3. **Last week's snapshot.** `/agent/brain/paid-strategy/weekly-deck/<workspace-slug>/<prior-friday>--snapshot.json`. If absent (first run), the deck flags itself as the pilot.
4. **Current week's data.** Pull per channel — `motion meta insights` for Meta or `motion tiktok insights` for TikTok, both with `--date-range last_7d`, using the validated metrics from the brief.
5. **Workspace config.** `/agent/brain/paid-strategy/_config/<workspace-slug>.json` for ping channels and excluded campaigns.

---

## Execution

### Step 0 — Resolve scope and inputs

1. Workspace = Motion context default unless the user named another.
2. Date = current Friday (or override if explicitly invoked).
3. Read all five input layers above.
4. If no brief exists for the workspace, halt and route to `paid-strategy-audit` first. Tell the user: "I need to build your strategy brief before I can produce the deck. Running that now."
5. If no brand kit, invoke `brand-kit` silently before continuing.

### Step 1 — Frame against last week

Open last week's snapshot. For each funnel stage, capture:

- Top creatives that were called out
- Active tests that were running
- Recommendations that were made

For this week, classify each item:

- **Stable** — still in market, still performing in the same band → one-line "still holding" note
- **Changed** — material shift in spend, $/event, or status → focus slide
- **New** — wasn't in last week's deck → full treatment
- **Resolved** — test that has finished, recommendation that shipped → call it out explicitly with the early read

Write these classifications into a working notes file at `./workdir/<date>--deck-classifications.json`. The deck rendering reads this to decide depth per slide.

### Step 2 — Run deep dives where threshold is met

For each funnel stage, identify creatives that need a deep dive:

**Single-creative deep-dive threshold (default):**
- Creative is in the top 5 by spend in its funnel stage, AND
- Creative meets the funnel stage's implied performance band (below implied $/event threshold), OR
- Creative shifted materially this week (spend up 30%+, status changed scaling↔holding↔declining, or is a new launch with significant early spend)

**Test-set deep-dive threshold (default):**
- A test (launch batch, ad-set tournament, or explicit test grouping from the brief) has reached readable spend ($X depending on funnel — use the implied threshold from the brief)
- Run `creative-deep-dive` in test-set mode on the entire test

Invoke `creative-deep-dive` for each qualifying creative or test. Outputs land in `/agent/brain/creative-deep-dive/<workspace-slug>/...` as usual. Read the output paths and queue them for slide composition.

Hard cap per funnel stage: `MAX_DEEP_DIVES_PER_STAGE = 5` (configurable token). When the cap is hit, prioritize new and changed creatives over stable ones. Test-set mode can override the cap with a "click to expand" pattern in the rendered slide.

### Step 3 — Compose the deck

Render an HTML page using Motion's design system (`/runneth/references/html-generation--design-system.md`) as the structural base, overridden with brand-kit tokens (color, typography, radius, motion). All images and creative thumbnails embedded as base64 so the page bundle is self-contained.

#### Slide structure (single-channel deck)

1. **Cover**
   - Eyebrow: "Weekly performance deck"
   - Title: "<Workspace name> — Week of <date range>"
   - Subhead: one-line read of the week ("Steady week — top performers held, two new tests in flight, one recommendation from last week now scaling")
   - Backdrop: brand-site hero screenshot from brand-kit, slightly darkened
   - Brand wordmark/logo top-right

2. **At a glance**
   - Channel mix tile (if multi-channel, otherwise channel-name tile)
   - Total spend (last 7 days) with week-over-week delta
   - Total events (validated metric) with WoW delta
   - Blended $/event with WoW delta
   - One-line read framed against last week ("Spend up 8% on TikTok, flat on Meta. Blended $/event holding at $86.")

3. **Per funnel stage (one section per stage, in funnel order):**

   **a. Funnel stage overview slide**
   - Stage name + one-line description from the brief
   - Validated-metric tile for the stage (events, $/event, $ spent in stage this week)
   - Implied threshold from the brief
   - Top 3 creatives in the stage by spend with thumbnails and $/event
   - One-line read framed against last week ("Prospecting held the line. Top 3 unchanged; $/event drifted from $89 to $86, well inside the band.")

   **b. New launches & active tests slide**
   - What shipped in the last 7 days, grouped by campaign or test set
   - Updates on tests that were running last week: still in market / paused / scaled / killed
   - Early read on this week's new launches (spend so far, early $/event, too-early-to-call vs picking-up)
   - If a recommendation from last week shipped this week, call it out: "Last week we recommended testing X — it launched Tuesday. Early read: <signal>."

   **c. Deep dives (one slide per qualifying creative)**
   - Creative thumbnail + ad name + creator (if applicable)
   - Metrics block (spend, thumbstop, hold rate, validated metric, status)
   - "What's working" — 3-5 bullets from the deep-dive output
   - "Highest-leverage fix" — one bullet from the deep-dive output
   - Skill labels footer: hook tactic, psychological trigger, mechanic, format, hook strength

   For test-set deep dives, one combined slide per test:
   - Test set name + count of creatives
   - Performance distribution table
   - "What this test proved" — the dimension that won, the dimensions that didn't matter
   - Optional expand-to-detail showing per-creative deep dives

   **d. Recommendations for next week slide**
   - 3-5 specific, executable recommendations grounded in this stage's deep dives
   - Each one: what to test, why this iteration matters, how it fits the team's existing test-launch pattern from the brief
   - Frame as actions to ship, not options to consider

   Repeat (a)-(d) for every funnel stage in funnel order.

4. **Open questions slide**
   - Surface unresolved questions from the strategy brief and the deep dives
   - Mark which ones got new signal this week, which are still open

5. **Footer**
   - Date generated
   - Link to last week's deck for comparison
   - Channels and creatives counts that informed this deck
   - "Drift-detected briefs" note if any brief was rewritten by the Friday drift this week

#### Multi-channel deck

When 2+ channel briefs exist:

- Cover and at-a-glance cover all channels
- Default layout (`merged-stages`): funnel-stage sections span channels, with sub-tiles per channel inside each stage block
- Alternative layout (`channel-separated-stages`): full funnel per channel, with a cross-channel recommendations slide at the end
- Layout choice is configurable at install via the `DECK_LAYOUT` token. Default: `merged-stages`.

### Step 4 — Publish the deck to a dated route

1. Create the dated route on the workspace's deck app: `/weekly-deck/<YYYY-MM-DD>`
2. Build and deploy the route as part of the deck app. Routes accumulate; previous Fridays remain at their original URLs.
3. Read `app list` to confirm the route is live and get the absolute share URL: `<SPAWNETH_HOST>/<deck-app-route>/weekly-deck/<YYYY-MM-DD>`
4. The URL is anyone-with-the-link openable.

### Step 5 — Write the snapshot

Save `/agent/brain/paid-strategy/weekly-deck/<workspace-slug>/<YYYY-MM-DD>--snapshot.json`:

```json
{
  "workspace_slug": "...",
  "date": "YYYY-MM-DD",
  "deck_url": "https://...",
  "channels": ["meta", "tiktok"],
  "by_stage": {
    "<stage-id>": {
      "top_creatives": [{"id": "...", "spend": ..., "validated_metric_per_event": ..., "status": "scaling|holding|declining"}],
      "active_tests": [{"id": "...", "creatives": [...], "status": "...", "early_read": "..."}],
      "deep_dives_run": ["<creative-id>", "<test-id>"],
      "recommendations": [{"text": "...", "test_variable": "...", "fit_to_test_pattern": "..."}]
    }
  },
  "open_questions": [{"id": "Q1", "text": "...", "first_asked": "YYYY-MM-DD", "new_signal_this_week": false}],
  "narrative_summary": "One paragraph capturing the week's read for next week's deck to frame against."
}
```

### Step 6 — Post the deck to Slack

Read `ping_channels` from the workspace config. Post one message per channel:

> 📊 *<Workspace name>* — Weekly performance deck for <date range>
>
> <one-line narrative_summary from snapshot>
>
> Open the deck: <deck_url>
>
> <@user_id(s) if any tags configured>

Include the configured `ping_user_tags` as inline mentions at the end if present.

If `DECK_DELIVERY_CHANNELS` is set in the deck-specific config, use that instead of `ping_channels` from the audit config. By default they're the same.

### Step 7 — Update INDEX

Add the new dated entry to `/agent/INDEX.md` under the deck path. Bump the local `_index.md` at `/agent/brain/paid-strategy/weekly-deck/<workspace-slug>/_index.md` with the new week.

---

## First-run behavior

When the deck runs for the first time on a workspace (no prior snapshot exists):

1. Skip Step 1 (no last-week framing — flag the deck as pilot in the cover subhead)
2. Treat every creative and test as "new" for the purposes of classification
3. Recommendations come purely from the deep dives, no continuity layer yet
4. The snapshot still gets written so next week has something to frame against

---

## Re-invocation

If invoked outside the Friday schedule (user asks for a deck mid-week or for a specific date range):

- Date in the cover and route reflects the user's requested date
- Snapshot is still written using that date
- Next Friday's scheduled run treats the manual run as the most recent prior snapshot for framing

---

## Anti-patterns

- **Don't skip reading last week's snapshot.** Without it, the deck reads like episode 1 every Friday and the narrative never compounds.
- **Don't infer funnel stages from a fresh data pull.** Stages come from the strategy brief. If the brief is wrong, the audit's Friday drift is the right fix, not the deck.
- **Don't overwrite the existing weekly-deck route.** Each Friday creates a new dated route. Past decks must remain accessible.
- **Don't merge deep-dive content into the per-stage overview slide.** The overview is the snapshot of the stage; the deep dives are their own slides.
- **Don't promote a deep-dive recommendation to the deck's main narrative without running the deep dive.** The deck composes deep-dive outputs; it doesn't generate them.
- **Don't use Motion design system colors for the deck body.** The deck is brand-styled. Brand-kit tokens override Motion's defaults except for structural shells (cards, grids, tables).
- **Don't ship a deep-dive slide with category-level language.** If the deep dive output says "the hook is good," that's a sign the deep-dive failed — re-run it before composing the slide.
- **Don't DM the deck.** Channels only, same as the audit.
