---
name: setup-creative-qa
description: >
  Run on "set up creative QA", "set up ad QA", "configure QA", "reconfigure creative QA",
  or first use after install. Interview-driven setup: learns the team's review
  process in plain questions, captures or reverse-engineers their
  naming convention, resolves where assets come from and where feedback goes (Slack, Asana,
  Frame.io, Notion, Drive links, direct upload, or any connected tool), co-QAs recent
  ads with the reviewer to calibrate the rubric, then locks v1 and stands up the intake
  routine.
---

# Setup: Creative QA

Conversational setup. One question at a time, plain language, no technical terms.
The person on the other side is a marketer, not a developer. Never show file paths,
JSON, or API language unless they ask.

The output of this skill is a complete workspace QA config plus rubrics that have
already been validated against the team's own past assets. Nothing goes live on an
untested rubric.

## Scope

All durable state lives at `/agent/brain/creative-qa/<scope>/` where `<scope>` is the
Motion workspaceId (from the system context or `motion workspaces`; for a single-brand
org that reviews across the whole org, use the organizationId). Never invent a slug —
IDs are the only workspace keys the platform resolves consistently:

```
config.json            — reviewer, intake adapter, delivery adapters, naming, cadence, status
rubric-video.md        — video success criteria, analysis prompt, feedback rules, learning notes
rubric-static.md       — static success criteria, analysis prompt, feedback rules, learning notes
naming-convention.md   — the team's file naming spec, with worked examples
training-log.json      — append-only reviewer signals (accepted / rejected / correction / neutral)
state.json             — processed-asset ledger for dedup, pending-feedback queue
rubric-history/        — archived rubric versions
```

## Phase 1 — Learn the process

Ask, one at a time, adapting to answers:

1. "Walk me through how you decide an ad is ready to ship. What happens from the moment
   an editor or creator finishes a draft?"
2. "Who sends you the asset — a creator, a designer, an editor? And who has the final say?"
   The final-say person is the **reviewer of record**; their feedback trains the rubric.
3. "What do you look for? Tell me the last three things you rejected an ad for."
4. Walk their taste dimension by dimension, in their language, skipping anything they
   already covered: pacing and hook timing, how early the product shows up, on-screen
   text rules, how harshly to treat spelling and grammar mistakes, brand and legal
   guidelines, banned or risky claims, CTA rules. Anything they say they don't care
   about stays out of the rubric.
5. "Do you review videos, statics, or both?" Build one rubric per asset type they use.
6. "Do you have an existing QA checklist, rubric, brand guidelines, claims rules, or
   do-not-say list? Share anything you have — paste it or drop files."

Seed each rubric from, in priority order: (a) their imported checklist or rubric,
(b) their historical reviewer feedback (Phase 4 harvests it), (c) the brand-audit bundle
under `/agent/brain/brand-audit/<scope>/` when present, (d) a sensible default. Keep
imported reviewer criteria in their own section that automatic refreshes never rewrite.

Rubrics separate three things per asset type: success criteria (concrete, checkable),
the analysis prompt (evidence capture), and feedback rules (how many comments, tone,
timestamped for video / location-referenced for static).

## Phase 2 — Naming convention

Check the workspace brain and onboarding package for an existing naming convention
before asking. If one exists, confirm it still holds and move on.

If none exists, reverse-engineer it: "Show me three recent file names. What does each
part mean?" Write the spec plus worked examples to `naming-convention.md`. If the team
has no convention and wants one, propose a simple one and confirm.

Renaming the asset to convention is a standard QA output. Record in config whether
Runneth should rename automatically, suggest the name in feedback, or skip naming.

## Phase 3 — Routing (source-agnostic by design)

Two separate questions. Never conflate them.

**Intake — where finished assets appear.** Check the connected integrations first and
suggest before asking cold: if the org runs creator work in Asana, suggest watching the
board; if editors drop links in a Slack channel, suggest scanning it. Supported intake
adapters, any of which may be combined:

- Slack channel scan (asset files or links posted in a channel)
- PM-tool watch: Asana, Notion, Monday, Trello, ClickUp, or similar (status/assignee/board)
- Review-tool links: Frame.io or similar shared in Slack or the PM tool
- Drive/Dropbox links carried inside messages or task comments
- Direct upload in conversation ("QA this")

Every scheduled intake adapter must be deterministic: read the source live, diff against
the processed ledger in `state.json`, and treat a failed read as a failure that alerts the
owner, never as "nothing new". Newness is never eyeballed.

**Delivery — where QA feedback goes.** Ask where they want feedback and how they want to
be notified. Default: post the QA back into the tool where the review already happens
(Asana task comment, Frame.io timestamped comments, the Slack thread), plus an optional
Slack summary tagging the reviewer. Record every destination in config.

Per-platform intake and delivery mechanics live in the review skill's
`references/platform-recipes.md`, with evidence levels per platform. The recipe list is
not the scope: any platform the team names is supported through the no-recipe path there.
If a needed tool is not connected yet, use the standard integration connect flow
(registry app or native connection) before writing the adapter into config. Do not
hand-roll credentials.

## Phase 4 — Co-QA calibration before going live

The trust-builder, and round one of a loop that never stops. Before anything runs on a
schedule:

1. Ask the team to share their 5-10 most recent finished ads (upload or Drive links —
   whatever is easiest for them). If the intake source from Phase 3 makes past reviewer
   feedback cheap to read (for example a PM board with the reviewer's comments on each
   task), harvest it first as extra seed signal; if it is not cheap, skip it without
   ceremony — history is a bonus, never a dependency.
2. Both sides QA the same ads independently: the reviewer their way (a sentence or two
   per ad is enough), Runneth against the draft rubric with real asset analysis.
3. Present side by side: "Here's the feedback I would have given on these. Would this
   have been your feedback?"
4. The reviewer grades each review (agree / disagree / missed something). Fold every
   correction into the rubric. Record all signals in `training-log.json`.
5. Repeat on a fresh small batch for 2-3 rounds, or until agreement is acceptable to
   the reviewer. The rubric locks as v1 only after this pass.

Setup calibration is only the first round: the same loop keeps running live (see
`creative-qa-calibrate`), inheriting the reviewer's judgment from every reaction and
correction so the rubric keeps converging on their taste for as long as the package runs.

If the team has no finished ads to share yet, say so and start live in a supervised mode
where the first 10 live QAs are explicitly framed as training.

## Phase 5 — Lock in and go live

1. Confirm the rubric(s) as v1 with the reviewer. Archive nothing yet; this is v1.
2. Write `config.json` with: scope, reviewer of record (name + platform identity),
   asset types, intake adapters, delivery adapters, naming mode, refresh cadence
   (default: every 10 signals or rejection rate above 30%), owner to alert on failures,
   and status `live`.
3. Stand up the intake routine(s) per the adapters, with the user's explicit confirmation
   of schedule and destinations before creation. If the user has no schedule preference
   or does not answer, default to once daily. Include in every routine prompt: the
   deterministic detection contract, the state-file update step, the skip rules
   (already processed, already human-approved), and the failure-alert rule.
4. Tell the team how to give feedback in one line, and that the rubric refreshes itself
   as they do.

## Reconfiguration

Re-running this skill updates the existing config in place. Confirm what is changing,
never silently reset the training log, rubric history, or processed ledger.
