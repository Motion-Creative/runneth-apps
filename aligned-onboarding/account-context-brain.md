# Meta Account Context: Brain Onboarding Package

This package teaches Runneth how a customer understands their Meta ad account, so its queries,
rankings, and insights match how the team actually thinks about the data. This package is
Meta-only: it never looks for or pulls other ad platforms (TikTok, LinkedIn, YouTube). Meta is
the ad platform for this account by definition. Installing it stages
these files into the customer brain. It does not self-run. Activation, below, is what makes
Runneth run the fill-in and then live by the result.

Two things exist after activation:
1. A durable, workspace-scoped context file, written as a plain-language reference document (not
   the worksheet), that Runneth writes and later reads as source of truth.
2. A small standing guard merged into `/agent/user.md` that forces Runneth to read that file
   before any performance work.

---

# How this package operates

## 1. Activation (what triggers it, and when)

Installing only stages files. The package does not self-run. To activate it, merge the guard
block below into `/agent/user.md`, then run the fill-in procedure.

Merge the block using the standard behavior-snippet convention (author it from
`building-integrations/behavior-snippet.md`). It is sentinel-wrapped so it is idempotent.

**MERGE INSTRUCTIONS:** If a block with the sentinel `runneth:account-context-guard` already
exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate it. Do not
edit anything outside the sentinels.

```
<!-- BEGIN runneth:account-context-guard v1 -->
Account context guard (workspace <workspaceId>):

- Before any ad-performance work for this account (rankings, "best ads," CPA/ROAS reads,
  winner or cut calls, creative performance judgments), read
  /agent/brain/meta/account-context.md first.
- If that file does not exist, or its required interpretation fields are not all [CONFIRMED],
  treat account
  interpretation as unknown. Offer to run the account-context fill-in flow, and do not answer
  performance questions on guesses.
- Runneth may auto-fill and mark [AUTO] fields on its own immediately. It must hold [CONFIRMED]
  fields for a person and never promote [AUTO] to [CONFIRMED] without human sign-off.
- Precedence: this file is the sole source of account interpretation (how "best," "winner," and
  cost-per are judged). Do not read or defer to Motion workspace settings (workspace goal,
  preferred KPI, spend threshold, attribution config); treat them as if they do not exist for
  this account. Defer only to a metric the user names explicitly in the current turn.
<!-- END runneth:account-context-guard v1 -->
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
  to `/agent/brain/meta/account-context.md`. The per-creative files from the Creative Corpus live
  in a `creatives` subfolder beside it (`/agent/brain/meta/creatives/`).

**The saved file is a prose reference document, not the worksheet.** Capture and communication are
two different jobs. The fields-and-statuses procedure below is how Runneth captures rigorously; the
saved file is how it communicates. Write the saved file the way a sharp analyst would explain this
account to a new teammate: interpretation baked into sentences, the decision stated, readable in
about 30 seconds. State conclusions, not statuses. Do not carry `[CONFIRMED]`/`[AUTO]`/`[FLAGGED]`
badges or `Field N` headings into it. Express open items in plain language (we are still confirming
per-product targets with the team), not as flag noise. Use this order:

1. **Title (H1):** `# <Ad account> - Meta Account Context`
2. **One short intro paragraph, in plain language:** what this file is, that Runneth reads it
   before any Meta performance work for this account, and how to read the field statuses
   (`[CONFIRMED]` = a person validated it, `[AUTO]` = pulled but unconfirmed, `[FLAGGED]` = still
   needs the customer). This replaces the bare `Load before any performance analysis.` line; keep
   that meaning, but say it like a sentence, not a machine directive.
3. **At a glance:** a few bullets a human can skim: last refreshed, confidence, fields confirmed
   (count / 9), and any open flags.
