# Meta Report Dashboard Setup

This package file teaches Runneth how this customer wants Meta report, dashboard, app, and weekly
readout surfaces built. It is the customer-specific companion to the Account Context Brain.

The Account Context Brain answers: **how should Runneth judge the account?**
Report Dashboard Setup answers: **how should Runneth package those judgments into useful surfaces for
this team?**

This setup should do as much app-quality work as a customer-owned package can do before reusable
components and system prompts take over. It captures customer-specific choices, and it also records
the quality floor that report/app builds should use for validation. It does not implement UI
components, but it should make obviously bad app outputs easy to reject.

The saved output is the reporting/app setup file for this workspace. It is customer-owned setup,
visible through the Brain or another indexed customer-owned location, and safe for the team to edit.
Resolve the location from an existing guard, `/agent/INDEX.md`, or customer-edited setup first. Use
this package's default only when no established file already owns reporting/app setup for the
workspace. Do not hide these preferences in app code, runtime config, scratch files, or one-off
conversation memory.

---

## 1. Activation

Installing only stages this file. The package does not self-run. Run this setup after this
workspace's Account Context Brain exists.

Merge the block below into `/agent/user.md` using the standard behavior-snippet convention. It is
sentinel-wrapped so it is idempotent.

**MERGE INSTRUCTIONS:** If a block with the sentinel `runneth:report-dashboard-context-guard`
already exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate it. Do
not edit anything outside the sentinels.

