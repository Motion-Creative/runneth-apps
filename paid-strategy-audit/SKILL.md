---
name: paid-strategy-audit
description: Builds two durable reference files per connected paid channel (Meta, TikTok, Pinterest, AppLovin, Snapchat, or any other ad platform integration) — a KPI map that names the primary KPI and confirmed spend threshold for each strategy/slice in the account, and a naming key that decodes the account's campaign / ad set / ad names. Every future performance question reads both first, so Runneth grades each slice on the team's real KPI (always combined with spend) and reads every name the way the team would. Produces an alignment-check visualization the user reacts to. Triggers on first run via missing files; can be invoked explicitly with "audit my paid account", "map my KPIs", "build the naming key", "what KPI should I use for X", "what's my spend threshold", or any variation of KPI/spend-threshold/naming setup for paid acquisition. Re-run any time to refresh. Channel-agnostic — auto-detects connected platforms and researches unknown ones first.
---

# Paid Strategy Audit

You produce two durable reference files per connected paid channel. That's the whole job:

1. **The KPI map** — for every strategy/slice in the account, the single primary KPI Runneth should grade it on.
2. **The naming key** — a decoder for how the team names campaigns, ad sets, and ads, so Runneth can read any name the way they would.

Every future performance question for this team reads both first. **The goal is making the account legible — not writing a strategy report.** You are not decoding their whole funnel philosophy, judging what's working, or recommending changes. You map KPIs and you build the key. Stop there.

This skill is channel-agnostic. Run it once and it produces a KPI map + naming key for every connected paid platform — Meta, TikTok, Pinterest, AppLovin, Snapchat, or anything else the workspace has wired up. Unknown platforms get researched and added to the channel library before their files get written.

---

## Core principles

**Two deliverables, nothing more.** A KPI map and a naming key, per channel. If you find yourself decoding testing methodology, ranking "conviction vs experiments," or writing prose about what's working, stop — that's out of scope and it's exactly what made this confusing before.

**Slice the account, then assign one KPI per slice.** Group campaigns into the handful of strategies/slices the team actually runs (e.g. prospecting vs retargeting, or per content pillar). Use only enough grouping to make the KPI map readable. For each slice, name the one primary KPI the team grades it on.

**Build the key from the account, not from a vocabulary.** Names can be anything: structured (`au:US,CA-Lookalikes`), underscore-separated (`prospecting_lookalikes_form_fallback_oct`), free-form (`October prospecting LAL Form Fallback`), or messy. Parse the names actually in this account and write down what each recurring token means *here*. The seed channel files give you starting vocabulary; the key records what's true for this workspace.

**Mirror back, confirm, save.** The user reacts to a visualization (one HTML one-pager) plus a short chat with two or three focused gut-check questions on the low-confidence reads. Once they confirm, the files become the standing frame.

**Snapshot, not history.** Each file captures the current state. When the account changes, re-run the skill to refresh — it re-derives the files and surfaces what changed.

**Workspace goal and spend threshold are signals to read, not the answer.** Pull `motion workspace-goal` and `motion spend-threshold`. The goal **defaults to ROAS** — if it's still ROAS, treat it as an unconfirmed default and don't assume it's deliberate; if it's anything else, the user changed it on purpose, so it's a strong signal of what the team actually cares about. Either way the real KPI map is more nuanced than one global metric: the primary KPI varies by slice, and often by campaign or ad set. Derive per-slice KPIs from naming and behavior, and use the workspace goal as a cross-check, not a replacement.

**Always judge a creative on spend + KPI together.** A creative that hasn't cleared the spend threshold is "not enough data yet" — never a winner and never a loser, whatever its KPI looks like. The spend threshold is Motion's account-size-based default, so it's often too low or too high. Confirm it with the user and record the confirmed number in the KPI map. Every performance verdict combines the slice's primary KPI with the spend threshold; neither alone is enough.

---

## What this skill produces

Per workspace, per connected channel:

