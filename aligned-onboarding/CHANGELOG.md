# Aligned Onboarding — component changelogs

Maintainer history for the staged instruction docs. This file lives in the repo only — it is
not staged to customer brains. Package-level version history lives in `install-config.json`
(`changelog` array) until the OS-package migration lands, after which both consolidate here.
Entries are newest-first per component.

---

## Account Context Brain (`meta/meta-account-context-brain-onboarding-package.md`)

### v1.27 (July 2026) — patch: answer-register note in "at a glance"

The saved file's "at a glance" section may now carry a one-line answer-register note (how
this team likes their answers), written by the validation loop's register corrections
(validation v1.7). The guard's read-before-performance rule is what makes it load on every
future answer. No new field, no new question — it appears only once a real correction
teaches it.

### v1.26 (July 2026) — required output schema for the fill-in presentation

The fill-in conversation now has one declared structural contract, placed between Steps 1
and 2: three parts in order (opening frame, field sections, closing TLDR), a literal
skeleton, and a pre-send checklist. Structure only — content stays account-specific.
Reconciliations with existing rules: settled fields get no question; the Fields 1–3
consolidation counts as one section; the one-question-per-section default allows two only
for a sanctioned two-beat section (Field 10, when its beats run in this conversation).
Steps 2–4 now point at the schema instead of restating its rules. The schema governs the
one full fill-in presentation; follow-up turns, corrections, and refresh runs are exempt.

### v1.25 (July 2026) — patch: Field 10 wired into the fill-in flow and the saved file

Two gaps from the v1.24 merge closed: the saved-file order now carries a deck-spec section
(written only once Field 10 is confirmed; the validation deck build reads it from
account-context.md), and the fill-in procedure gains Step 5 — once Fields 4, 7, and 9 are
confirmed, offer Field 10's two beats on the spot, or defer them to deck time. No behavior
change to the scope rule: Field 10 still gates the deck, not the question loop.

### v1.24 (July 2026) — Field 10: Reporting structure and marketing calendar (the deck spec)

Added Field 10, synthesized from Fields 4, 7, and 9 once they are confirmed — no new Motion
pull. It solves three root problems: reporting context was scattered across Fields 4, 7, and 9
but never synthesized (Runneth was asking customers to explain their reporting from scratch);
the marketing calendar was embedded in the naming convention data but never surfaced
proactively; and the validation deck had no spec, so the "build the weekly deck" step started
with a blank sheet.