4. **The nine fields**, in order.
5. **File metadata (last):** end the file with a `## File metadata` heading followed by the machine
   contract as a fenced `yaml` code block, so refresh routines have something to read but it never
   dominates the top of the file. Keep it valid and fenced so no renderer shows it as a wall of
   body text. The block holds these keys:

   - `domain: meta`
   - `ownership: <team or CSM who owns this>`
   - `substance: account-interpretation`
   - `managed_by: account-context onboarding package`
   - `sources: [meta-auto-pull, customer-confirmation]`
   - `refresh_cadence: monthly`
   - `last_refreshed: <date>`
   - `confidence: <low | medium | high>`
   - `confirmed_by_team: <yes | partial | no>`

**Write conclusions, not readouts.** The difference:
- Worksheet (internal capture): `ROAS: [CONFIRMED] blended, runs below 1, all products one pixel.`
- Saved file (prose): ROAS always looks low here because every product shares one pixel, so it
  comes out blended. Don't lead with it; judge each product on CPA.
The reader should never have to interpret a status. The interpretation is already done for them.
Model the tone on a strategist's account brief, not a filled form.

- Index it in `/agent/INDEX.md` with aliases (account context, KPI hierarchy, how we judge ads,
  performance interpretation) and a one-line note. The read-before guarantee comes from the guard
  in `user.md`, not from the index. INDEX is a routing surface, not always-on context, so indexing
  alone does not force a read.

### Output skeleton (match this shape)

Produce the saved file in this shape and voice. Placeholders in `<...>` get replaced with the
account's real interpretation; the point is prose that states conclusions, not a status readout.

~~~markdown
# <Ad account> - Meta Account Context

<One or two plain sentences: what this account is, and that Runneth reads this before any Meta
performance work. No jargon.>

## At a glance
- Platform: Meta only.
- How we judge: <the one metric that matters, stated plainly, e.g. cost per purchase>.
- Attribution: <window, e.g. 7-day click / 1-day view>.
- Biggest gotcha: <the one thing most likely to mislead, in one line>.

## How we read this account
<2 to 4 short paragraphs. What "best" means here and why. Which numbers to trust and which
mislead, with the reason baked in, e.g. "ROAS looks low because all products share one pixel, so
judge on CPA." Each point is a conclusion, not a status.>

## Conversion events
<Which event defines a result and why. If custom conversions exist but are not used, say so in one
line. Rank them if it matters.>

## Campaigns and funnel
<How campaigns are organized (scaling / testing / launch), which matter most, and which are
excluded from standard comparisons and why. Structural roles are set by campaign, not spend level.>

## Naming
<What the ad and campaign names encode and how reliable they are, so a reader can decode them. If a
tag is easy to misread, say what it does NOT mean. This describes existing names; it never
prescribes naming.>

## How we decide
<Targets, thresholds, and the pause / scale / cut rules, each with its time window. What makes a
result trustworthy. If a target is not set yet, say we are still confirming it.>

## Still confirming
<Plain-language list of what is open and who owns it. This replaces flag badges.>

## File metadata
```yaml
domain: meta
workspace_id: <id>
workspace_name: <name>
brands_in_scope: [<...>]
other_workspaces_in_org: [<siloed workspaces not covered>]
ownership: <team>
managed_by: account-context onboarding package
refresh_cadence: monthly
last_refreshed: <date>
confidence: <low | medium | high>
confirmed_by_team: <yes | partial | no>
```
~~~

## 4. Refresh (keep it current, never one-time)

- `refresh_cadence` is set in the File metadata block (recommend monthly for account interpretation).
- The `meta` folder keeps `/agent/brain/meta/_changelog.md`. Any refresh
  appends a one-line entry. No silent updates.
- Structural drift is a second trigger: when new conversion events, campaigns, or naming
  patterns appear, re-open only the affected `[CONFIRMED]` fields for re-confirmation and
  re-synthesize only those.
- Delivery is recommend-then-confirm: Runneth proposes the cadence, the team confirms before a
  routine is created.
