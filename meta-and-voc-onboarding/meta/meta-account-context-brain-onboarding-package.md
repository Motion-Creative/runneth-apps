# Meta Account Context: Brain Onboarding Package
### Version 1.31 — patch: Field 10 is the landing spot for deck feedback (July 2026)

This package teaches Runneth how a customer understands their Meta ad account, so its queries,
rankings, and insights match how the team actually thinks about the data. This package is
Meta-only: it never looks for or pulls other ad platforms (TikTok, LinkedIn, YouTube). Meta is
the ad platform for this account by definition. Installing it stages these files into the
customer brain. It does not self-run. Activation, below, is what makes Runneth run the
autofill (silently, at post-install) and then live by the result; the presentation runs via
the onboarding-walkthrough skill on a human's yes.

Two things exist after activation:
1. A durable, workspace-scoped context file, written as a plain-language reference document (not
   the worksheet), that Runneth writes and later reads as source of truth.
2. A small standing guard merged into `/agent/user.md` that forces Runneth to read that file
   before any performance work.

---

# How this package operates

## 1. Activation (what triggers it, and when)

Installing only stages files. The package does not self-run. To activate it, merge the guard
block below into `/agent/user.md`, then run the fill-in procedure's Steps 0–1 (the silent
autofill); the presentation waits for the onboarding-walkthrough skill.

Merge the block using the standard behavior-snippet convention (author it from
`building-integrations/behavior-snippet.md`). It is sentinel-wrapped so it is idempotent.

