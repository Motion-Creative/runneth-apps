---
name: paid-strategy-audit
description: Builds and maintains a durable strategic brief for each connected paid channel (Meta, TikTok, Pinterest, AppLovin, Snapchat, or any other ad platform integration). Produces channel-specific strategy briefs that every future performance question reads first, an alignment-check visualization the user reacts to, an optional cross-channel synthesis when 2+ channels are connected, and a Friday drift+ping routine that catches strategy shifts and rewrites briefs only on confirmation. Triggers on first run via missing brief; can be invoked explicitly with "audit my paid account", "build the strategy brief", "what's our paid strategy", "set up strategy audit", or any variation of strategic-frame setup for paid acquisition. Channel-agnostic — auto-detects connected platforms and researches unknown ones before producing their brief.
---

# Paid Strategy Audit

You are building the strategic brief for an ad account. The output isn't a report. It's a durable per-channel document that every future agent reads first when answering a performance question for this team. **The goal is communicating strategy, not inventorying data.**

This skill is channel-agnostic. Run it once and it produces a `<channel>-strategy.md` for every connected paid platform — Meta, TikTok, Pinterest, AppLovin, Snapchat, or anything else the workspace has wired up. Unknown platforms get researched and added to the channel library before their brief gets written.

---

## Core principle

**Mirror the strategy back to the team, per channel.** This isn't an audit — it's an alignment check. The user reads each per-channel one-pager and confirms (or corrects) the funnel architecture, the metric per step, and the testing pattern. Once they confirm, every future performance answer for that channel uses the brief as its frame.

**The user reacts to a visualization, not a wall of text.** One HTML one-pager per channel (the user opens it, scans the funnel cards, and reacts), paired with a short conversational chat message containing only two or three focused gut-check questions.

**Snapshot, not history.** Each brief captures the current strategy per channel. When the strategy shifts, the Friday drift check catches it and rewrites the brief on confirmation.

**Synthesize, don't inventory.** A new agent reading any `<channel>-strategy.md` should be able to answer:

- What is this team trying to do with paid acquisition on this channel?
- How is the channel's funnel structured, and what's each step optimizing for?
- Which metric matters for which step, and why?
- Where do they launch new tests in the account?
- What are they actively testing right now?

**No token assumption.** Names can be anything: structured (`au:US,CA-Lookalikes`), underscore-separated (`prospecting_lookalikes_form_fallback_oct`), free-form (`October prospecting LAL Form Fallback`), or a messy string. The audit acts as a detective. See Step 1 for parsing.

---

## What this skill produces

Per workspace, per connected channel:

1. **`/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`** — the alignment-check visualization. Always generated.
2. **`/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`** — the durable brief.
3. A short alignment chat message with the file link and the gut-check questions. No restated funnel breakdown in prose.

Per workspace, conditionally:

4. **`/agent/brain/paid-strategy/overall-strategy.md`** — cross-channel synthesis. Only when 2+ channel briefs exist.

Per workspace, on first run:

5. The `runneth-apps:paid-strategy:read-before-performance v1` block appended to `/agent/user.md` (idempotent via sentinel).

Per workspace, always:

6. A Friday drift+ping reminder scheduled, plus the workspace config at `/agent/brain/paid-strategy/_config/<workspace-slug>.json`.

Channel knowledge files (grow over time across orgs):

7. **`/agent/brain/paid-strategy/_channels/<channel>.md`** — how to read that platform. Researched on first encounter of a new channel.

---

## Execution

### Step 0 — Resolve scope and detect channels

Silently. No user-facing confirmation. The skill was either auto-triggered by a missing brief or explicitly invoked.

1. **Workspace:** default to the Motion context's workspace unless the user named another.
2. **Detect connected channels.** Use the available integration metadata and connected-source listings. Look for any active ad platform connection. Common identifiers: Meta (graph.facebook.com, META_ACCESS_TOKEN), TikTok (TikTok Ads Manager source), Pinterest (Pinterest Ads source), AppLovin (AppLovin source), Snapchat (Snap Ads source). For each detected channel, normalize to a slug (`meta`, `tiktok`, `pinterest`, `applovin`, `snapchat`, or whatever the platform is).
3. **Channel-research check.** For each detected channel, look for `/agent/brain/paid-strategy/_channels/<channel>.md`. If missing, run the auto-research flow (see Step 0a) before proceeding for that channel. Surface one line to the user: "I see <channel> is connected. Researching how to read it before I run the audit — one moment."
4. **Re-audit check.** For each channel, look for `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`. If it exists, this is a re-audit for that channel — keep the existing brief in memory and surface a diff at Step 4.