- Honest constraint: the clean scheduled-refresh primitive (`background-upkeep`) is not shipped
  yet. Until it lands, run refresh as a deterministic script on best-effort scheduling, or as a
  manual re-run.

## 5. Precedence

State this in the filled file too. This account-context file is the sole source of account
interpretation (how "best," "winner," and cost-per are judged). Do not consult Motion workspace
settings; treat workspace goal, preferred KPI, spend threshold, and attribution config as if they
do not exist for this account. This file defers only to a metric the user names explicitly in the
current turn.

---

# How Runneth fills this in

Work through the fields in order. For each field:

1. **Auto-pull.** Run the observable pulls listed under the field (scoped with `--workspace-id`)
   and pre-fill with what the account actually shows. Mark those lines `[AUTO]`.
2. **Ask, intuitively.** Do not read the prompts below as a script. Read what auto-pull returned
   first, then ask only what the data genuinely leaves open, in the customer's own terms,
   grounded in the specifics you actually pulled. Each field states what to *understand*, not
   wording to recite. Mark confirmed answers `[CONFIRMED]`.
3. **Validate.** Use the field's validation question as an acceptance test, instantiated with the
   account's real events, campaigns, and names. If Runneth can answer it correctly from the
   filled fields, the field is done.
4. **Flag.** If a field cannot be auto-pulled and has not been answered, mark it `[FLAGGED]` and
   write one line on what is blocking it.

Hard rules:

- Never guess, infer, or invent a value to fill a blank. A `[FLAGGED]` field is always better
  than a wrong one.
- `[AUTO]` values are proposals until a person confirms them. Auto-pull shows what fired, never
  what it means. Never promote `[AUTO]` to `[CONFIRMED]` without human sign-off.
- The intake is not deterministic. If the pull already answers something, do not ask it again.
  If the pull surfaces something surprising, follow it with a question no script listed.
- Meta only. Do not look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- Do not read or rely on Motion workspace settings (workspace goal, preferred KPI, spend
  threshold, attribution config). Treat them as nonexistent. Everything Runneth needs comes from
  auto-pulled Meta ad data, this worksheet, and customer confirmation.
- Video-only metrics (thumbstop, hold rate, video plays, and other view/retention metrics) do not
  apply to static image ads. For statics, treat them as not applicable, never as 0. Never rank,
  compare, judge, or flag a static on a video metric, and never include statics when computing
  video-metric averages.
- Do not volunteer or rank by ROAS unless the account has confirmed revenue-based conversions and
  ROAS is confirmed as a trusted metric. Many Meta accounts (lead-gen, app, non-purchase) have no
  meaningful ROAS; there, treat ROAS as not applicable and rank by the confirmed conversion event
  instead. Never present ROAS as a headline number on an account whose north-star is a lead or
  other non-purchase event.
- The saved brain files are customer-facing account interpretation only. Never write internal
  Runneth-team content into them: tool-calling nuances, CLI command names or flags, or
  endpoint-vs-endpoint comparisons. Capture metric behavior in account and business terms, not in
  terms of which command returned what.
- Do not write generic metric definitions or universal creative principles into the file (for
  example "thumbstop is the 3-second rate," "statics have no video metrics"). That is practitioner
  baseline, not account context. Only what is true about THIS account belongs here.
- `[CONFIRMED]` means a person validated it, never that Runneth observed it in data. Runneth-observed
  evidence is `[AUTO]`.
- When a field's purpose is unclear, ask what it is for before filling it. Do not invent a purpose.
- `motion brand-context` (own-brand strategy) is allowed input for reasoning about what the account
  optimizes for. It is not a Motion workspace setting, so the "ignore settings" rule does not block
  it.
- The fields and statuses in this procedure are internal capture scaffolding: how Runneth tracks
  confirmed vs assumed vs missing while it works. They are NOT the saved file. Never save the
  worksheet (status badges, `Field N` headings, flag lists) as the brain file. The brain file is the
  prose reference document specified in the persistence section.