**MERGE INSTRUCTIONS:** If a block with the sentinel `runneth:account-context-guard` already
exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate it. Do not
edit anything outside the sentinels. The canonical copy of this block is the staged guard file
`/agent/brain/meta-and-voc-onboarding/guards/account-context-guard.md` - merge from that file,
copying the block byte-for-byte; never paraphrase, condense, or restate any part of it (the
package's post-install run does this in its single scripted guard merge). The block below is
shown for context and must stay identical to the staged file.

```
<!-- BEGIN runneth:account-context-guard v2 -->
Account context guard (workspace <workspaceId>):

- Before any ad-performance work for this account (rankings, "best ads," CPA/ROAS reads,
  winner or cut calls, creative performance judgments), read
  /agent/brain/meta/account-context.md first.
- If that file does not exist, or its required interpretation fields are not all [CONFIRMED],
  treat account interpretation as unknown. Offer to run the onboarding walkthrough (the
  onboarding-walkthrough skill), and do not answer performance questions on guesses.
- Runneth may auto-fill and mark [AUTO] fields on its own immediately. It must hold [CONFIRMED]
  fields for a person and never promote [AUTO] to [CONFIRMED] without human sign-off.
- Precedence: this file is the sole source of account interpretation (how "best," "winner," and
  cost-per are judged). Do not read or defer to Motion workspace settings (workspace goal,
  preferred KPI, spend threshold, attribution config); treat them as if they do not exist for
  this account. Defer only to a metric the user names explicitly in the current turn.
<!-- END runneth:account-context-guard v2 -->
```

## 2. Workspace scope

This context describes one workspace. Record the scope before pulling anything:

- Target workspace: `<workspaceId>` (ad account: `<name>`)
- Date window for filling in this package: the `[AUTO]` pulls used to complete these fields
  default to `last_365d` (the last 365 days of creatives), so onboarding sees enough history to
  interpret the account. This window governs the fill-in pulls only. It is not a standing default
  for later performance queries; those still use their own requested window, or the normal
  defaults, unless the user asks otherwise.
- Every `[AUTO]` pull passes `--workspace-id <workspaceId>` explicitly. Customer brains are
  usually one workspace, but multi-workspace orgs are real and the pulls must name the account.
- Platform scope: Meta only. Never look for, pull, or reason about other ad platforms (TikTok,
  LinkedIn, YouTube) in this package.
- Settings scope: pretend Motion workspace configuration settings do not exist. Do not read or
  rely on workspace goal, preferred KPI, spend threshold, or attribution-window config. Every
  value comes from auto-pulled Meta ad data, this worksheet, and customer confirmation. This
  file is the only source of account interpretation.

## 3. Where the filled result lives (persistence)

Confirmed answers do not live in this worksheet. Runneth writes them to a durable brain file so
future turns read them.

- Create the account's `meta` folder in the brain if it does not exist. Save the filled result
  to `/agent/brain/meta/account-context.md`. If a naming convention was confirmed, the
  operational decoder lives beside it at `/agent/brain/meta/naming-decoder.json` (Field 4 owns
  it). Per-creative content lives in Cacheth (summaries surfaced through Knoweth), not in brain files.

**The saved file is a prose reference document, not the worksheet.** Capture and communication are
two different jobs. The fields-and-statuses procedure below is how Runneth captures rigorously; the
saved file is how it communicates. Write the saved file the way a sharp analyst would explain this
account to a new teammate: interpretation baked into sentences, the decision stated, readable in
about 30 seconds. State conclusions, not statuses. Do not carry `[CONFIRMED]`/`[AUTO]`/`[FLAGGED]`
badges or `Field N` headings into it. Express open items in plain language (we are still confirming
per-product targets with the team), not as flag noise. Use this order:

1. **Title (H1):** `# <Ad account> - Meta Account Context`
2. **One short intro paragraph, in plain language:** what this file is, that Runneth reads it
   before any Meta performance work for this account, and how to read the field statuses.
3. **At a glance:** a few bullets a human can skim: last refreshed, confidence, fields confirmed
   (count / 9), and any open flags. Once learned, this is also where the one-line
   answer-register note lives (how this team likes their answers — e.g. "numbers first,
   interpretation on request"), written by the validation loop's register corrections.
4. **The nine fields**, in order.
5. **The deck spec (only once Field 10 is confirmed):** a short section carrying Field 10's
   saved output — marketing calendar, reporting cadence, exclusions, and deck sections — in the
   same plain prose as the rest of the file. Omit the section entirely while Field 10 is
   pending; the validation deck build reads it from here.
6. **File metadata (last):** end the file with a `## File metadata` heading followed by the machine
   contract as a fenced `yaml` code block.

- Index it in `/agent/INDEX.md` with aliases (account context, KPI hierarchy, how we judge ads,
  performance interpretation) and a one-line note.

---

# Fill-in procedure

## Step 0: Pull brand context (required first step)

**Before running any field pulls**, call:

```
motion brand-context --data-query "brand overview product what we sell customers" --workspace-id <workspaceId>
```

This is required for writing the opening frame. Do not infer brand identity from ad names.
Store the returned brand story, product range, audience, and differentiators — the
onboarding-walkthrough skill's opening frame is written from them.

## Step 1: Run the nine field pulls

Run all field pulls in parallel where possible. See the Field-to-command map below for
the exact commands per field. Every pull passes `--workspace-id <workspaceId>` and
`--date-range last_365d` unless the field specifies otherwise.

After pulling, inspect each returned file with a separate `jq` call before using the data.

## Presentation: owned by the onboarding-walkthrough skill

Steps 0-1 run silently at post-install: autofill every field possible, persist the scaffold,
present nothing. The fill-in presentation - the required output schema (opening frame, field
sections, closing TLDR), its skeleton and pre-send checklist, and the Field 10 deck-spec
offer - is owned by the onboarding-walkthrough skill, which fires when a human says yes to
"Are you ready to begin your onboarding?" Present per that skill. This package defines the
data layer the skill reads: what each field means, how to pull it, how to confirm it, and
how to store it (including Field 4's presentation rule, which stays beside its decoder spec
below).

---

# Handling specific fields

## Field 1: Sources of truth — critical rule on third-party attribution

**If a third-party attribution tool (e.g. Northbeam) returned null or empty data:**
Do not mention it by name. Do not say "Northbeam returned null." Do not ask if it's connected.
Simply state what is firing (Meta native, custom conversions present/absent, standard purchase
event returning data) and ask one question:

> "Is Meta your source of truth, or do you have an attribution platform we should flag for
> integration in the future?"

**If a third-party attribution tool returned real data:**
Treat it as the source of truth for performance attribution. Do not frame this as a tie-breaker
question — if the tool exists and is returning data, it wins. Name it, then inspect which
specific metric keys returned non-null, non-zero values across rows with meaningful spend from
the probe pull. Use `motion meta metric-reference --query "<tool name>"` to resolve the
human-readable label for each returned key. Surface those exact keys with their labels in the
question — not generic category descriptions. The question format is:

> "[Tool] is returning [Label 1 / key], [Label 2 / key], and [Label 3 / key] — which of these
> do you actually judge performance on? And does that vary by product?"

The saved brain file must explicitly state that the third-party attribution tool is the source
of truth for performance judgment. This must appear in the "How we read this account" section,
not buried in field definitions. Meta native metrics are supplemental creative signals only
(thumbstop, CTR, hold rate) — not the attribution lens.

**Fields 1–3 consolidation when attribution tool is confirmed:**
When a third-party attribution tool returns real data, fields 1, 2, and 3 can consolidate into
a single question block rather than three separate questions. Apply these rules:

- Surface metric gotcha observations (structural nulls, unexpected zero patterns) as plain
  observations. Do not suggest in-platform Meta metrics as alternatives when an attribution
  tool is the source of truth. If a Meta metric is broken or misleading, note it as "not the
  decision lens here" and move on. No question needed.
- The sub-1 ROAS observation is subsumed: when an attribution tool is present, the team already
  knows Meta ROAS is not the primary lens. Surface it as a factual note without asking.
- Ask one consolidated question: "Which metric(s) from [tool] do you judge performance on —
  ROAS, new customer ROAS, CPA, or something else? And does that change by product?"

This rule exists because the "which tool wins" framing implies Meta could win. It won't. The
real gap when an attribution tool is confirmed is which of its metrics the team actually uses.

---

# Field-to-command map

How to pull each field. Exact command shapes and flags live in the Motion CLI Data-Query Guide
(`/agent/brain/meta-and-voc-onboarding/motion-cli-data-query-guide.md`); this table says which command
answers which field and what to read from the result.

| Field | Pull with | Extract |
|---|---|---|
| 0. Brand context (opening frame) | `motion brand-context --data-query "brand overview product what we sell customers"` | brand story, product range, audience, differentiators |
| 1. Sources of truth | `motion meta custom-conversion-metrics`; `motion meta ads --grain adnames --northbeam --include-metrics` probe | which events exist; whether third-party attribution returns values vs null |
| 2. Conversion events | `motion meta custom-conversion-metrics`; `motion meta metric-reference --query "purchase"` | each event's id/name and standard vs custom key |
| 3. Known metric gotchas | `motion meta insights --date-range last_365d --include-metrics` (inspect returned rows) | null/zero/misleading columns; ROAS anomalies; structural nulls at any grain |
| 4. Naming conventions | `motion meta insights --include-metrics` (adName on rows); `motion meta ads --grain adnames`; `motion meta ads --grain ads` | name strings per level; detect structure and reliability; note null levels |
| 5. Attribution | No pull | propose 7-day click / 1-day view and confirm |
| 6. Account structure | `motion meta ads --grain ads --include-associated-objects` | budget level (CBO vs ABO); ad set counts |
| 7. Funnel map | `motion meta ads --grain ads`; `motion meta insights` campaign names on rows | campaign-to-stage grouping; flag agency-managed or ASC campaigns |
| 8. Creative performance metrics | `motion meta insights --date-range last_365d --include-metrics --table-kpi <keys>` | account averages for CPA, thumbstop, hold rate, CTR; video-only for engagement metrics |
| 9. Targets, thresholds, decision rules | `motion meta insights --include-metrics --table-kpi <cost-per key>` | reference CPA baseline; surface material variation across product lines / campaign types |
| 10. Reporting structure and marketing calendar (deck spec) | No new pull — synthesize from Fields 4, 7, and 9 once confirmed | marketing calendar from the decoder's campaign-type and launch-date positions; reporting structure from confirmed fields |

---

# Required context fields

All nine fields are required. Runneth auto-pulls every one of them. There is no optional set.

Field 10 is the one addition outside that set: the deck spec. It is not required to start
validation — the question loop runs on the nine — but no deck is built without it (see
Field 10).

## 1. Sources of truth

Status: `[EMPTY]`

Meta is the ad platform. This field captures which tool is authoritative for each kind of number
layered on top of Meta.

**Auto-pull**
- List the data sources feeding this Meta account (Meta native, plus any third-party attribution).
- Note whether a third-party attribution source returns real values or null.

**What to present (critical rule):**
- If third-party attribution returned null: do not name the tool. Ask only whether Meta is their
  source of truth or whether they have an attribution platform to integrate.
- If third-party attribution returned real data: name it, state what's returning, ask which tool
  wins when sources disagree.

**Fields**
- Ad platform: Meta (fixed)
- Data/attribution sources connected: `<AUTO>`
- Source of truth for performance attribution: `<attribution tool if present; else Meta>`
- Attribution tool metrics used: `<which specific metrics — ROAS, new customer ROAS, CPA, ECR, etc.>`
- Supplemental Meta platform signal (if any): `<creative engagement metrics only — thumbstop, CTR, hold rate. Not conversion attribution.>`

## 2. Conversion events: definitions and hierarchy

Status: `[EMPTY]`

Captures every conversion event, what it means to the business, and how it ranks. Defines what
"best" means for this account.

**Auto-pull**
- List the conversion events firing in the account.
- Note which campaigns optimize toward which event where observable.
- If an event returns zero across all creatives, treat it as not currently in use.

**What to understand**
- What each event represents to the business and how the customer ranks them.
- Use `motion brand-context` to propose the most likely primary conversion event — the one
  the team judges everything by — before asking cold.

**If attribution tool is confirmed:**
Skip the Meta pixel event hierarchy question entirely. When an attribution tool is present, the
operative conversion is modeled by that tool — not a pixel event. Ask instead: which metrics
from the attribution tool do they judge on, and are there any Meta platform metrics they still
track alongside it? Those supplemental metrics should be creative engagement signals only
(thumbstop, CTR, hold rate) — not conversion attribution. Do not propose Meta native conversion
events as primary-conversion candidates when an attribution tool is the source of truth.

**Fields** (repeat per event)
- Event: `<AUTO>` | Meaning: `<...>` | Value rank: `<...>` | Optimization or upstream-only: `<...>`

## 3. Known metric gotchas

Status: `[EMPTY]`

Captures metrics that are broken, structurally zero, double-counted, or misleading here.

**Auto-pull**
- Scan for suspicious patterns: ROAS consistently below 1, conversion columns always blank,
  metrics reading zero across high-spend creatives.
- Note any structural nulls (e.g. adName, campaignName null at a specific grain).
- Image ad video metrics (thumbstop, hold rate = 0) are expected behavior, not bugs. Note them
  as expected so the team doesn't flag them as broken later.

**ROAS below 1 rule:** ROAS consistently below 1 on high-spend creatives is not automatically
a broken metric. Never ask "is this intentional?" — that framing is too passive and does not
move toward the actual decision metric.

- If an attribution tool is present and returning data: note the sub-1 ROAS as a plain
  observation, do not ask a question about it. The attribution tool's metrics are the operative
  lens; divergence from Meta ROAS is expected by design. Capture it in the brain file as context
  ("Meta ROAS runs below 1; this is not the decision metric here") without requiring confirmation.
- If no attribution tool is present: flag it with the LTV hypothesis and ask directly: "ROAS
  is running below 1. What metric are you actually hitting a target against?"

In either case, do not propose Meta native ROAS as a metric to judge performance against.

**What qualifies as a gotcha:**
An unexpected or non-obvious pattern that could cause a wrong conclusion when someone analyzes
this account without prior knowledge of it — a metric reading zero on creatives that should have
it, a conversion event that looks active but is returning nothing, a campaign objective
misalignment that makes CPA uninterpretable. The test: would someone with solid Meta knowledge
be surprised by this? If not, leave it out.

**Never flag these — they are definitionally expected, not gotchas:**
- Video engagement metrics (thumbstop, hold rate, video plays, thruplay) returning zero or null
  on image or catalog creatives. Images have no video; these metrics do not apply.
- Catalog and DPA creatives missing hook, transcript, or creative summary fields. Dynamic
  formats do not have static creative content to summarize.
- Standard purchase count or ROAS returning zero on campaigns with non-conversion objectives
  (awareness, reach, traffic). The campaign is not optimizing for purchase.
- `adName`, `campaignName`, or `adsetName` returning null on a subset of rows. This is common
  on Advantage+ creative variants, flexible ad formats, and some catalog placements.
- A metric returning null when it was not explicitly requested via `--table-kpi`. Null here
  means "not requested," not "broken."
- Meta ROAS running below 1 when an attribution tool is present. Expected by design.

**What to understand**
- For each flagged pattern: whether it is unexpected given this account's setup, and what to
  use instead when the account has confirmed an alternative lens.
- Whether there are gotchas the scan could not see. Ask openly; some are only known to the team.

**Fields** (repeat per gotcha)
- Metric: `<...>` | Why misleading here: `<...>` | Use instead: `<...>` | Status: `<confirmed | open flag>`

## 4. Naming conventions

Status: `[EMPTY]`

Captures whether the account uses naming conventions, what each level encodes, and how Runneth
should use that understanding to answer any user query about a creative segment, creator,
product, or campaign. The output of this field is not just a record of what names mean — it is
an operational decoder that tells Runneth how to translate any user request into the correct
query.

**Auto-pull**
- If Step 1 (Creative Attributes) handed over a provisional decode table, start from it
  instead of re-detecting.
- Otherwise: pull all campaign, ad set, and ad name strings across the account, detect
  structure per level, and propose a decoder.
- Measure reliability per level (% of names fitting the detected pattern).
- Detect where product/concept names live: take the product tokens found in ad names and check
  whether the same tokens also appear in campaign and ad set names. The same product word can
  cascade across all three levels or live at only one — that placement is an account fact, not
  a guess.

**What to understand**
- For levels with a detected pattern: confirm what each position means, what type of identifier
  it is, and which Meta query field it maps to.
- For levels with no reliable pattern: confirm whether a convention exists or whether to fall
  back to creative signals and landing pages.
- Confirm the product-name default: "When someone on your team says '[product] ads' with no
  other qualifier, should I read that as the ad names carrying that product token, or does this
  account structure products at the campaign level?" The confirmed answer becomes the default
  filter level for bare product-name requests (the Data-Query Guide's name-level rules use
  `adName` + includes until this is confirmed).

**Presentation rule for Field 4 (the fill-in section for this field)**

If a naming decoder exists (from Creative Attributes or a prior fill-in run), embed the full
filterable-field table inline in the section. Do not summarize it in prose. Format it as two
parts:

- **Part A — Filterable dimensions** (one row per `segment_filter` field): Field | Known
  values. These are the dimensions the team can ask about by name.
- **Part B — Context-only fields** (one row per `context_only` or metadata field): Field |
  What it captures. These are visible in names but not used for filtering.

Follow with the campaign and ad set naming format (one line each, with an example). Then ask
the two confirmation questions as the section's final bold line. If the decoder does not
exist, describe what was detected in prose and ask the customer to confirm or correct the
structure.

The customer must be able to scan this table and correct a value or a field type without
asking for more detail. A prose summary of a decoder is not sufficient.

**Required output: the naming decoder JSON file**

This field owns the account's naming interpretation; its operational output is a separate JSON
decoder saved at `/agent/brain/meta/naming-decoder.json`. Do not embed the full decoder in
`account-context.md` — it is too large for accounts with structured naming conventions.
Reference it from `account-context.md` with a one-line note and a path link. The decoder is
written and updated only through this field's confirmation; appending newly observed values to
`known_values` is routine maintenance, structural changes go through re-confirmation.

The decoder must be indexed in `/agent/INDEX.md` with aliases: naming decoder, ad name decoder,
naming convention, content program values, filter guide, creative identity.

**JSON schema:**

```json
{
  "account": "<account name>",
  "workspace_id": "<workspaceId>",
  "as_of": "<YYYY-MM-DD>",
  "delimiter": "_",
  "format_string": "<full position template, e.g. {creative-id}_{content-program}_...>",
  "positions": [
    {
      "position": <N>,
      "name": "<position name>",
      "type": "<segment_filter | context_only | unique_id | metadata_do_not_filter>",
      "description": "<what this position represents>",
      "query_field": "<adName | adsetName | campaignName | launchDate | null>",
      "filter_pattern": "<_VALUE_ | null>",
      "known_values": ["<value1>", "<value2>"],
      "pattern_format": "<for metadata positions: the pattern, e.g. {id}-{N}RLP>",
      "examples": ["<example1>", "<example2>"],
      "notes": "<anything that would cause false positives or needs human attention>"
    }
  ]
}
```

**Type definitions and enumeration rules:**

- `segment_filter` — a discrete value the user would ask for by name. Filter using `_VALUE_` in
  `adName`. Enumerate all known values as a full array. New values in this position follow the
  same `_VALUE_` pattern automatically. Example positions: content program, product line, product,
  funnel stage, format, market.
- `context_only` — human-readable text embedded in the name, not used as a filter. Set
  `known_values` to null. Set `filter_pattern` to null. Add a note explaining what this position
  contains. Example positions: visual description slug, hook slug, video score.
- `unique_id` — identifies a specific creative. Set `known_values` to null. Use for direct ad
  lookup only, not segmentation. Example: creative ID with variant suffix.
- `metadata_do_not_filter` — encodes campaign or LP metadata. Often contains strings that look
  like segment values but are not. Set `known_values` to null. Document `pattern_format` and 2–3
  examples. Add a note naming the segment values it may contain and explaining why filtering by
  this position produces false positives. Example: landing page reference.

**Ad name structure — two parts:**
Ad names in structured accounts are compound strings. The creative identity fields are
underscore-delimited and end before the landing page reference. The landing page reference
uses hyphens as its internal delimiter and occupies the second-to-last position. The launch
date is last. Mark the LP reference position as `metadata_do_not_filter` in the decoder.

**LP reference — detect and record the pattern:**
Common formats: `{id}-{N}RLP` (round N landing page), `{id}-LP` (landing page),
`{id}-CAP` (campaign-specific page). The identifier prefix often matches a content program or
campaign name. Document this in `pattern_format` and `notes` so future queries never treat the
LP reference as a proxy for creative identity.

**New value rule:**
When a new value appears in a known position, read its position number and type from the decoder.
`segment_filter` → filter `_VALUE_` in `adName` and append the value to `known_values`.
`context_only` → no action, context only. `metadata_do_not_filter` → do not filter. The decoder
makes this determination automatic without needing a human to re-explain the convention.

**Ad set and campaign requests:**
When a user asks for ads by ad set or campaign, use `adsetName` or `campaignName` — not `adName`.
The LP reference embedded in `adName` is not the same as the ad set name even when they share
the same identifier string.

**Fields** (repeat per level)
- Level: `<campaign / ad set / ad>` | Reliability: `<AUTO: % match>` |
  Decoder: `<naming-decoder.json positions for this level>` |
  Fallback if weak: `<creative signals / URL / ask>`

**Fields** (once, after the per-level entries)
- Product/concept names live at: `<ad / ad set / campaign / multiple levels — AUTO, confirmed>` |
  Default filter level for bare product-name asks: `<adName unless confirmed otherwise>`
- Decoder file: `</agent/brain/meta/naming-decoder.json — written and indexed | not needed (no convention)>`

## 5. Attribution model and windows

Status: `[EMPTY]`

**Auto-pull:** Nothing. Do not read from Motion workspace configuration.

**What to present:** Propose **7-day click, 1-day view** as the default. Ask if that's correct
or if the team uses different windows. Do not ask them to specify windows cold.

**Fields**
- Trusted source: `<...>` | Click window: `<proposed 7d, confirm>` |
  View window: `<proposed 1d, confirm>`

## 6. Account structure

Status: `[EMPTY]`

**Auto-pull**
- Detect CBO vs ABO. Note ad set counts and ads per ad set.

**What to understand**
- Confirm detected budget level.
- Learn test batching behavior and pause/cut rules — the behavior the data can't show.

**Fields**
- Budget level: `<AUTO>` | Test batching: `<...>` | Creatives per batch: `<...>` |
  Pause/cut rule: `<...>`

## 7. Funnel map

Status: `[EMPTY]`

**Auto-pull**
- Pull campaign names and objectives from the account.
- Propose how campaigns group into funnel stages.
- Flag any agency-managed, ASC (Advantage+ Shopping), or otherwise non-standard campaigns
  that may need to be excluded from standard CPA comparisons.

**What to understand**
- Confirm which campaigns belong to which stage.
- Identify the priority campaign(s) — the ones the team watches and judges the account by.
- Confirm whether flagged campaigns should be excluded from standard comparisons.

**Fields**
- Campaign-to-stage map: `<AUTO proposal>` | Priority campaign(s): `<...>` |
  Excluded campaigns: `<...>`

## 8. Creative performance metrics and benchmarks

Status: `[EMPTY]`

**Auto-pull**
- Pull metric values and current account averages.
- Compute video-only metrics (thumbstop, hold rate) from video creatives only.
  Static image ads have no such metrics: mark them not applicable, never 0.
- Resolve exact metric keys with `motion meta metric-reference` before requesting.

**What to understand**
- Which creative metrics the customer judges on and their goal or floor for each.
- Ask openly: "What's your goal on thumbstop, and are there other creative metrics you judge
  on — hold rate, CTR, or anything else?" Do not anchor only on thumbstop; different accounts
  weight creative metrics differently and some do not use thumbstop as a primary signal at all.
- Anchor the question in pulled averages for each metric you surface, so the customer is
  reacting to real numbers, not abstract targets.

**Fields** (repeat per metric)
- Metric: `<...>` | Account average: `<AUTO>` | Target or floor: `<...>`

## 9. Targets, thresholds and decision rules

Status: `[EMPTY]`

Captures how the account judges performance and what makes something a winner or a cut.
The goal is a simple operational reference — not an exhaustive ruleset. Runneth applies
judgment to edge cases; this field covers the four things that need to be captured explicitly.

**Auto-pull**
- Pull current CPA (or equivalent attribution tool metric) across the account as a reference baseline.
- If variation across product lines or campaign types is material, surface it anchored in the
  data before asking for targets: "I can see CPA ranges from roughly $X for [A] to $Y for [B] —
  does your target account for that difference?"

**Four things to capture:**

**1. Ranking metric**
What metric to sort by when answering any performance request. Default: the attribution tool's
primary CPA metric, ascending (lower is better). Confirm whether this varies by product line or
campaign type — if it does, capture each separately.

**2. CPA target**
The reference point for judging whether a creative's CPA is good. Used as commentary, not a
filter. Capture per product line when accounts have multiple product lines with different economics.
If no explicit target exists, propose the account's own historical average as the reference.

**3. Winner/cut criteria**
What makes something a winner or a cut. Apply these ONLY when a user explicitly asks a
winner/cut question ("is this a winner?", "what should we cut?", "what's proven?", "what's
ready to scale?"). For all other queries — ranking, totals, window performance, segment views —
show the data as asked without applying these criteria.

Capture:
- **Spend floor:** How much spend before trusting a result. Ask explicitly whether this is
  a lifetime number or a within-window number — the answer changes how the extra spend pull works.
  If the account does not track lifetime spend or doesn't care about it, a window-based floor
  is fine. Getting lifetime spend requires a separate wider-range pull; only do it when the
  account tracks lifetime tiers and the user is asking a winner/cut question.
- **Minimum days:** How many days before any decision is valid.
- **Tier labels** (optional): If the account uses named tiers (e.g., Legend / Scale / Kill),
  capture the spend thresholds for each. If not, skip — a spend floor and minimum days is enough.
  When tiers and window are confirmed, write the usage rule into the saved brain file: rank by
  the attribution CPA metric ascending within the requested window first, then apply tier labels
  after ranking based on lifetime spend — not window spend. Tiers are classification labels,
  never ranking criteria or pre-filters.

If the spend floor is not confirmed, write it into a `## Still confirming` section of the saved
brain file and flag every winner/cut answer until it is resolved.

**4. Default reporting window**
What window to use when the user doesn't specify one. Capture the cadence they normally report
on (e.g., last 14 days, last 7 days) so Runneth doesn't have to guess.

**Fields**
- Ranking metric: `<attribution CPA metric, ascending>` | Varies by product: `<yes / no>`
- CPA target: `<per product line>` | Reference: `<target or historical average>`
- Spend floor: `<amount>` | Window: `<lifetime | in-window: N days>` | Min days: `<N>`
- Tier labels: `<Legend: $X+ / Scale: $Y-$X / Kill: <$Y — or: not used>`
- Default reporting window: `<last N days>`

## 10. Reporting structure and marketing calendar (the deck spec)

Status: `[EMPTY]`

**This field is the deck gate, not a validation gate.** The validation question loop runs
without it, but no deck is built until it is confirmed: the weekly deck's structure, cadence,
and exclusions come from here. If validation reaches the deck build and this field is not yet
confirmed, run its two beats right there — it synthesizes from already-confirmed fields, so it
costs two questions, not a re-interview.

This field solves three root problems: (1) the reporting picture is scattered across Fields 4,
7, and 9 but never synthesized — without this field, Runneth asks the customer to explain their
reporting from scratch; (2) the marketing calendar is embedded in the naming convention data
but never surfaced proactively — without this field, Runneth has no seasonal context; (3) the
validation deck has no spec — without this field, the "build the weekly deck" step in
validation starts with a blank sheet.

Run this field last. It synthesizes from other fields and requires Fields 4, 7, and 9 to be
confirmed before it runs.

**Auto-detect (no new Motion pull needed)**

*Reporting structure — synthesize from confirmed fields:*
- Cadence: from Field 9 (default reporting window)
- Exclusions: from Fields 7 and 9 (excluded campaigns and report exclusions)
- Performance slice: from the naming decoder (product line, content program, funnel stage,
  campaign type) and Field 7 (campaign-to-stage map)
- Breakdowns: from any confirmed product-level reporting rules

*Marketing calendar — detect from the naming convention pull:*
- Use the campaign-type and launch-date positions from the account's naming decoder, where the
  decoder carries them. Positions vary by account — read them from `naming-decoder.json`, never
  assume an offset.
- Group by campaign type and earliest detected launch date to propose a seasonal calendar.
- Do not run a new Motion pull; the data is already in the naming convention pull. If the
  decoder carries no campaign-type or launch-date positions, say so and ask for the calendar
  directly instead of proposing a detected one.

**What to present**

Present in two beats, back to back.

*Beat 1 — Marketing calendar (auto-detected):* State what was detected. Propose the calendar
with the detected campaign types and their launch windows. Then ask one question: whether there
is anything coming up not yet visible in the account.

*Beat 2 — Reporting structure (auto-synthesized):* Present the synthesized picture as a
bulleted summary, then propose the four standard report sections as the starting deck
structure. Then ask one question: whether this matches the full picture and what the ideal
report would add.

The four standard sections to propose for every account, adapted to the account's data:
1. Top ads of the period — by funnel stage or by campaign
2. Performance by the account's second dimension (usually product)
3. Active seasonal campaign performance — whatever is running in the detected calendar
4. Performance breakdown by naming convention dimensions — content program, format, offer
   level, funnel stage. This is the creative team's signal layer: which buckets are winning
   and which are not, derived automatically from the naming decoder.

These four sections are a starting hypothesis, not a fixed template. Present them, let the
customer confirm or reshape.

**Why two questions, not one:** the marketing calendar and the reporting structure are separate
confirmations. The calendar question is about completeness of external context. The reporting
question is about the deck spec. Combining them into one question loses precision. Keep them as
two beats in sequence.

**Fields (saved output — feeds the validation deck build directly)**
- Marketing calendar: `<campaign_type | launch_window | confirmed: yes/pending | notes>`
- Reporting cadence: `<every N days>`
- Reporting exclusions: `<confirmed list>`
- Deck sections: `<1. top ads | 2. by [dimension] | 3. seasonal | 4. naming breakdown>`
- Confirmed or open: `<what the customer confirmed vs what is still pending>`

On confirmation, write this as the deck-spec section of `/agent/brain/meta/account-context.md`
(see "Where the filled result lives") — that is where the validation deck build reads it.

This field is also where deck feedback lands. When a customer asks for a structural change
to the deck — sections, cadence, slicing, exclusions — during validation or any later
conversation, the change is written here first and the deck regenerates from it. The spec's
only home is this field, never the deck file itself (per the validation package's training
loop).

---

# Derived capabilities (not filled, enabled)

Runneth computes these from the fields above. Never asked or filled; they turn on once their
inputs exist.

- **Cross-KPI surfacing** needs the Funnel map and its priority campaign.
- **Click-to-conversion diagnosis** needs the Funnel map and landing page context.
- **Metric-gotcha handling** needs field 3.

If an input field is `[FLAGGED]`, say plainly that its derived capability is off until the input
is captured.

---

# Context health check

Run these as a suite once fields are filled. Each is the acceptance test for its field.

1. Sources of truth: "What was our cost per [primary conversion event] last month, and which source is that from?"
2. Conversion events: "What are our best-performing ads right now?"
3. Metric gotchas: "What's our ROAS on [campaign]?"
4. Naming conventions: "What's our best-performing messaging angle across the account?"
5. Attribution: "How many demos did we book from ads last month?"
6. Account structure: "Which ad sets should we consider cutting?"
7. Funnel map: "Which of our campaigns are top-of-funnel versus closing, and which matter most?"
8. Creative metrics: "Is this video's hook working?"
9. Targets and thresholds: "Is this ad a winner yet?"
10. Reporting structure and calendar: "What should this week's report cover, and what's coming
    up on the marketing calendar?"

## Overall status

- Fields confirmed: `<count>` / 9
- Field 10 (deck spec): `<confirmed | pending — no deck build until confirmed>`
- Flagged fields needing the customer: `<list>`
- Written to: `/agent/brain/meta/account-context.md`
- Indexed in `/agent/INDEX.md`: `<yes | no>`
- Guard merged into `/agent/user.md`: `<yes | no>`

---

# Changelog

Maintained in the package repo at `meta-and-voc-onboarding/CHANGELOG.md` — not staged to
customer brains.