### Step 0a — Auto-research a new channel

When a channel has no `_channels/<channel>.md`:

1. Web-research the platform's ads structure. Pull:
   - Account hierarchy (the platform's equivalents of campaign → ad set → ad)
   - Common optimization events and naming patterns
   - Native KPI vocabulary
   - Funnel-stage conventions in that platform's ecosystem (TikTok skews top-of-funnel creator-led; Pinterest is high-intent visual search; AppLovin is mobile gaming networks; etc.)
   - Custom-conversion / event-tracking primitives
2. Check the workspace's connected-source metadata for the platform-specific event taxonomy and naming patterns visible in the actual account.
3. Write `/agent/brain/paid-strategy/_channels/<channel>.md` using this structure:

```markdown
# <Channel> — how to read it

**Channel slug:** <channel>
**First researched:** <YYYY-MM-DD>
**Last updated:** <YYYY-MM-DD>

## Account hierarchy

How the platform organizes ads. Equivalents of campaign / ad set / ad. Where naming usually lives.

## Native optimization events

What events the platform supports natively. How "validated metric" tends to map here.

## Native KPI vocabulary

The metric words the platform uses (e.g. Pinterest "saves", TikTok "video views", AppLovin "installs"). Translation back to standard funnel KPIs.

## Funnel-stage conventions

How teams typically structure funnels on this platform. Top-of-funnel motion, retargeting motion, conversion motion. Where this channel usually sits in a multi-channel mix.

## Naming-vocabulary hints

Channel-specific words to look for when parsing names: stage abbreviations, audience codes, format codes, creator-tag conventions. Add to the detective parser's vocabulary at Step 1.

## How to pull data

The Motion CLI commands (or other available tools) that return this channel's creative-insights and conversion metrics. Field-name nuances.

## Validation notes

What can and can't be inferred for this channel relative to Meta's behavior. Known parsing gotchas.
```

4. Add a one-line note to this `SKILL.md`'s supported-channels list (programmatic update at the bottom of the file) so the channel is discoverable next time.
5. Proceed to Step 1 for that channel.

### Step 1 — Auto-discover the account shape per channel

For each connected channel, pull the structural data. No narration needed.

```bash
# Workspace metadata + own-brand context (helpful when present)
motion workspaces                                                              # confirm workspace ID + name
motion meta custom-conversion-metrics                                           # full list of custom conversions: IDs, names, archived flag
motion brand-context --data-query "strategy positioning customer audience product"

# Account-wide creative pull, last 30d. Route per channel — flag shapes differ.

# Meta:
motion meta insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort topSpend \
  --include-metrics \
  --group-by creative

# TikTok:
motion tiktok insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort-by spend \
  --sort-direction desc \
  --grain ads \
  --include-metrics
```

Do NOT call `motion workspace-goal` or `motion spend-threshold`. Those are platform-level settings that may not match the team's actual KPI per stage. Validated metric per stage comes from naming and behavior, not config.

**Read the returned file. Apply detective-mode parsing.**

### Step 1a — Detective-mode naming parsing

For each campaign name, ad-set name, and ad name independently:

1. **Segment the name** using `:`, `_`, `-`, `/`, `|`, whitespace, and case transitions as candidate boundaries. Produce overlapping segmentations and reason over all of them — don't lock to one delimiter.
2. **Pattern-match against the domain vocabulary**, not a token grammar. For each segment, ask: does it look like —
   - An **optimization-event word**: `purchase`, `lead`, `book`, `signup`, `calendly`, `formfill`, `survey`, `subscribe`, `addtocart`, `atc`, `trial`, plus the workspace's custom-conversion display names, plus any channel-specific event vocabulary from `_channels/<channel>.md`
   - A **funnel-stage word**: `prospecting`, `pr`, `tof`, `top of funnel`, `retargeting`, `rt`, `bof`, `mof`, `consideration`, `awareness`, `acq`, `cold`, `warm`, `hot`, plus channel-specific stage words
   - A **content-thesis word**: `testimonial`, `ugc`, `static`, `vsl`, `whitepaper`, `case study`, `bundle`, plus recurring brand/program nouns repeated across multiple campaigns
   - An **audience word**: `lookalike`, `lal`, `broad`, `interest`, `1pd`, `cm`, `custom audience`, `intl`, country codes, lookalike-percent codes (`1pct`, `1-3pct`)
   - A **creator or asset reference**: a creator handle, an asset code like `FUN29228-A`
   - A **date**: `oct`, `2024-10`, `10-15`, `q4`, `wk42`, `H1`, ISO dates
   - A **structured token** in the `key:value` shape, treated as the highest-confidence form when present
3. **Score each match by confidence.** Clean colon-token = high. Free-form word floating in a recognized vocabulary = medium. Near-match or single-letter abbreviations = low and flagged.
4. **Cross-reference inferred optimization events** against `motion meta custom-conversion-metrics`. Skip archived conversions. Match against display names with fuzzy matching (case-insensitive, punctuation-stripped). Build:

```json
{
  "campaign_id_1": {
    "campaign_validated_metric": {"name": "Form Fallback", "count_field": "<id>_count", "cost_field": "<id>_cost", "confidence": "high"},
    "adset_overrides": [
      {"adset_id": "...", "adset_name": "...", "validated_metric": {"name": "Calendly Booked", "count_field": "<id>_count", "cost_field": "<id>_cost", "confidence": "medium"}}
    ]
  }
}
```

5. **Funnel stage detection.** Use the same detective lens. Find stage words in campaign names, infer themes from recurring nouns across multiple campaigns, verify by checking which creatives roll up under each grouping.

6. **Flag low-confidence reads.** Anything below medium confidence becomes a gut-check question at Step 4.

7. **What this kills:** the hardcoded token vocabulary (`au:`, `pl:`, `optim:`, `adc:`, `lp:`, `h1:`, `h2:`, `mf:`, `vf:`, `icp:`, `a:`, `i:`, `it:`, `f:`, `len:`) is no longer required. These become signal patterns. The skill still recognizes them when present but doesn't depend on them.

### Step 2 — Pull validated-metric data per stage

Re-pull per channel with validated-metric KPI flags. Verify `--chart-kpi` flag support via `motion meta insights --help` / `motion tiktok insights --help` before first run:

```bash
# Meta:
motion meta insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort topSpend \
  --include-metrics \
  --group-by creative \
  --chart-kpi "<event-1-id>_count" \
  --chart-kpi "<event-1-id>_cost" \
  --chart-kpi "<event-2-id>_count" \
  --chart-kpi "<event-2-id>_cost" \
  [...]

# TikTok:
motion tiktok insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort-by spend \
  --sort-direction desc \
  --grain ads \
  --include-metrics
```

Each creative's chart-kpi values live under `chartKpiMetrics[<field>].value` — not under `metrics`. Reading the wrong key returns zero.

Compute per campaign:
- 30d spend
- 30d events in its validated metric
- 30d $/event
- Active creative count
- Number of creatives launched in the last 14 days

### Step 3 — Decode the architecture

Synthesize. Form a hypothesis for this channel on:

**Funnel architecture.** Single funnel, two-step, three-step, or N parallel funnels.

**Per funnel step:**
- What it optimizes for
- Which campaigns belong to it
- The validated metric
- What the team appears to be testing within the step (read across campaign / ad-set / ad layers)

**Testing methodology — where do they launch tests?**

Walk through creatives launched in the last 14 days, trace each to its earliest ad, then decide one of:
- **Dedicated testing campaign** — all new creatives funnel through one campaign first (look for high creative velocity, mixed creators, batch launches)
- **Testing inside content-pillar campaigns** — new creatives launch directly into the campaign matching their content thesis
- **No dedicated pattern** — creatives land wherever spend allows

Also identify: tournament-style batches, long-tail testing, concentrated mode, ABO vs CBO, unit of testing (ad / ad set / campaign).

**Conviction vs experiments.** Proven engine campaigns vs active experiments.

**Excluded campaigns.** Non-commercial, test campaigns flagged as no-optimization, single-creative outliers that distort averages. Inferred from naming and behavior, not from a configured threshold.

### Step 4 — Build the alignment visualization + ask the gut-check questions

Generate the HTML one-pager first. Save to `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`. Use Motion's design system (`/runneth/references/html-generation--design-system.md`) for tokens and typography. Always generate, regardless of architecture complexity.

Structure for the HTML (per channel):

1. **Header** — eyebrow ("Alignment check · <Channel> · Last 30 days"), title ("[Brand] — <Channel> strategy snapshot"), one-line intro.
2. **Summary strip (4 tiles)** — 30d spend, active creative count, funnel shape (e.g. "4 parallel funnels"), new creatives in last 14d.
3. **Funnel grid (2-col, 1-col on mobile)** — one card per funnel step. Each card carries:
   - Step title + one-sentence "what this does"
   - Status badge (Proven / New bet / Legacy / Signups / etc.)
   - KPI row: validated-metric name, total step spend, total step $/event
   - Campaign list — **every line shows event count AND $/event alongside spend**.
4. **Tournament + experiments section** — same card shape, separated.
5. **"Where new tests launch"** — short paragraph + horizontal bar chart of creatives launched in the last 14 days per campaign.
6. **The read (3-tile grid)** — "Proven engine," "Active bet," "Open puzzle." 2–3 sentences each, color-coded.
7. **Three gut checks block** — dark background, numbered list, the questions sent in chat.

**Then send the short chat message.** Four parts:

1. **Acknowledge the trigger and why this matters.** Reference what the user asked for. Explain that confirming the strategy locks in how Runneth answers performance questions for this channel going forward. Warm, direct, consultant voice. Example:

   > "Hey, I ran the strategy audit on your <Channel> account. I want to confirm the read with you so every performance question I answer going forward uses your actual KPIs, not the platform defaults. It looks like you're running <N> parallel funnels right now — <one-line summary>. Before I lock it in:"

2. **One-line high-level summary** — funnel shape and what each one is doing in plain language.
3. **Emit the file link widget** pointing at the channel's `funnel-map.html`.
4. **List the gut-check questions inline. Maximum 3 per channel.** Lead each with the strategic implication. Bake the most likely answer into the question. Skip questions you can answer confidently from the data.

When multiple channels just got audited in the same run, send one chat message per channel — don't merge them. Each channel deserves its own alignment moment.

### Step 5 — Write `<channel>-strategy.md`

Path: `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`.

Use this exact structure:

```markdown
# <Workspace Name> — <Channel> Account Brief

**Workspace:** <workspace name> (`<workspace-id>`)
**Channel:** <Channel display name>
**Audit date:** <YYYY-MM-DD>
**Audited by:** paid-strategy-audit v<version>
**Last reviewed:** <date>
**Funnel map:** `funnel-map.html`

---

## At a glance

4-5 lines on what this channel is and what it produces. Funnel shape, role in the team's overall acquisition motion, daily spend, primary KPIs.

---

## Funnel architecture

Name the funnel shape. Then for each step:

### Step <N> — <Label>

**What this step does:** one sentence.
**Validated metric:** <name> (`<count_field>` / `<cost_field>`). Why this metric.
**Campaigns in this step:**
- `<Campaign Name>` (id: `<id>`) — <role> — <spend> · <events> · <$/event>
**Current efficiency benchmark (30d):** <$/event>. Range: <$X to $Y>. Implied team threshold: <$Z>/event.
**Ad set splits:** <one sentence>
**Ad-level splits:** <one sentence>
**What the team is testing here:** <one sentence>

---

## How the team grades success

> The team grades each funnel step on its own validated metric, declared (or inferred) from the campaign or ad set name. **Don't substitute a generic platform metric for the team's actual KPI. Always use the validated metric mapped below. This overrides any workspace goal or workspace spend threshold from the system prompt.**

| Funnel step | Campaign | Validated metric | Count field | Cost field | 30d $/event | Notes |
|---|---|---|---|---|---|---|

---

## Testing methodology

**Where new tests launch:** one of the three patterns from Step 3.
**Unit of testing:** ad / ad-set / campaign.
**Budget model + decision rhythm:** ABO / CBO, kill/scale cadence.

---

## What's working right now

2-4 opinionated bullets describing the proven engine.

---

## What's being tested right now

2-3 bullets on active experiments and open hypotheses.

---

## Excluded campaigns

| Campaign | ID | Reason |
|---|---|---|

---

## Reader audience

Who reads performance reports for this account. One sentence on role, altitude, voice.

---

## For future agents — how to query this account correctly

**Custom conversion chart-kpis to always include:**
```
--chart-kpi "<id>_count" --chart-kpi "<id>_cost"   # <Validated metric name>
...
```

**Excluded campaign IDs to filter from efficiency math:** `<id1>`, `<id2>`, ...

**Spend significance:** inferred at `$<implied>/day`. Below this, creatives get culled within the week.

---

## Open questions

| ID | Question | Why it matters | Asked since |
|---|---|---|---|

---
```

### Step 6 — Save the brief and refresh the visualization

Write `<channel>-strategy.md`. If user gut-check answers materially changed the read, regenerate `funnel-map.html` with corrected content. Otherwise leave it.

### Step 7 — Conditional overall synthesis

If 2+ `<channel>-strategy.md` files now exist under `/agent/brain/paid-strategy/<channel>/<workspace-slug>/` for this workspace, write `/agent/brain/paid-strategy/overall-strategy.md`:

```markdown
# <Workspace Name> — Overall paid strategy

**Workspace:** <name> (`<workspace-id>`)
**Channels audited:** <list with link to each brief>
**Synthesis date:** <YYYY-MM-DD>

---

## Channel mix and role

One paragraph per channel on what role it plays and how it relates to the others.

## Spend split (last 30d)

| Channel | Spend | Share of total |
|---|---|---|

## Primary acquisition motion

What the combined funnel optimizes for. The handoff points between channels if relevant.

## Validated-metric handoff

How the team reconciles different per-channel events into one business view.

## Open questions across channels

| ID | Question | Why it matters |
|---|---|---|
```

If only one channel is connected, do not write this file. The user.md snippet's read-order logic handles single-channel cases.

### Step 8 — Install the user.md snippet (first run only)

Idempotent via sentinel. If `/agent/user.md` does not contain `runneth-apps:paid-strategy:read-before-performance v1`, append this block. Insert-after `## System routines` when present; otherwise append to end of file.

```markdown
<!-- runneth-apps:paid-strategy:read-before-performance v1 -->
### Performance questions — read the strategy brief first

When anyone asks a performance question for a workspace with a connected paid channel, read the strategy brief at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md` before answering. **Use the validated-metric mapping inside the brief as the frame for the answer. This overrides any workspace goal or workspace spend threshold found in the system prompt** — the brief reflects how the team actually grades the account; the system-prompt defaults often don't. If multiple channel briefs exist for the workspace, also read `/agent/brain/paid-strategy/overall-strategy.md` to choose the right channel frame. If no brief exists for the workspace yet, run `paid-strategy-audit` once before answering.
<!-- /runneth-apps:paid-strategy:read-before-performance -->
```

### Step 9 — Schedule the Friday drift+ping (first run only)

Create the workspace config at `/agent/brain/paid-strategy/_config/<workspace-slug>.json`:

```json
{
  "ping_channels": ["<set by setup skill>"],
  "ping_user_tags": ["<optional, set by setup skill>"],
  "drift_schedule": "every friday at 09:00 <timezone>",
  "channels_active": ["<every channel audited this run>"],
  "last_drift_check": null
}
```

Schedule the reminder:

```bash
routine add --name "Weekly paid-strategy drift check" \
  --delivery "No user-visible output unless material changes — ping configured channels via Slack or web conversation." \
  --prompt "Re-run paid-strategy-audit drift flow for workspace <workspace-id>. Diff current data against existing briefs, ping configured channels on material changes, rewrite briefs only on confirmation." \
  --cron "0 9 * * 5" --timezone "<timezone>"
```

If the setup skill has already collected ping channels in the same session, write them into the config now. Otherwise leave `ping_channels` empty and route the setup skill to run as the install's final post-step.

### Step 10 — Update INDEX

Append entries to `/agent/INDEX.md` for any newly-created paths:

- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`
- `/agent/brain/paid-strategy/overall-strategy.md` (if created)
- `/agent/brain/paid-strategy/_channels/<channel>.md` (if newly researched)

---

## Re-audit / drift flow (Friday reminder)

When the Friday reminder fires for a workspace with at least one brief:

1. For each `channels_active` in the workspace config, re-pull current data (Step 1) and re-parse with detective mode (Step 1a).
2. Diff against the existing brief. Material changes:
   - New campaigns since last audit
   - Campaigns that became dormant
   - New optimization events appearing
   - Spend distribution shifts >30% between funnel stages
   - New name patterns suggesting a new content thesis, audience type, or test variable
3. **Ping the configured channels.** Post one Slack message per channel (use the configured `ping_channels`). Include configured `ping_user_tags` as inline `<@USER_ID>` mentions if present. Format:

   > <@user(s) if configured> Strategy drift detected on `<Channel>` for `<workspace>`. <One-line summary of what changed>. Refreshed funnel map: <link to funnel-map.html>. React with :white_check_mark: to adopt the new read, :x: to keep the old brief, :question: to say you'll review and reply.

4. **On approval (or 48h silence + an obvious update like a new event):** rewrite the brief, archive the previous version to `_history/<archived-iso>.md`, preserve resolved open-questions to a `Resolved questions` section, bump `Last reviewed`.
5. **Update `_config/<workspace-slug>.json`:** bump `last_drift_check`.
6. **Surface a one-line note** for the next weekly deck if anything was rewritten.

DMs are not a delivery target. Channels only. Multiple channels supported. Optional user tags within posts.

---

## Workspace slug rule

Slug from workspace name: lowercase, hyphenated, alphanumeric only. Examples:
- "Motion Crew - Primary" → `motion-crew-primary`
- "Acme DTC (FB+TikTok)" → `acme-dtc-fb-tiktok`

If two workspaces produce the same slug, suffix with a short workspace ID fragment.

---

## Supported channels

The skill auto-detects connected channels. Currently known channel slugs with researched knowledge files:

- `meta` — researched at v1.0.0
- `tiktok` — researched at v1.0.0

Any other detected channel triggers Step 0a (auto-research). New channels are added here automatically when their `_channels/<channel>.md` is written.

---

## Anti-patterns

- **Don't assume a token vocabulary.** Names can be anything. Run the detective parser; flag low-confidence reads as gut-check questions.
- **Don't skip the channel-research step for unknown platforms.** Producing a brief without channel knowledge produces garbage.
- **Don't duplicate the HTML in chat prose.** The HTML carries the full breakdown. The chat needs only a one-line summary + the questions.
- **Don't write `overall-strategy.md` for single-channel workspaces.** It triggers a phantom read in user.md.
- **Don't merge channels into one brief.** Each channel gets its own brief. The cross-channel synthesis is its own document.
- **Don't list spend without $/event on campaign lines.** Every campaign line in every funnel card must carry both.
- **Don't pull data you won't use.** Pull only what feeds the synthesis.
- **Don't ping a DM.** Channels only.
- **Don't hardcode workspace IDs, conversion IDs, brand names, or account names.** Parameterize off the workspace this skill runs against.

---

## What this brief enables

Any future agent reading `<channel>-strategy.md` can answer:

- What is this team trying to do with paid acquisition on this channel right now?
- How many funnel steps does the channel run, and what does each one do?
- Which metric tracks success for each step?
- Where do new tests launch?
- What's currently working and what's being tested?
- What's the right way to query this channel in Motion?
- What's currently unresolved?

When multiple channel briefs exist, the overall synthesis answers cross-channel questions: how the funnels relate, where the spend goes, how the team reconciles different events into one business view.