### How to ask well

- Anchor every question in a specific thing you pulled: a named event, a specific campaign, an
  actual naming pattern, a metric that looked off. The pulled data is context that makes the
  question concrete — not a proposal for the person to confirm. Ask openly.
- Ask the fewest questions that close the real gaps. Skip anything the data already settled.
- When something the pull surfaced is ambiguous or unexpected, ask about that first.

The difference:
- ❌ Abstract: "What attribution windows do you use?"
- ✓ Anchored open: "Your campaign suffixes use `7D1V1E` and `7D1V` — what windows are you
  actually reading results against?"

- ❌ Abstract: "Is Northbeam connected?"
- ✓ Anchored open: "Northbeam returned null across every row. Is it connected here, or has it
  been deprecated?"

The data gives the person something real to react to. The question is still genuinely open.

**Presenting the full picture (default output format).** After auto-pulling all nine fields,
present them together as a single overview — not one item at a time. This is the default output.
Go field by field, and for each one: state what you pulled, then ask the single open question that
the pull leaves unanswered. Where the pull fully settles a field, say what you know and move on
with no question. When the person responds, confirm or update fields from their answers, then
write the saved file.

Rules for the full overview:
- Talk about the account, never the worksheet. Do not show field numbers, status badges, or
  `[FLAGGED]` labels. Those are internal.
- Each field gets one anchored question at most. No compound questions or sub-bullets.
- Lead with what you know. The ratio should feel like mostly settled reads with a few specific
  things still open — not a list of things you don't know.
- Keep it moving and light. When a field is settled by the pull, say so briefly and move on.
  Do not ask for confirmation of things the data already answered.

### Status legend

- `[EMPTY]` nothing captured yet
- `[AUTO]` pre-filled from the account, needs a person to confirm
- `[CONFIRMED]` a person validated it
- `[FLAGGED]` could not be captured, needs the customer
- `[N/A]` does not apply to this account

---

## Field-to-command map

How to pull each field. Exact command shapes and flags live in the Motion CLI Data-Query Guide
(`motion-cli-data-query-guide.md`); this table says which command answers which field and what to
read from the result. Resolve any uncertain metric key with `motion meta metric-reference` and any
fuzzy name with `motion meta filter-reference` first.

| Field | Pull with | Extract |
|---|---|---|
| 1. Sources of truth | `motion meta custom-conversion-metrics`; a `motion meta ads --grain adnames --northbeam --include-metrics` probe | which events exist; whether Northbeam returns values (third-party attribution present) vs Meta native only |
| 2. Conversion events | `motion meta custom-conversion-metrics`; `motion meta metric-reference --query "purchase"` (or the relevant event) | each event's id/name and the standard vs custom key; which product each maps to |
| 3. Known metric gotchas | `motion meta insights --date-range last_365d --include-metrics` (inspect the returned rows) | which metric columns are null/zero/misleading across creatives (e.g. thumbstop, ROAS, asset-type, campaign/ad set names) |
| 4. Naming conventions | `motion meta insights --include-metrics` (adName on rows); `motion meta ads --grain adnames`; `motion meta ads --grain ads` for membership | the name strings per level; detect structure and per-level reliability; note if campaign/ad set names come back empty |
| 5. Attribution | No pull. Motion settings are ignored by design | propose 7-day click / 1-day view and confirm with the team |
| 6. Account structure | `motion meta ads --grain ads --include-associated-objects` | budget level (CBO vs ABO) and ad set / ads-per-set counts where observable; the rest is team input |
| 7. Funnel map | `motion meta ads --grain ads` (campaigns + objectives); `motion meta insights` to read `fs-`/`p-` from ad names | campaign-to-stage grouping; product lines; north-star is team input |
| 8. Creative performance metrics | `motion meta insights --date-range last_365d --include-metrics --table-kpi <keys>` (keys resolved via metric-reference) | account averages for the metrics judged on (CPA, hold rate, CTR); compute video-only metrics from video creatives only |
| 9. Targets, thresholds and decision rules | `motion meta insights --include-metrics --table-kpi <cost-per key>` | reference cost-per-event to anchor targets; the targets, cut, and scale rules are team input |