1. **`/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md`** — the decoder for this account's names.
2. **`/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`** — the KPI map (slice → primary KPI).
3. **`/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`** — the alignment-check visualization. Always generated.
4. A short alignment chat message with the file links and the gut-check questions.

Per workspace, on first run:

5. The `runneth-apps:paid-strategy:read-before-performance v2` block appended to `/agent/user.md` (idempotent via sentinel; replaces any v1 block).

Channel knowledge files (grow over time across orgs):

6. **`/agent/brain/paid-strategy/_channels/<channel>.md`** — how to read that platform. Researched on first encounter of a new channel.

This skill finds and builds. It does not schedule reminders, post to Slack, or manage per-workspace config — re-run it any time to refresh the files.

> The filename `<channel>-strategy.md` is kept for continuity — downstream use cases (`creative-deep-dive`, `weekly-performance-deck`) read it by that name. Its contents are now the KPI map, not a full strategy brief.

---

## Execution

### Step 0 — Resolve scope and detect channels

Silently. No user-facing confirmation. The skill was either auto-triggered by missing files or explicitly invoked.

1. **Workspace:** default to the Motion context's workspace unless the user named another.
2. **Detect connected channels.** Use the available integration metadata and connected-source listings. Look for any active ad platform connection. Common identifiers: Meta (graph.facebook.com, META_ACCESS_TOKEN), TikTok (TikTok Ads Manager source), Pinterest (Pinterest Ads source), AppLovin (AppLovin source), Snapchat (Snap Ads source). For each detected channel, normalize to a slug (`meta`, `tiktok`, `pinterest`, `applovin`, `snapchat`, or whatever the platform is).
3. **Channel-research check.** For each detected channel, look for `/agent/brain/paid-strategy/_channels/<channel>.md`. If missing, run the auto-research flow (Step 0a) before proceeding for that channel. Surface one line: "I see <channel> is connected. Researching how to read it before I run the audit — one moment."
4. **Re-audit check.** For each channel, look for an existing `<channel>-strategy.md` or `naming-key.md`. If either exists, this is a re-audit — keep the existing files in memory, archive them to `_history/<archived-iso>--<file>` before overwriting, and surface a diff at Step 4.

### Step 0a — Auto-research a new channel

When a channel has no `_channels/<channel>.md`:

1. Web-research the platform's ads structure. Pull:
   - Account hierarchy (the platform's equivalents of campaign → ad set → ad)
   - Common optimization events and naming patterns
   - Native KPI vocabulary
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

What events the platform supports natively. How a "primary KPI" tends to map here.

## Native KPI vocabulary

The metric words the platform uses (e.g. Pinterest "saves", TikTok "video views", AppLovin "installs"). Translation back to standard KPIs.

## Naming-vocabulary hints

Channel-specific words to look for when parsing names: stage abbreviations, audience codes, format codes, creator-tag conventions. Feeds the naming key at Step 1a.

## How to pull data

The Motion CLI commands (or other available tools) that return this channel's creative-insights and conversion metrics. Field-name nuances.

## Validation notes

What can and can't be inferred for this channel relative to Meta's behavior. Known parsing gotchas.
```

4. Add a one-line note to this `SKILL.md`'s supported-channels list (programmatic update at the bottom of the file) so the channel is discoverable next time.
5. Proceed to Step 1 for that channel.

### Step 1 — Pull the account shape per channel

For each connected channel, pull the structural data. No narration needed.

```bash
# Workspace metadata + custom conversions
motion workspaces                                                              # confirm workspace ID + name
motion meta custom-conversion-metrics                                           # full list of custom conversions: IDs, names, archived flag
motion workspace-goal                                                          # current goal — defaults to ROAS; a non-ROAS value = the user changed it on purpose
motion spend-threshold                                                          # min spend before a creative can be judged; Motion's account-size-based default

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

Read `motion workspace-goal` and `motion spend-threshold` as signals, not answers:

- **Goal** defaults to ROAS. If it's still ROAS, it may just be the default — don't assume the team deliberately grades on ROAS. If it's anything else, treat it as a deliberate signal of what they value and weight it when assigning per-slice KPIs. Either way, capture it as a hint in the KPI map; the per-slice primary KPI still comes mainly from naming and behavior.
- **Spend threshold** is Motion's account-size-based default for the minimum spend a creative needs before it can be judged. Carry it forward to confirm with the user at Step 4 — it's frequently too low or too high — then record the confirmed number.

**Read the returned file.** It feeds both the naming key (Step 1a) and the KPI map (Steps 2–3).

### Step 1a — Decode the names → build the naming key

For each campaign name, ad-set name, and ad name independently:

1. **Segment the name** using `:`, `_`, `-`, `/`, `|`, whitespace, and case transitions as candidate boundaries. Produce overlapping segmentations and reason over all of them — don't lock to one delimiter.
2. **Pattern-match each segment against the domain vocabulary**, not a token grammar. For each segment, ask: does it look like —
   - An **optimization-event word**: `purchase`, `lead`, `book`, `signup`, `calendly`, `formfill`, `survey`, `subscribe`, `addtocart`, `atc`, `trial`, plus the workspace's custom-conversion display names, plus any channel-specific event vocabulary from `_channels/<channel>.md`
   - A **funnel-stage word**: `prospecting`, `pr`, `tof`, `top of funnel`, `retargeting`, `rt`, `bof`, `mof`, `consideration`, `awareness`, `acq`, `cold`, `warm`, `hot`, plus channel-specific stage words
   - A **content-thesis word**: `testimonial`, `ugc`, `static`, `vsl`, `whitepaper`, `case study`, `bundle`, plus recurring brand/program nouns repeated across multiple campaigns
   - An **audience word**: `lookalike`, `lal`, `broad`, `interest`, `1pd`, `cm`, `custom audience`, `intl`, country codes, lookalike-percent codes (`1pct`, `1-3pct`)
   - A **creator or asset reference**: a creator handle, an asset code like `FUN29228-A`
   - A **date**: `oct`, `2024-10`, `10-15`, `q4`, `wk42`, `H1`, ISO dates
   - A **structured token** in the `key:value` shape, treated as the highest-confidence form when present
3. **Score each match by confidence.** Clean colon-token = high. Free-form word floating in a recognized vocabulary = medium. Near-match or single-letter abbreviation = low and flagged.
4. **Record what each recurring token means in THIS account.** This is the naming key — not a generic list. Group by category (funnel stage, audience, optimization event, content/format, creator/asset, date/iteration, other). Keep an example name where you saw each token.
5. **Cross-reference inferred optimization events** against `motion meta custom-conversion-metrics`. Skip archived conversions. Match against display names with fuzzy matching (case-insensitive, punctuation-stripped). Capture the `<id>_count` / `<id>_cost` fields for each — the KPI map needs them.
6. **Flag low-confidence reads.** Anything below medium confidence becomes a gut-check question at Step 4 and goes in the key's "Ambiguous / unresolved" section.

The hardcoded token vocabulary (`au:`, `pl:`, `optim:`, `adc:`, `lp:`, `h1:`, etc.) is NOT required. These are signal patterns the parser recognizes when present, not assumptions it depends on.

### Step 2 — Pull primary-KPI data per slice

Re-pull per channel with the inferred KPI flags. Verify `--chart-kpi` flag support via `motion meta insights --help` / `motion tiktok insights --help` before first run:

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

Compute per slice:
- 30d spend
- 30d events in its primary KPI
- 30d $/event
- Active creative count, and how many creatives have cleared the spend threshold (i.e. are eligible to be judged a winner/loser at all)

### Step 3 — Group into slices and assign the primary KPI

Light grouping only. Group the account's campaigns into the handful of strategies/slices the team runs. Use the naming-key reads to do it — typically one of:
- **Funnel stages** (prospecting / retargeting, or awareness / consideration / conversion)
- **Content pillars** (one slice per recurring content thesis)
- **A single slice** if the account doesn't split

For each slice, decide the **one primary KPI** the team grades it on (from the optimization events you decoded), and capture its `<id>_count` / `<id>_cost` fields and 30d $/event. Cross-check against the workspace goal: if the goal is non-ROAS and lines up with a slice's KPI, that raises confidence; if it conflicts, flag it as a gut-check.

**Spend threshold.** Record Motion's current spend threshold and form a recommendation: given the spend distribution you see, does the account-size default look like the right bar for calling a creative a winner, or should it move? This becomes a gut-check at Step 4 and a confirmed line in the KPI map. Use one global threshold unless slices spend so differently that they each need their own — then record a per-slice threshold.

**Excluded campaigns.** Note campaigns that distort KPI math (non-commercial, flagged no-optimization, single-creative outliers). Infer them from naming and behavior; if any materially affect a slice's $/event, confirm it as a gut-check at Step 4. These get filtered from the per-slice $/event and recorded in the KPI map — they are not a separate analysis section.

Do **not** decode testing methodology, where tests launch, ABO vs CBO, conviction vs experiments, or tournament structure. That is out of scope.

### Step 4 — Build the alignment visualization + ask the gut-check questions

Generate the HTML one-pager first. Save to `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`. Use Motion's design system (`/runneth/references/html-generation--design-system.md`) for tokens and typography. Always generate.

Structure for the HTML (per channel) — two halves, KPI map then naming key:

1. **Header** — eyebrow ("Alignment check · <Channel> · Last 30 days"), title ("[Brand] — <Channel> KPI map & naming key"), one-line intro.
2. **Summary strip (4 tiles)** — 30d spend, active creative count, number of slices, spend threshold to confirm.
3. **KPI map grid (2-col, 1-col on mobile)** — one card per slice. Each card carries:
   - Slice title + one-sentence "what this is"
   - **Primary KPI** name, total slice spend, total slice $/event
   - How many creatives in the slice have cleared the spend threshold (the rest are "not enough data")
   - Campaign list — **every line shows event count AND $/event alongside spend**.
4. **Naming key table** — the decoder. Token / pattern → category → meaning → confidence → example seen. Group rows by category.
5. **Worked examples** — 2–3 real account names decoded into plain language.
6. **Three gut checks block** — dark background, numbered list, the questions sent in chat.

**Then send the short chat message.** Four parts:

1. **Acknowledge the trigger and why this matters.** Reference what the user asked for. Explain that confirming locks in how Runneth reads this account's names and grades each slice going forward. Warm, direct, consultant voice. Example:

   > "Hey, I mapped your <Channel> account. I want to confirm two things so every performance answer going forward uses your real KPIs and reads your names the way you do: the primary KPI per slice, and the naming key. It looks like you run <N> slices — <one-line summary>. Before I lock it in:"

2. **One-line summary** — the slices and the primary KPI for each, in plain language.
3. **Emit the file link widget** pointing at the channel's `funnel-map.html`.
4. **List the gut-check questions inline. Maximum 3 per channel.** Lead with the implication. Prioritize, in order: (a) **confirm the spend threshold** — "Motion's default bar for judging a creative is `$<X>`; is that the right minimum before we call something a winner, or should it be higher/lower?"; (b) confirm or correct a non-ROAS workspace goal as the team's real north-star metric (or, if the goal is still ROAS, confirm whether that's deliberate or just the default); (c) the lowest-confidence naming reads or ambiguous KPI assignments. Bake the most likely answer into the question. Skip questions you can answer confidently from the data.

