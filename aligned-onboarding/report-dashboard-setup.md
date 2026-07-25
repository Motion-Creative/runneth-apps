# Meta Report Dashboard Setup

This package file teaches Runneth how this customer wants Meta report, dashboard, app, and weekly
readout surfaces built. It is the customer-specific companion to the Account Context Brain.

The Account Context Brain answers: **how should Runneth judge the account?**
Report Dashboard Setup answers: **how should Runneth package those judgments into useful surfaces for
this team?**

The saved output is `/agent/brain/meta/report-dashboard-context.md`. It is customer-owned setup,
visible in the Brain, and safe for the team to edit. Do not hide these preferences in app code,
runtime config, scratch files, or one-off conversation memory.

---

## 1. Activation

Installing only stages this file. The package does not self-run. Run this setup after
`/agent/brain/meta/account-context.md` exists.

Merge the block below into `/agent/user.md` using the standard behavior-snippet convention. It is
sentinel-wrapped so it is idempotent.

**MERGE INSTRUCTIONS:** If a block with the sentinel `runneth:report-dashboard-context-guard`
already exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate it. Do
not edit anything outside the sentinels.

```
<!-- BEGIN runneth:report-dashboard-context-guard v1 -->
Report dashboard context guard (workspace <workspaceId>):

- Before building, updating, scheduling, or refreshing a Meta report, dashboard, app, tracker,
  readout, or weekly deck source for this account, read /agent/brain/meta/account-context.md.
- If /agent/brain/meta/report-dashboard-context.md exists, read it before choosing report defaults,
  source-of-truth rules, metric order, thresholds, taxonomy, creative evidence, visual treatment, or
  delivery cadence.
- If the report-dashboard context file does not exist and the build depends on customer-specific
  choices, offer to run the report-dashboard setup flow instead of guessing. The user can still give
  an explicit one-time instruction in the current turn.
- Precedence: current-turn explicit instruction wins, then a named saved Motion report
  configuration unless the report-dashboard context says it is not trusted or should be adapted, then
  report-dashboard context, then generic report defaults.
<!-- END runneth:report-dashboard-context-guard v1 -->
```

---

## 2. Scope

This setup describes report preferences for one Meta workspace/account at a time.

- Target workspace: `<workspaceId>` (ad account: `<name>`)
- Platform scope: Meta only.
- Interpretation source: `/agent/brain/meta/account-context.md`
- Report setup output: `/agent/brain/meta/report-dashboard-context.md`
- Related creative evidence: `/agent/brain/meta/creatives/`

Report Dashboard Setup can mention other connected attribution or delivery sources only when the
customer uses them to build Meta reporting, for example Northbeam, Hyros, Triple Whale, Google
Analytics, Slack, Google Slides, or an internal sheet. It does not pull other ad platforms.

---

## 3. Where The Filled Result Lives

Create `/agent/brain/meta/report-dashboard-context.md`. The saved file is a prose reference document,
not a worksheet. Write it the way a sharp CSM or analyst would explain the customer's reporting
preferences to a new teammate.

The saved file must include:

1. **Title:** `# <Ad account> - Report Dashboard Context`
2. **One short intro paragraph:** what this file governs and that Runneth reads it before report,
   dashboard, and app builds for this Meta account.
3. **At a glance:** default report views, trusted source, primary decision metric, default windows,
   and any major gotcha.
4. **Standard views:** the views this customer expects, especially Top Ads, Topline Metrics,
   Comparative Analysis, and Launch Analysis when relevant.
5. **Source of truth:** saved Motion reports, Meta, Northbeam, Hyros, Triple Whale, Google
   Analytics, spreadsheets, or other customer-named reporting sources.
6. **Metrics and labels:** which metrics appear, their display names, direction, and qualification
   rules.
7. **Date windows and comparisons:** default windows, weekly comparisons, long lookbacks, and
   timezone.
8. **Taxonomy and grouping:** product, campaign, SKU, funnel, creator, AI tag, or naming rules.
9. **Creative evidence:** playable videos, still previews, same-size cards, required table columns,
   drilldowns, and how missing media is shown.
10. **Visual and delivery standards:** Motion-like treatment, dashboard density, brand/reporting
    style, cadence, delivery destination, and review flow.
11. **Validation dashboard:** the first dashboard or report that proves Runneth understands the
    account.