Reminder: these commands belong in the package (how Runneth does the work). None of this command
detail is written into the saved account-context file, which stays customer-facing.

---

# Required context fields

All nine fields are required, and Runneth auto-pulls every one of them. There is no optional set.
Fields 1 to 4 establish whether Runneth is even correct for this account: which numbers to trust
and what "best" means. Fields 5 to 9 make its answers sharp and actionable. All of them get
pulled, filled, and confirmed.

## 1. Sources of truth

Status: `[EMPTY]`

This account runs on Meta. Do not look for or pull other ad platforms (TikTok, LinkedIn,
YouTube); Meta is the ad platform by definition. This field captures which tool is authoritative
for each kind of number layered on top of Meta.

**Auto-pull**
- List the data sources feeding this Meta account (Meta native, plus any third-party attribution
  source such as Northbeam).
- Note whether a third-party attribution source is connected.

**What to understand** (ask only what the pull leaves open)
- Which tool the customer treats as authoritative for creative performance, spend, conversions,
  and attribution, and which wins when tools disagree.
- Meta native only: confirm. Meta plus a third-party source: the disagreement question is the
  key one.

**Fields**
- Ad platform: Meta (fixed)
- Data/attribution sources connected: `<AUTO>`
- Source of truth, creative performance: `<...>`
- Source of truth, spend: `<...>`
- Source of truth, conversions: `<...>`
- Source of truth, attribution: `<...>`
- Tie-breaker when sources disagree: `<...>`

**Validation question:** "What was our cost per [north-star event] last month, and which source
is that from?" A correct answer names the trusted source, not the Meta default.

**Flag if:** sources are detected but no authority ranking is confirmed.

## 2. Conversion events: definitions and hierarchy

Status: `[EMPTY]`

Captures every conversion event, what it means to the business, and how it ranks. Defines what
"best" means for this account.

**Auto-pull**
- List the conversion events firing in the account (custom conversions and standard events).
- Where observable, note which campaigns optimize toward which event.
- If an event returns zero across all creatives, treat it as not currently in use. Do not judge on
  it. Fall back to the standard purchase event, or another event that logically fits the business.

**What to understand** (ask only what the pull leaves open)
- What each event represents to the business, and how the customer ranks them by value.
- Which events are true optimization targets versus upstream-only signals.
- Let the pulled event names shape it: confirm the self-explanatory, ask about the cryptic or the
  low-value event being optimized toward.
- Use `motion brand-context` to reason about what the account most likely optimizes for before
  asking (a purchase-driven brand judges on cost per purchase, ROAS, or a purchase-like custom
  event). Propose that read and confirm it, rather than asking cold.

**Fields** (repeat per event)
- Event: `<AUTO>` | Meaning: `<...>` | Value rank: `<...>` | Optimization or upstream-only: `<...>`

**Validation question:** "What are our best-performing ads right now?" A correct answer ranks by
the north-star event and shows cost-per that event, never spend, ROAS, or an upstream-only signal.

**Flag if:** events are listed but meaning, rank, or the optimization split is not confirmed.

## 3. Known metric gotchas

Status: `[EMPTY]`

Captures metrics that are broken, structurally zero, double-counted, or misleading here, and what
to use instead.

**Auto-pull / flag candidates**
- Scan for suspicious patterns and propose them: a metric reading zero across spend, a conversion
  column always blank, a metric that looks double-counted.
- High spend with zero conversions or zero CPA on a working purchase pixel is usually NOT a broken
  metric. It typically means the campaign optimizes for a different event (awareness, traffic) or a
  goal is misconfigured on another layer. Check the campaign objective and goal setup first; if it
  is an objective mismatch, note it in the funnel/campaign context, not as a metric gotcha.