When multiple channels just got audited in the same run, send one chat message per channel — don't merge them.

### Step 5 — Write `naming-key.md`

Path: `/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md`.

```markdown
# <Workspace Name> — <Channel> Naming Key

**Workspace:** <workspace name> (`<workspace-id>`)
**Channel:** <Channel display name>
**Built:** <YYYY-MM-DD> by paid-strategy-audit v<version>
**Last reviewed:** <date>

The decoder for how this account names campaigns, ad sets, and ads. Read this before interpreting any name on this channel so you read it the way the team does.

---

## How names are structured

- **Campaign layer:** <delimiter, segment order, what lives here>
- **Ad set / ad group layer:** <same>
- **Ad layer:** <same>

---

## The key

What each recurring token in this account means — built from the names actually in the account.

| Token / pattern | Category | Means | Confidence | Example seen |
|---|---|---|---|---|
| `pr` | Funnel stage | Prospecting | high | `pr_lal_us_oct` |
| `FF` | Optimization event | Form Fill (custom conv `<id>`) | medium | `pr_FF_broad` |

Categories: funnel stage · audience · optimization event · content/format · creator/asset · date/iteration · other.

---

## Worked examples

Real names decoded end to end:

- `<real campaign name>` → <plain-language translation>
- `<real ad name>` → <plain-language translation>

---

## Ambiguous / unresolved

Tokens that couldn't be read with confidence — confirm with the team.

| Token | Where seen | Best guess | Confidence |
|---|---|---|---|

---

## How to apply

When you see a name on this channel: segment it on <delimiters>, map each segment via the key above, then resolve its slice and primary KPI via `<channel>-strategy.md`.
```