12. **Still confirming:** open choices and who should answer them.
13. **File metadata:** fenced YAML at the bottom for refresh routines.

### Output Skeleton

~~~markdown
# <Ad account> - Report Dashboard Context

<One or two plain sentences explaining that this file governs how Runneth builds Meta reports,
dashboards, apps, trackers, and weekly readouts for this account.>

## At a glance
- Default views: <Top Ads, Topline Metrics, Comparative Analysis, Launch Analysis, or customer terms>.
- Trusted source: <saved Motion report, Meta, Northbeam, Hyros, spreadsheet, etc.>.
- Primary decision metric: <metric and direction>.
- Default windows: <last 7/14/30, weekly comparison, custom>.
- Biggest reporting gotcha: <what Runneth must not misread>.

## Standard views
<Short prose or a compact table. For each view, state the question it answers, default sections,
ranking metric, filters, and any customer-specific expectation.>

## Source of truth
<Which reports or data sources to use first, what each source is trusted for, and what to avoid.
State what to do when Motion and the customer's Runneth setup disagree.>

## Metrics and decision rules
<Metrics, labels, direction, thresholds, and definitions such as hit, scale-worthy, graduated, cut,
fatigued, or needs review. Include the time window each rule uses.>

## Date windows and cadence
<Default dashboard controls, weekly comparison behavior, long-lookback rules, timezone, and routine
cadence or delivery destination.>

## Taxonomy and grouping
<Product, SKU, campaign, creator, funnel, AI tag, and naming rules. Say which groupings are trusted
and which should be confirmed before use.>

## Creative evidence
<Required card/table content, media behavior, playable video preference, same-size card expectations,
and how to handle missing media.>

## Visual and delivery standards
<Motion-like reporting expectations, density, brand/report style, destinations, and review steps.>

## Validation dashboard
<The dashboard or readout that proves onboarding worked. Include the exact prompt or business
question to test.>

## Still confirming
- <Open question>

## File metadata
```yaml
domain: meta
workspace_id: <id>
workspace_name: <name>
substance: report-dashboard-setup
managed_by: aligned-onboarding package
sources: [account-context, saved-motion-reports, customer-confirmation]
last_refreshed: <date>
confirmed_by_team: <yes | partial | no>
```
~~~

---

## 4. How Runneth Fills This In

Read `/agent/brain/meta/account-context.md` first. Do not re-derive account interpretation here.
Pull only the setup needed to understand the reporting surface.

Work through these fields:

### Field 1 - Standard Views

Understand which repeatable views the customer expects and what each view is for.

Default archetypes to confirm:

- **Top Ads:** top creative cards plus a comparison table. Usually answers what to scale, remix, or
  inspect next.
- **Topline Metrics:** account or workspace overview, with KPI movement and drivers.
- **Comparative Analysis:** campaign, product, creator, tag, concept, or week-over-week comparison.
- **Launch Analysis:** newly launched or testing ads, often grouped by product, with hit or
  graduation rules.

Ask what else belongs here. Do not force every customer into all four views.

Validation question: "If someone asks for your weekly reporting dashboard, which view should Runneth
build first?"

### Field 2 - Trusted Sources And Saved Reports

Capture which saved Motion reports or external attribution sources Runneth should reuse before
inventing a view.

Use saved report metadata when available. If the customer names a trusted report, record the title,
purpose, platform, date behavior, metric basis, grouping, and any report URL or ID visible to the
customer.

Capture source rules in business terms:

- Use Meta for platform delivery reads.
- Use Northbeam, Hyros, Triple Whale, Google Analytics, or another source only when the customer says
  it is the decision source and an available integration can retrieve it.
- State what not to use when the customer distrusts a metric or report.

Validation question: "When Meta and the trusted attribution source disagree, which one decides the
dashboard?"

### Field 3 - Metrics And Decision Rules

Capture the report-facing version of the metric hierarchy from Account Context Brain.

For each metric or label, record:

- display label
- definition in this account
- direction, especially lower-is-better metrics such as CPA
- required spend or confidence threshold
- time window
- whether it belongs on cards, tables, topline summary, or only in caveats

Common labels to confirm:

- Primary KPI
- Spend
- CPA or cost per result
- ROAS or revenue efficiency
- Thumbstop rate
- Hold rate
- Outbound CTR
- Hit
- Scale-worthy or graduated
- Cut, loser, or needs review
- Fatigue