- Field availability differs by endpoint (a field can be null on one endpoint but present on
  another). Verify a field on the endpoint you will actually use before recording it as missing.

**What to understand** (ask only what the pull leaves open)
- For each flagged pattern, whether it is expected and what to use instead.
- Whether there are gotchas the scan could not see. Ask openly; some are only known to the team.

**Fields** (repeat per gotcha)
- Metric: `<...>` | Why misleading here: `<...>` | Use instead: `<...>` | Status: `<confirmed gotcha | open flag, monitoring>`

**What to record (and what not to):** a gotcha is about how a metric behaves in this account, in
business terms: what it reads, why it misleads, what to use instead. Never record tool-calling
mechanics, CLI command names or flags, or endpoint-vs-endpoint comparisons; those are internal
notes and do not belong in the brain. If a discrepancy is real but unconfirmed, record it as an
open flag in account terms and carry it forward for monitoring.

Example, written for the brain with the mechanics stripped out:
`Open flag: purchase count and ROAS come back empty when creatives are rolled up by ad name, but
populate at the individual-creative level. Likely an aggregation difference. Not confirmed as a
gotcha; carry forward for monitoring.`

**Validation question:** "What's our ROAS on [campaign]?" A correct answer explains why the broken
metric reads the way it does and redirects to the right lens, instead of reporting the bad number.

**Flag if:** a candidate was detected but not confirmed, or the open question was not asked.

## 4. Naming conventions (campaign + ad set + ad, with reliability per level)

Status: `[EMPTY]`

Captures whether the account uses naming conventions, what each level encodes, and how reliable
each level is. Knowing they do NOT have strong naming is just as valid, and tells Runneth to lean
on creative signals and landing pages instead.

**Purpose:** this field decodes EXISTING names so Runneth can interpret data. It is read-only
interpretation. It never prescribes or changes naming. Naming can only change going forward, and
changing it resets Meta's learning, so there is no such thing as "updating" an account's naming
here.

**Auto-pull**
- Pull all campaign, ad set, and ad name strings.
- Detect structure per level (delimiters, positional consistency) and propose a decoder.
- Measure reliability per level: percent of names that fit the detected pattern.

**What to understand** (ask only what the pull leaves open)
- For levels with a detected pattern, confirm what each position means.
- For levels with no reliable pattern, whether a convention exists that the data missed, or
  whether to fall back to creative signals and landing pages.
- Let measured reliability set the tone: high-confidence pattern = quick confirm; messy level =
  real fallback conversation.
- For any tag whose meaning is not obvious, record what it means AND an explicit "does NOT mean X"
  line to block the intuitive-but-wrong reading (e.g. a tag that looks like an approval or scaling
  flag but is not).
- Precedence: when a name-embedded code (such as a product code in the ad name) conflicts with the
  campaign, the campaign wins.

**Fields** (repeat per level)
- Level: `<campaign / ad set / ad>` | Reliability: `<AUTO: % match>` |
  Fields encoded and positions: `<...>` | Fallback if weak: `<creative signals / URL / ask>`

**Validation question:** "What's our best-performing messaging angle across the account?" A correct
answer decodes the right position at the right level, or, if naming is weak, says it is using
creative signals and why.

**Flag if:** a level has a detected pattern but no confirmed meaning, or a weak level has no
confirmed fallback.

## 5. Attribution model and windows

Status: `[EMPTY]`

**Auto-pull**
- Nothing reliable from settings. Do not read attribution windows from Motion workspace
  configuration; treat that config as nonexistent. Only note a connected third-party attribution
  tool if one is observable in the data.

**What to understand** (confirm a proposed default)
- Do not ask the customer to specify windows cold. Propose the standard default of **7-day click,
  1-day view** and ask if it is okay to assume that. If they confirm, mark it confirmed; if they
  judge on different windows, capture those instead. Also confirm which source they trust for the
  final call.