### Step 6 — Write `<channel>-strategy.md` (the KPI map)

Path: `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`.

```markdown
# <Workspace Name> — <Channel> KPI Map

**Workspace:** <workspace name> (`<workspace-id>`)
**Channel:** <Channel display name>
**Audit date:** <YYYY-MM-DD>
**Audited by:** paid-strategy-audit v<version>
**Naming key:** `naming-key.md`
**Funnel map:** `funnel-map.html`
**Workspace goal (hint):** <goal — e.g. "ROAS (Motion default, unconfirmed)" or "CPA — user-set, deliberate signal">
**Spend threshold (confirmed):** `$<X>` <"(Motion default, confirmed by user)" | "(adjusted from Motion default $<default> by user on <date>)">
**Last reviewed:** <date>

---

## At a glance

3-4 lines: what slices run on this channel, the primary KPI each is graded on, daily spend, and the confirmed spend threshold a creative must clear before it counts.

---

## Slices and their primary KPI

| Slice / strategy | What it is | Campaigns | Primary KPI | Count field | Cost field | 30d $/event | Spend threshold | Confidence |
|---|---|---|---|---|---|---|---|---|

(Use one global spend threshold unless slices need their own — then fill the column per row.)

---

## How the team grades success

> Grade each slice on its own primary KPI mapped above, **always combined with spend**. A creative must clear the spend threshold (`$<X>`) before it can be called a top performer or a winner — below it, it's "not enough data," whatever the KPI says. **Don't substitute a generic platform metric for the team's actual KPI, and don't crown a low-spend creative.** The per-slice primary KPI overrides any single workspace-goal default from the system prompt; the workspace goal (`<goal>`) is recorded above as a hint, not the rule. Use this confirmed spend threshold in place of the raw system-prompt default.

---

## Excluded from KPI math

| Campaign | ID | Reason |
|---|---|---|

---

## For future agents — how to query this account correctly

**Primary-KPI chart-kpis to always include:**
```
--chart-kpi "<id>_count" --chart-kpi "<id>_cost"   # <KPI name> — <slice>
...
```

**Excluded campaign IDs to filter from efficiency math:** `<id1>`, `<id2>`, ...

**Spend threshold for judging creatives:** `$<X>`. Never call a creative a winner or a loser below this — it's "not enough data."

**Always evaluate on spend + KPI together**, never KPI alone.

**To read any campaign / ad set / ad name on this channel, use `naming-key.md`.**
```

### Step 7 — Save and refresh the visualization

Write both files. If user gut-check answers materially changed a read, regenerate `funnel-map.html` with corrected content. Otherwise leave it.

### Step 8 — Install the user.md snippet (first run only)

