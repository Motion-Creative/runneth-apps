---
name: setup-creative-qa
description: >
  Interview-driven setup for the Creative QA package. Learns the team's review process in
  plain questions, captures or reverse-engineers their naming convention, resolves where
  assets come from and where feedback goes (source-agnostic: Slack, Asana, Frame.io, Notion,
  Monday, Trello, Drive links, direct upload, or any connected tool), backtests the rubric
  on their last 10 assets, and only then locks v1 and stands up the intake routine.
  Triggers: "set up creative QA", "set up ad QA", "configure QA", "reconfigure creative QA",
  first use after package install.
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
workspace slug (or org slug for single-brand orgs):

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
4. "Do you review videos, statics, or both?" Build one rubric per asset type they use.
5. "Do you have an existing QA checklist, rubric, brand guidelines, claims rules, or
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

## Phase 4 — Backtest before going live

The trust-builder. Before anything runs on a schedule:

1. Pull the team's last ~10 reviewed assets from their intake source, including the
   reviewer's real comments and verdicts where available.
2. Where the reviewer's feedback references specific moments, analyze the actual assets,
   not just the comment text.
3. Run each asset through the draft rubric and present: "Here's the feedback I would have
   given on these. Would this have been your feedback?"
4. The reviewer grades each review (agree / disagree / missed something). Fold every
   correction into the rubric. Record all signals in `training-log.json`.
5. Repeat on a second small batch if agreement is clearly low.

If no historical assets exist, say so and start live in a supervised mode where the first
10 live QAs are explicitly framed as training.

## Phase 5 — Lock in and go live

1. Confirm the rubric(s) as v1 with the reviewer. Archive nothing yet; this is v1.
2. Write `config.json` with: scope, reviewer of record (name + platform identity),
   asset types, intake adapters, delivery adapters, naming mode, refresh cadence
   (default: every 10 signals or rejection rate above 30%), owner to alert on failures,
   and status `live`.
3. Stand up the intake routine(s) per the adapters, with the user's explicit confirmation
   of schedule and destinations before creation. Include in every routine prompt: the
   deterministic detection contract, the state-file update step, the skip rules
   (already processed, already human-approved), and the failure-alert rule.
4. Tell the team how to give feedback in one line, and that the rubric refreshes itself
   as they do.

## Reconfiguration

Re-running this skill updates the existing config in place. Confirm what is changing,
never silently reset the training log, rubric history, or processed ledger.