**Fields**
- Trusted source: `<...>` | Click window: `<proposed 7d click, confirm>` |
  View window: `<proposed 1d view, confirm>` | Judged-on window if different: `<...>`

**Validation question:** "How many demos did we book from ads last month?" A correct answer uses
the trusted source and window and states both.

**Flag if:** the proposed 7d click / 1d view was neither confirmed nor replaced with the
customer's own windows.

## 6. Account structure

Status: `[EMPTY]`

**Auto-pull**
- Detect whether budget sits at campaign (CBO) or ad set (ABO) level. Note ad set counts and ads
  per ad set.

**What to understand** (ask only what the pull leaves open)
- Confirm the detected budget level, then learn the behavior the data cannot show: how tests are
  batched, how many creatives per batch, and what triggers a pause or a cut.
- Campaign and ad-set membership must come from the correct endpoint (`motion meta ads`, grain ads,
  plus the two-step filtered pull), not inferred from an unfiltered creative pull. Getting the
  endpoint right is what prevents campaign misclassification and creative-overlap errors; no extra
  classification machinery is needed.

**Fields**
- Budget level: `<AUTO>` | Test batching: `<...>` | Creatives per batch: `<...>` |
  Pause/cut rule: `<...>`

**Validation question:** "Which ad sets should we consider cutting?" A correct answer applies
their pause/cut rule, not a generic low-performance heuristic.

**Flag if:** structure is auto-pulled but the pause/cut logic is not confirmed.

## 7. Funnel map

Status: `[EMPTY]`

Captures how the account's campaigns map to funnel stages and which campaigns carry the objective
the team cares about most. Expressed in campaigns, not raw events, because that is how the team
organizes and talks about the account.

**Auto-pull**
- Pull the campaigns running in the account with their objectives. Propose how they group into
  funnel stages (for example prospecting / top-of-funnel vs retargeting / bottom-of-funnel).
- Campaign names come from the `campaignName` field on the returned rows, or from
  `motion meta ads` / `motion meta filter-reference`. Meta insights has no campaign group-by, so
  read campaign names off the returned rows rather than trying to group by campaign. If a
  campaign name looks wrong or mismatched against the ad, flag it rather than trusting it.

**What to understand** (ask only what the pull leaves open)
- Confirm which campaigns belong to which funnel stage, and which campaign(s) or stage is the one
  or two the team cares about most (their north-star). Where useful, tie each stage to the
  conversion event it optimizes toward (from field 2). Ground it in the campaigns actually pulled,
  not the abstract.
- Record confirmed campaign names and their roles (scaling, testing, launch, excluded). Structural
  roles are defined by which campaign, not by spend level; an ad's role is its campaign's role
  (e.g. a testing ad is one inside the testing campaign, regardless of its spend).
- Explicitly list excluded campaigns: off-Meta or otherwise incomparable campaigns (marketplace-
  routed, off-site conversion) that must be kept out of standard CPA/DTC comparisons.
- For spend-accurate reads, use the two-step filtered pull: a filtered pull for campaign-accurate
  spend, an unfiltered pull for creative detail, joined by ID.

**Fields**
- Campaign-to-stage map: `<AUTO proposal>` | Campaign roles (scaling/testing/launch): `<...>` |
  North-star campaign(s) or stage: `<...>` | Event each stage optimizes toward: `<...>` |
  Excluded campaigns (off-Meta / incomparable): `<...>`

**Validation question:** "Which of our campaigns are top-of-funnel versus closing, and which
matter most?" A correct answer places each campaign in the right stage and names the north-star
campaign or stage.

**Flag if:** the campaign-to-stage map is proposed but not confirmed.

## 8. Creative performance metrics and benchmarks

Status: `[EMPTY]`