Idempotent via sentinel. If `/agent/user.md` contains the older `runneth-apps:paid-strategy:read-before-performance v1` block, remove it. If it does not already contain the `v2` block, append this. Insert-after `## System routines` when present; otherwise append to end of file.

```markdown
<!-- runneth-apps:paid-strategy:read-before-performance v2 -->
### Performance questions — read the KPI map and naming key first

When anyone asks a performance question for a workspace with a connected paid channel:

1. Read the channel's KPI map at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`. Grade each slice on the **primary KPI mapped there** — that overrides any single workspace-goal default (Motion defaults the goal to ROAS, which is often not how the team actually grades each slice). **Always pair the KPI with spend:** a creative must clear the map's confirmed **spend threshold** before you call it a top performer or a winner — below it, treat it as "not enough data," not a win or a loss. Use the map's confirmed threshold, not the raw system-prompt default.
2. Read the channel's naming key at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md` and use it to interpret any campaign / ad set / ad name before you describe, group, or rank it — read the account the way the team does.

If no KPI map or naming key exists for the workspace+channel yet, run `paid-strategy-audit` once before answering.
<!-- /runneth-apps:paid-strategy:read-before-performance -->
```

### Step 9 — Update INDEX

Append entries to `/agent/INDEX.md` for any newly-created paths:

- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md`
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html`
- `/agent/brain/paid-strategy/_channels/<channel>.md` (if newly researched)

---

## Re-running the audit

There is no scheduled routine — re-run the skill any time the account changes (new campaigns, renamed campaigns, a shifted optimization event, a spend-threshold rethink). On a re-run:

1. Archive the existing `<channel>-strategy.md` and `naming-key.md` to `_history/<archived-iso>--<file>` before overwriting (handled at Step 0, re-audit check).
2. Re-pull data (Step 1) and re-derive both files.
3. Surface a short diff in chat — new slices, KPI shifts, new naming tokens, previously-ambiguous tokens now resolved — and re-ask only the gut-checks the changes raise.

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

- **Don't expand past the two deliverables.** No testing-methodology decode, no conviction-vs-experiments, no "what's working" prose, no recommendations. KPI map + naming key. That scope creep is what got agents lost before.
- **Don't assume a token vocabulary.** Build the key from the names actually in the account. Flag low-confidence reads as gut-check questions and put them in the key's "Ambiguous" section.
- **Don't skip the channel-research step for unknown platforms.** Producing files without channel knowledge produces garbage.
- **Don't duplicate the HTML in chat prose.** The HTML carries the full breakdown. The chat needs only a one-line summary + the questions.
- **Don't over-slice.** Use the fewest slices that make the KPI map readable. One slice is fine if that's the account.
- **Don't list spend without $/event on campaign lines.** Every campaign line in every KPI card carries both.
- **Don't treat the workspace goal as the KPI map.** Read it as a hint — especially when it's been changed off the ROAS default — but the per-slice primary KPI comes from naming and behavior. Most accounts are more nuanced than one global metric.
- **Don't judge a creative on KPI alone.** Always combine with spend. Below the confirmed spend threshold a creative is "not enough data," never a winner or a loser.
- **Don't ship Motion's default spend threshold unconfirmed.** It's account-size-based and frequently wrong. Confirm it with the user at the gut-check, and record the confirmed number.
- **Don't hardcode workspace IDs, conversion IDs, brand names, or account names.** Parameterize off the workspace this skill runs against.

---

## What these files enable

Any future agent reading the KPI map and naming key can:

- Grade each slice in the account on the team's real primary KPI, not the platform default.
- Judge creatives on spend + KPI together, using the confirmed spend threshold as the bar for "winner" — and never crowning a creative that hasn't cleared it.
- Read any campaign / ad set / ad name the way the team does.
- Know which `--chart-kpi` fields to pull and which campaigns to exclude from efficiency math.
- Flag the names, KPI assignments, and spend threshold that are still unconfirmed.