Two beats, one question each: an auto-detected marketing calendar (from the decoder's
campaign-type and launch-date positions, when the account's decoder carries them), then the
auto-synthesized reporting structure with four standard deck sections proposed as a starting
hypothesis (top ads of the period, performance by second dimension, active seasonal campaigns,
breakdown by naming convention dimensions).

**Scope rule: Field 10 gates the deck, not validation.** It is not one of the nine required
interpretation fields — the validation question loop runs without it — but no deck is built
until it is confirmed. If the deck build is reached first, Field 10's two beats run on the
spot. Its saved output feeds the validation deck build directly.

### v1.23 (July 2026) — naming decoder JSON and Field 9 restructure (merged from parallel v1.22 work)

Two changes from live validation QA feedback, authored in parallel with v1.22 and merged here:

**Field 4: Naming convention now requires an operational decoder file and LP reference decode.**
The confirmed decode is written to `/agent/brain/meta/naming-decoder.json` (typed positions:
`segment_filter` / `context_only` / `unique_id` / `metadata_do_not_filter`, each mapped to its
Meta query field), indexed in `/agent/INDEX.md`, and referenced from `account-context.md` — not
embedded in it. Field 4 remains the interpretation owner; the decoder is its operational
appendix. Added the landing-page reference decode (second-to-last position, formats RLP / LP /
CAP, marked do-not-filter — it often contains the same strings as content program codes, which
causes false positives under bare substring matching) and the filter translation rules: wrap
creative identity values in underscores when filtering `adName` (`_MKBHD_` not `MKBHD`), and use
`adsetName` / `campaignName` for ad set and campaign requests, never `adName`.

**Field 9: restructured around four captures with a winner/cut scope rule.**
Ranking metric, CPA target (commentary, not a filter), winner/cut criteria (applied only when a
user explicitly asks a winner/cut question — all other queries show the data as asked), and
default reporting window. Spend tiers gained the operational usage rule: rank by the attribution
CPA metric ascending within the requested window first, apply tier labels after ranking based on
lifetime spend — tiers are classification labels, not pre-filters. Supersedes v1.21's
always-ask spend-floor script: the floor is still captured and an unconfirmed floor still flags
every winner/cut answer, but it no longer blocks with a mandatory verbatim note.

### v1.22 (July 2026) — patch: Field 4 captures where product names live

**Field 4: product-name placement is now detected and confirmed.**
The auto-pull checks whether product/concept tokens found in ad names also appear in campaign
and ad set names, and the confirm loop asks which level a bare "[product] ads" request should
filter. The confirmed default is saved as its own field line. This closes a live failure mode:
treating a product name as a campaign reference by default when the account encodes products in
ad names (or vice versa). Until confirmed, the Data-Query Guide's name-level rules default to
`adName` with includes matching.

### v1.21 (July 2026) — patch: spend confidence floor made mandatory

One change from third live run feedback:

**Field 9: Spend confidence floor is now a required, non-skippable ask.**
Added explicit instruction to always ask for the spend confidence floor, ask whether it varies
by product line or campaign type, and if the answer is not given, write it into the
`## Still confirming` section of the saved brain file with a specific note that blocks any
winner or cut call until it is confirmed. A missing spend floor makes the campaign-median
benchmark unactionable — any creative can look like a winner on $50 of spend.

### v1.2 (July 2026) — updated from second live run feedback

Six changes based on feedback from the second live onboarding run, plus two refinements:

**1. Field 1: Third-party attribution tool is source of truth, not a tie-breaker**
When an attribution tool returns real data, it wins. Ask which specific metric keys from that
tool are returning real values (resolved via metric-reference for labels), and surface those
exact keys in the question — not generic category descriptions. The saved brain file must
explicitly name the attribution tool as the source of truth.

**2. Fields 1–3 consolidation rule when attribution tool is confirmed**
When an attribution tool is present, fields 1, 2, and 3 collapse into one question about
which of its returning metrics the team judges on. Gotcha observations still surface as
observations only. In-platform Meta metrics are never proposed as alternatives.

**3. Field 2: Skip Meta pixel event hierarchy when attribution tool is confirmed**
North-star question moves to the attribution tool's metrics. Supplemental Meta signal is
creative engagement only (thumbstop, CTR, hold rate).

**4. Field 3: Remove "is this intentional?" framing universally; add gotcha definition and never-flag list**
Sub-1 ROAS: if attribution tool present, note it as observation only. If not, ask what metric
they are hitting a target against. Added explicit definition of what qualifies as a gotcha
(unexpected, non-obvious, would surprise a solid Meta practitioner) and a "never flag these"
list: video metrics on images, catalog fields missing, null names on flex/catalog formats,
zero conversions on non-conversion objectives, null for unrequested table KPIs, sub-1 ROAS
when attribution tool is present.

**5. Field 8: Broaden the creative metrics question**
Open question: "What's your goal on thumbstop, and are there other creative metrics you judge
on?" Anchor in pulled averages for each metric surfaced.

**6. Field 9: Add target hierarchy specificity and data-anchored probe**
Inspect pulled CPA variation before asking. Surface material variation anchored in the data.
Capture targets by scope (product, funnel stage, campaign type) when they differ.

### v1.1 (July 2026) — updated from first live run

Three changes based on feedback from the first live onboarding run:

**1. Opening frame added (Step 2, new)**
The original package had no opening frame. Every fill-in output must now open with a "What do
you know about me?" section before the nine fields. Two beats: brand story from
`motion brand-context` (not inferred from ad names), then Meta account findings. 4–6 sentences.

**2. Brand context pull added as Step 0 (required)**
`motion brand-context` is now a required first step before any field pulls. The original package
did not specify this, leading to brand identity being inferred from ad names. This is now a
hard requirement — the opening frame must come from brand context.

**3. Sources of truth — third-party attribution rule (Field 1)**
The original package did not specify what to do when a third-party attribution tool returns null.
The new rule: if it returns null, do not mention the tool by name. Ask only whether Meta is the
source of truth or whether an attribution platform should be integrated. If it returns real data,
name it and ask which tool wins when numbers disagree.

**4. Closing TLDR added (Step 4, new)**
The original package had no closing TLDR requirement. Every fill-in output must now end with a
numbered list of every open question, one line each, with a "Just answer what you know" prompt.
This is the most important UX moment — the customer should not have to scroll back through nine
sections to find their questions.

---

## Meta Validation (`meta/meta-validation-onboarding-package.md`)

### v1.8 (July 2026) — field-audit fixes: autosave, handoff, Q4 rework
- validation.md is written incrementally — after every confirmed answer and correction, never
  as a closing step — so an interrupted validation resumes at the first unconfirmed question
  when the gate re-fires, instead of restarting.
- MVCE flipping on now ends with an explicit handoff: check the Knoweth organize guard blocks
  are merged and point at that package. Closes the gap where onboarding stalled after
  validation with no baton pass.
- Starter question 4 reworded to the neutral "what's ready to scale?" ("graduate" was one
  team's dialect); the account's own transition word is captured with Fields 6/9 and used
  when it exists. Q4 also gains the single-pool fallback: when Field 7 shows one shared
  creative pool, answer at the campaign level and say so — deflecting is the only wrong
  answer. The dependency note reframes "graduation rule" as the testing-to-scaling rule.

### v1.7 (July 2026) — register corrections
- New loop rule: how an answer is pitched is a correctable read, like any fact. "I just
  wanted the table" adjusts the current conversation, and a standing preference is written as
  a one-line answer-register note in account-context.md's "at a glance" section, where the
  account-context guard loads it before every future performance answer. Companion to the
  Data-Query Guide's answering-posture guidance (judgment, not rules: is the answer already
  in the data, or does it need a judgment the data can't make alone?).

### v1.6 (July 2026) — show the creatives
- New loop rule: answers referencing specific creatives present them as a gallery (media from
  the Cacheth record's `url`, names decoded through the naming decoder) per the Data-Query
  Guide's presenting-creatives contract. Raw delimited ad names are filter keys, not labels.

### v1.5 (July 2026) — deck build reads Field 10 (the deck spec)
- The deck is now gated on Account Context Field 10 (reporting structure and marketing
  calendar): no deck without a confirmed spec. Step 3 pre-fills structure, cadence, and
  exclusions from it and stops re-gathering sections, snapshots, and date controls; if
  Field 10 is unconfirmed at deck time, its two beats run on the spot (two questions, no new
  pull).
- The deck-first door leads with the ready spec when Field 10 is confirmed, asking only for a
  visual look-and-feel reference.
- Questions 2 and 4 anchor in the confirmed reporting dimensions and the marketing calendar
  when Field 10 is confirmed, instead of generic phrasing.
- Validation start is unchanged: the question loop still gates on the nine required fields and
  cache sync only. A questions-only customer never needs Field 10; MVCE still requires the
  approved deck.

### v1.4 (July 2026) — name-level probe
- Starter question 5 added: "Show me all our [product] ads" with a real product name from the
  account. Probes whether Runneth filters the right name level (campaign vs ad set vs ad)
  instead of defaulting product names to campaign references.
- Show-the-work rule now includes which name level was filtered, so a wrong-level read is
  visible and correctable in the loop.

### v1.3 (July 2026) — show the work
- New loop rule: each answer states which filter and signal it used (naming decode, Cacheth tags,
  live metrics) and what it couldn't confirm, so the customer can correct the read, not just the
  result.

### v1.2 (July 2026) — creative content layer replaces the Creative Corpus
- The second prerequisite and the validation gate now check that the workspace's creatives are in
  Cacheth (surfaced through Knoweth), not that per-creative files exist under
  `/agent/brain/meta/creatives/`. Nothing in the package writes per-creative files to the brain.
- Guard block bumped to v2 accordingly; answers and the weekly deck read the creative content
  layer via Knoweth injection or the motion cache CLI.

### v1.1 (July 2026) — added lock-in step
- New Step 4 "Lock it in": deck approval, refresh routine, Slack connection. Onboarding is not
  complete until all three are done.
- MVCE gate expanded from 3 conditions to 5: added deck approval, refresh routine, Slack
  connection.
- Validation record now captures `weekly_deck_approved`, `refresh_routine_id`,
  `refresh_cadence`, and `slack_connected`.
- Guard block updated to reflect the five-condition completion gate.

### v1.0 (July 2026) — initial draft
- New third part of the Meta onboarding package: turns "connected + trained" into "validated."
- Meta-only, no competitors. Runneth proposes the starter questions; the customer confirms or adds.
- Two entry doors (deck-first or questions-first) that converge on the same answer-and-confirm loop.
- The loop heals the Account Context Brain on every correction.
- The weekly deck is the MVCE proof artifact, built on the report component library.
- Flags graduation as a required Account Context Brain field the deck depends on.

---

## Knoweth Organize (`knoweth/knoweth-organize-onboarding-package.md`)

### v1.1 (July 2026) — gate 2 file-based fallback
- When VoC data landed without a voc-sync routine, gate 2 can be verified directly from the
  per-platform files (oldest/newest item dates spanning the pull window), recorded as a
  file-based check, with an offer to set up the missing sync routine. Closes the dead-end
  where gate 2 waited forever for a routine-history report that would never exist.

### v1.0 (July 2026) — final
- Guard 1 names its check sources: the fields-confirmed count in account-context.md's "File metadata" block (gate 1) and `routine history --id <routine-id>` for the backfill coverage report (gate 2).
- Guard 2 exempts raw VoC files from save-tagging - their format is owned by the voc-data-pull skill; facet vocabulary lives in the compiled pages that cite them.
- Repo-meta packaging note removed from the config section.

### v0.5 (July 2026) — naming decoder JSON (ACB v1.23)
- The confirmed Meta naming decode now has an operational output: `/agent/brain/meta/naming-decoder.json`, written and owned by Account Context Field 4 (typed positions, query fields, filter patterns). The answer standard's read-the-decode-first rule, the routing list, the indexed-content list, and the skeleton all point to it alongside `account-context.md`. This is the Meta ad-name decoder, distinct from the brain-wide tag vocabulary + naming decoder at `/agent/brain/_tag-vocabulary.md`.

### v0.4 (July 2026) — answer standard upgraded
- Filter rules: read the naming decode (`account-context.md` Field 4, its only home) before any name-based filter; match the signal to the question (structural questions -> campaign/ad-set names via the decode; creative questions -> Cacheth tags and content); cross-check when both carry the signal and say so when they disagree.
- Performance and VoC framed as one system (performance shows what is winning, VoC explains why, ad comments connect the two), with a routing example.
- Show-the-work standard: analytical answers state the filter applied, the signal read (with Cacheth per-layer freshness when it matters), and what could not be confirmed.

### v0.3 (July 2026) — review notes resolved
- VoC raw format, folders, and schema now defer to the voc-data-pull skill (one owner per fact); front-matter applies to compiled pages only; the compiled `<platform>-context.md` moved out of the items-only platform folders.
- Guard 1 (v2): `/agent/brain/_tag-vocabulary.md` existence is the durable done-marker (no double-fire); "content landed" requires the VoC backfill's coverage-complete report, not file existence.
- Cacheth is an assumed primitive: the deployment-dependent "files by default, Cacheth where flagged in" mode is removed. Nothing in the package writes per-creative files; ones in the brain exist only by a person's explicit ask (dated snapshots; the cache is the retrieval source of truth), and the sweep asks the person before archiving unknown-provenance files rather than moving them silently (gotchas, repair checklist, and the Guard 2 (v2) maintenance sweep). Counteth is NOT assumed: performance metrics are pulled live via the motion CLI (per the Motion CLI Data-Query Guide), never stored.
- Run order single-sourced in the package README; stale facts fixed (VoC setup is manual; the manifest is `package.json`).
- Verified: the lane model matches agent-builder's `resolveKnowethReadLanes`; the family-lane forward path is gated on it layering configured lanes (PDEC-9225).
- Made explicit that the winner metric / interpretation always comes from `account-context.md` (per the account-context guard), never from Motion workspace settings the CLI can return (answer standard, worked example).

### v0.2 (July 2026) — corrected to the real retrieval wiring
- Traced the harness: the requested read set is `[user:<userId>, project:<workspaceId>, global]`; `project` is the workspace, and family/custom lanes are not queried today.
- Reframed the lane model (section 4) to: everything in `global` + tags today; `user:` for isolation; workspace project is automatic; family lanes are a documented forward path gated on a harness change (option B).
- Guard 1 renamed lanes-setup -> organize (tags + naming decoder, not family lanes).
- Positioned as the last setup step of the combined run and the first line of ongoing maintenance; sequencing of lanes vs validation flagged for the package owner.
- Body (two-layer model, retrieval, lanes, front-matter, save routing, self-organization, packaging) unchanged.

### v0.1 (July 2026) — first draft aligned to the packages
- Reframed the front to the Aligned Onboarding house style: version, one-line model, activation guard blocks, hard-gate prerequisites, scope, persistence, honesty section.
- Two sentinel guard blocks: `runneth:knoweth-organize` (post-questions organize) and `runneth:knoweth-brain` (standing save + maintenance).