Validation question: "What makes a creative a hit here, and how much spend does it need before that
label is trustworthy?"

### Field 4 - Date Windows And Cadence

Capture the customer's default controls and recurring rhythm.

Common windows:

- last 7 days
- last 14 days
- last 30 days
- custom date range
- previous week comparison
- long lookback for hit-rate or archive reads

Record the timezone and whether recurring dashboards should post to Slack, become a saved app, feed a
deck, or stay in chat until reviewed.

Validation question: "What should Runneth compare against when someone asks for the weekly report?"

### Field 5 - Taxonomy And Grouping

Capture how report rows should group.

Common grouping sources:

- saved Motion report grouping
- product or SKU naming rule
- campaign or ad set naming rule
- creator or influencer naming rule
- funnel, offer, audience, or market naming rule
- Motion AI tag category
- customer-maintained spreadsheet or tracker

If taxonomy is inferred from names, label it as inferred. Ask before using ambiguous taxonomy for
decisions.

Validation question: "If Runneth shows product performance, what exact rule decides which ad belongs
to which product?"

### Field 6 - Creative Evidence

Capture what makes a dashboard feel usable to this team.

Recommended defaults:

- Show playable videos when video URLs exist.
- Use still previews when playable video is unavailable.
- Keep creative cards the same size inside a comparable row or grid.
- Put required metrics in the same order on every card.
- Include a reconciliation table with source identifiers.
- Show missing media, missing metrics, and partial pulls as visible caveats.

Validation question: "What has to be visible on every creative card for your team to trust the
dashboard?"

### Field 7 - Visual And Delivery Standards

Capture standards that are specific to this VM or customer, not generic design-system rules.

Examples:

- "Make this feel like a Motion report."
- "Use dense review surfaces, not a marketing landing page."
- "All creative cards must be the same size."
- "Videos must be playable when media URLs exist."
- "Weekly reports go to this Slack channel after review."
- "The dashboard is the source for a Monday deck."

Do not save internal component names, open PR notes, or package implementation details here. Save the
customer-visible expectation.

Validation question: "What would make this dashboard feel wrong even if the numbers were correct?"

### Field 8 - Validation Dashboard

Pick one dashboard as the validation artifact for onboarding. The dashboard proves Runneth has the
right sources, metric interpretation, taxonomy, creative evidence, and visual standard.

Use the customer's own must-have business questions first. If none are known yet, start with one of
these:

- "Build a top ads dashboard with custom dates plus last 7, 14, and 30 days. Show the top 10
  creatives sorted by spend with spend, CPA, thumbstop rate, hold rate, and outbound CTR."
- "Create a comparative report showing campaign performance in one section and overall insights
  compared to the previous week."
- "Build a launch analysis dashboard for newly launched ads by product, with product performance and
  top ads by product."
- "Show account-wide hit rate over the last 90 days. A hit means at least 3K spend and at least 0.5x
  ROAS."

Validation question: "Which dashboard would prove to you that Runneth understands this account?"

---

## 5. Hard Rules

- Do not save generic design-system instructions here. This file is for customer-specific reporting
  preferences.
- Do not save tool-calling details, CLI flags, command names, endpoint comparisons, or internal
  Runneth implementation notes into `/agent/brain/meta/report-dashboard-context.md`.
- Do not make up metric definitions, thresholds, taxonomy, source trust, or delivery cadence.
- Do not treat a saved Motion report as trusted just because it exists. Record why the customer uses
  it.
- Do not let a generic report archetype override a customer-specific rule.
- Do not store this setup under `/agent/workspaces/<workspaceId>/...`; this package writes customer
  setup into the visible Brain under `/agent/brain/meta/`.
- Do not make the app itself the only source of dashboard truth. Apps should render data and criteria
  that are saved separately and auditable.

---

## 6. Refresh

Refresh this setup when:

- the customer corrects a report or dashboard
- the trusted saved Motion reports change
- a source of truth changes
- a weekly dashboard becomes recurring
- a new product, campaign taxonomy, market, or attribution rule becomes important
- the validation dashboard fails because Runneth picked the wrong source, metric, grouping, or
  evidence shape

Append every refresh to `/agent/brain/meta/_changelog.md`.