**Auto-pull**
- Pull the metric values and current account averages to anchor target-setting.
- Thumbstop, hold rate, and other view metrics are not guaranteed to come back by default. Resolve
  the exact metric key with `motion meta metric-reference` and request it explicitly (for example
  with `--table-kpi` / `--chart-kpi`, or the matching sort) rather than assuming the default pull
  includes it. Never invent or transform a metric key.
- Engagement metrics can be null on a long window (`last_365d`) even when they exist. Test a recent
  window (e.g. `last_30d`) before concluding a metric is unavailable for the account.
- Compute those video-only metrics (thumbstop, hold rate, video plays) from video creatives only.
  Static image ads have no such metrics: mark them not applicable, never 0, and keep them out of
  video-metric averages and benchmarks.

**What to understand** (ask only what the pull leaves open)
- Which creative metrics the customer judges on, and their target or floor for each. Use the
  pulled averages to anchor, not a cold ask.

**Fields** (repeat per metric)
- Metric: `<...>` | Target or floor: `<...>` | Account average: `<AUTO>`

**Validation question:** "Is this video's hook working?" A correct answer checks their metrics
against their targets in priority order, not a generic read.

**Flag if:** metrics are auto-pulled but no targets are confirmed.

## 9. Targets, thresholds and decision rules

Status: `[EMPTY]`

**Auto-pull**
- Pull current cost-per-event as a reference. Propose a spend confidence floor (about 5x target).

**What to understand** (ask only what the pull leaves open)
- Target CPA per event, how much spend makes a result trustworthy, and when the customer scales
  versus cuts. Anchor on the pulled costs so targets are set against reality.
- Every spend threshold must state its time window: cumulative lifetime spend, or spend within a
  stated window (e.g. last 30 days). A threshold with no window is incomplete; capture the window
  explicitly, and flag it if the team has not specified one.

**Fields** (repeat per event)
- Event: `<...>` | Target CPA: `<...>` | Spend confidence floor: `<AUTO proposal>` |
  Spend window: `<lifetime | in-window: N days>` | Graduation threshold: `<amount + window>` |
  Scale rule: `<...>` | Cut rule: `<...>`

**Validation question:** "Is this ad a winner yet?" A correct answer checks spend against the
confidence floor before declaring anything, then judges CPA against the target.

**Flag if:** reference costs are auto-pulled but targets and thresholds are not confirmed.

---

# Derived capabilities (not filled, enabled)

Runneth computes these from the fields above. Never asked or filled; they turn on once their
inputs exist.

- **Cross-KPI surfacing** needs the Funnel map and its north-star campaign or stage.
- **Click-to-conversion diagnosis** needs the Funnel map and landing page context.
- **Metric-gotcha handling** needs field 3.

If an input field is `[FLAGGED]`, say plainly that its derived capability is off until the input
is captured.

---

# Context health check

Once fields are filled, run these as a suite, instantiated with the account's real events,
campaigns, and names. Each is the acceptance test for its field. A failed answer points straight
back to the field that is wrong or missing.

1. Sources of truth: "What was our cost per [north-star event] last month, and which source is that from?"
2. Conversion events: "What are our best-performing ads right now?"
3. Metric gotchas: "What's our ROAS on [campaign]?"
4. Naming conventions: "What's our best-performing messaging angle across the account?"
5. Attribution: "How many demos did we book from ads last month?"
6. Account structure: "Which ad sets should we consider cutting?"
7. Funnel map: "This Form Fallback ad, is it pulling anything real beyond leads?"
8. Creative metrics: "Is this video's hook working?"
9. Targets and thresholds: "Is this ad a winner yet?"

## Overall status

- Fields confirmed: `<count>` / 9
- Flagged fields needing the customer: `<list>`
- Written to: `/agent/brain/meta/account-context.md`
- Indexed in `/agent/INDEX.md`: `<yes | no>`
- Guard merged into `/agent/user.md`: `<yes | no>`