```
<!-- BEGIN runneth:report-dashboard-context-guard v1 -->
Report dashboard context guard (workspace <workspaceId>):

- Before building, updating, scheduling, or refreshing a Meta report, dashboard, app, tracker,
  readout, or weekly deck source for this account, read this workspace's established
  account-context file.
- Treat report, dashboard, app, tracker, readout, and deck as compatible surface words. Preserve the
  person's term when naming the deliverable instead of forcing `dashboard`.
- If an indexed reporting/app setup file is established for this account, read it before choosing
  report defaults, authoritative-source rules, metric order, thresholds, taxonomy, creative
  evidence, visual treatment, app quality standards, or delivery cadence.
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
- Interpretation source: the established account-context file for this workspace
- Report setup output: the established indexed reporting/app setup file for this account, or this
  package's default when none exists yet
- Related creative evidence: the established creative-context location for this workspace, or this
  package's default when none exists yet

Report Dashboard Setup can mention other connected attribution or delivery sources only when the
customer uses them to build Meta reporting, for example Northbeam, Hyros, Triple Whale, Google
Analytics, Slack, Google Slides, or an internal sheet. It does not pull other ad platforms.

---

## 3. Where The Filled Result Lives

Resolve the output path before writing: use an existing guard first, then `/agent/INDEX.md` or a
customer-edited setup file, then this package's default
`/agent/brain/meta/report-dashboard-context.md`. The saved file is a prose reference document, not a
worksheet. Write it the way a sharp CSM or analyst would explain the customer's reporting
preferences to a new teammate.

The saved file should include these sections. Leave unknowns in **Still confirming** instead of
inventing values.

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
11. **App quality floor:** the non-negotiable output standards for generated report/app surfaces.
12. **Component handoff:** how the saved setup maps to the active report/app scaffold.
13. **Validation surface:** the first report, dashboard, app, tracker, readout, or deck that proves
    Runneth understands the account.
14. **Still confirming:** open choices and who should answer them.
15. **File metadata:** fenced YAML at the bottom for refresh routines.

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
<Default controls, weekly comparison behavior, long-lookback rules, timezone, and routine
cadence or delivery destination.>

## Taxonomy and grouping
<Product, SKU, campaign, creator, funnel, AI tag, and naming rules. Say which groupings are trusted
and which should be confirmed before use.>

## Creative evidence
<Required card/table content, media behavior, playable video preference, same-size card expectations,
and how to handle missing media.>

## Visual and delivery standards
<Motion-like reporting expectations, density, brand/report style, destinations, and review steps.>

## App quality floor
<The minimum standards the generated app/report must satisfy before it is shown as acceptable:
readable labels, stable cards, media behavior, missing-data states, and mobile/desktop fit.>

## Component handoff
<Customer-facing component roles the app should use: report shell, KPI band, creative cards,
comparison table, chart, filters, caveats, and detail/drilldown behavior. Do not make the customer
learn internal component names.>

## Validation surface
<The report, dashboard, app, tracker, readout, or deck that proves onboarding worked. Include the
exact prompt or business question to test.>

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

Read this workspace's established account-context file first. Do not re-derive account
interpretation here. Pull only the setup needed to understand the reporting surface.

Work through these fields:

### Field 1 - Standard Views

Understand which repeatable views the customer expects and what each view is for.

Starter archetypes to confirm:

- **Top Ads:** top creative cards plus a comparison table. Usually answers what to scale, remix, or
  inspect next.
- **Topline Metrics:** account or workspace overview, with KPI movement and drivers.
- **Comparative Analysis:** campaign, product, creator, tag, concept, or week-over-week comparison.
- **Launch Analysis:** newly launched or testing ads, often grouped by product, with hit or
  graduation rules.

Ask what else belongs here. Do not force every customer into all four views.

Validation question: "If someone asks for your weekly reporting surface, which view should Runneth
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
reporting surface?"

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

Record the timezone and whether recurring reporting should post to Slack, become a saved app, feed a
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

Capture what makes a reporting surface feel usable to this team.

Starter defaults to confirm:

- Show playable videos when video URLs exist.
- Use still previews when playable video is unavailable.
- Keep creative cards the same size inside a comparable row or grid.
- Put required metrics in the same order on every card.
- Include a reconciliation table with source identifiers.
- Show missing media, missing metrics, and partial pulls as visible caveats.
- Never let a missing video or preview render as an unlabeled blank tile.

Validation question: "What has to be visible on every creative card for your team to trust the
reporting surface?"

### Field 7 - Visual, App Quality, And Delivery Standards

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

Validation question: "What would make this reporting surface feel wrong even if the numbers were
correct?"

### Field 8 - Generated App Quality Floor

Record the quality floor any generated app, dashboard, report, tracker, or readout should satisfy.
These are not optional taste preferences and do not need customer confirmation unless the team wants
stricter rules. Save customer-specific additions or stricter standards when the team has them.

Minimum floor:

- Long creative names, campaign names, and taxonomy labels must wrap, clamp, or move into a detail
  view. They must never overflow into neighboring cards or cover unrelated content.
- Text over media must use a readable treatment. If contrast cannot be guaranteed, put labels and
  metrics outside the media frame.
- Comparable creative cards must keep stable dimensions and matching media aspect ratios across the
  row or grid.
- Missing media must render as an explicit placeholder with a visible reason, not as a blank, dark,
  or broken-looking card.
- Metric labels must be human-readable and customer-facing. Do not expose raw field names,
  implementation names, or fallback labels such as "Fallback" unless the team explicitly uses that
  term.
- Metrics, caveats, and source identifiers must appear in consistent locations across cards and
  tables.
- Empty, partial, or stale data must be surfaced as a caveat near the affected section instead of
  silently disappearing.
- The first viewport must make the report purpose, selected date window, and ranking basis obvious.
- The app must be checked at a normal desktop width and a mobile/narrow width for overflow,
  unreadable text, and unusable scroll behavior before it is treated as done.

Validation question: "Would this still be usable if the top creative names are long, media is
missing for some rows, and one metric comes back empty?"

### Field 9 - Component Handoff

Capture the customer-facing component roles a generated report/app should include so app generation
can map the setup onto the active scaffold instead of inventing a one-off layout.

Record roles in business language:

- report shell: title, date window, source note, and caveat area
- KPI band: top-level metrics and their order
- creative cards: media, identity, required stats, required descriptive fields, tags, and action
  affordance
- comparison table: row grain, sticky identity/source columns, metric columns, totals, pagination,
  and heatmap/highlight behavior
- chart: series, x-axis, image/thumbnail behavior, legend, and whether values should be labeled
- filters or controls: date windows, grouping switches, product/campaign filters, and saved-view
  selectors
- detail or drilldown: what should open when a card, row, or chart point is selected
- caveats: where missing media, missing metrics, partial pulls, source disagreements, and inferred
  taxonomy are shown

When the active generated-app scaffold exposes reusable report components, map these roles to that
scaffold. In the current app scaffold this generally means the report element set for editorial
structure, the KPI strip for headline metrics, creative cards for creative evidence, comparison
tables for dense metric proof, charts for visual comparisons, and layout primitives for stable
placement. Do not store internal tag names in the filled customer context unless the customer
explicitly asks for implementation detail; store the roles and expectations instead.

Validation question: "Which parts of this reporting surface should be reusable every time Runneth
builds this kind of app?"

### Field 10 - Validation Surface

Pick one report, dashboard, app, tracker, readout, or deck as the validation artifact for onboarding.
The surface proves Runneth has the right sources, metric interpretation, taxonomy, creative
evidence, visual standard, app quality floor, and component handoff.

Use the customer's own must-have business questions first. If none are known yet, offer a small
starter menu like this and have the team pick or revise one:

- "Build our trusted top-creative readout with the date windows, ranking metric, supporting metrics,
  and creative evidence our team uses."
- "Create a comparative report using our trusted grouping and comparison rules."
- "Build a launch-analysis surface for newly launched ads using our graduation or review rules."
- "Show account-wide hit rate using our confirmed hit definition, confidence threshold, and
  lookback."

Validation question: "Which report, app, or dashboard would prove to you that Runneth understands
this account?"

---

## 5. Hard Rules

- Do not save generic design-system instructions here. This file is for customer-specific reporting
  preferences.
- Do not save tool-calling details, CLI flags, command names, endpoint comparisons, or internal
  Runneth implementation notes into the reporting/app setup file.
- Do not make up metric definitions, thresholds, taxonomy, source trust, or delivery cadence.
- Do not treat a saved Motion report as trusted just because it exists. Record why the customer uses
  it.
- Do not let a generic report archetype override a customer-specific rule.
- Do not record starter views, date windows, media treatment, or validation surfaces as confirmed
  customer truth unless the team confirms them or a trusted saved report proves them.
- Do not treat the app quality floor as optional. A generated surface with overflowed labels,
  unreadable text over media, unlabeled blank media, raw fallback metric names, inconsistent cards, or
  hidden partial-data caveats has not satisfied this setup.
- Preserve the customer's surface word in visible work. If they ask for an app, report, tracker,
  readout, or deck, do not rename it to a dashboard unless they do.
- Do not move this setup into workspace config, app code, scratch files, or one-off conversation
  memory just because a report app is being built. Keep it in the established customer-owned setup
  file for this workspace; use this package's visible Brain default only when no established file
  exists yet.
- Do not make the app itself the only source of reporting truth. Apps should render data and
  criteria that are saved separately and auditable.

---

## 6. Refresh

Refresh this setup when:

- the customer corrects a report or dashboard
- the trusted saved Motion reports change
- an authoritative source changes
- a weekly report, dashboard, app, tracker, readout, or deck becomes recurring
- a new product, campaign taxonomy, market, or attribution rule becomes important
- the validation surface fails because Runneth picked the wrong source, metric, grouping, or
  evidence shape
- the generated app/report fails the quality floor because labels overflow, media states are unclear,
  metric labels are raw, cards are inconsistent, or caveats are hidden

Append every refresh to `/agent/brain/meta/_changelog.md` by default, or to the established
package/customer changelog if this workspace already uses one.
