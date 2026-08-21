---
name: setup-creative-qa
description: >
  Run on "set up creative QA", "set up ad QA", "configure QA", "reconfigure creative QA",
  or first use after install. Interview-driven setup: learns the team's review
  process in plain questions, captures or reverse-engineers their
  naming convention, resolves where assets come from and where feedback goes (Slack, Asana,
  Frame.io, Notion, Drive links, direct upload, or any connected tool), calibrates the
  rubric on the team's next real ads alongside the reviewer, then locks v1 and goes
  live.
---

# Setup: Creative QA

Direct questions, friendly tone. One question at a time, plain language, no technical
terms. The person on the other side is a marketer, not a developer. Never show file
paths, JSON, or API language unless they ask.

The output of this skill is a complete workspace QA config plus rubrics that have
already been validated against the team's own past assets. Nothing goes live on an
untested rubric.

## Scope

All durable state lives at `/agent/brain/creative-qa/<scope>/` where `<scope>` is the
Motion workspaceId (from the system context or `motion workspaces`; for a single-brand
org that reviews across the whole org, use the organizationId). Never invent a slug —
IDs are the only workspace keys the platform resolves consistently:

```
config.json            — reviewer, intake (trigger + approved signal), delivery, naming, escalation, cadence, status
rubric-video.md        — video success criteria, analysis prompt, feedback rules, learning notes
rubric-static.md       — static success criteria, analysis prompt, feedback rules, learning notes
naming-convention.md   — the team's file naming spec, with worked examples
training-log.json      — append-only reviewer signals (accepted / rejected / correction / neutral)
state.json             — processed-asset ledger for dedup, pending-feedback queue
rubric-history/        — archived rubric versions
```

## Phase 1 — Learn what can't be guessed

Discovery exists to nail the things feedback can never teach: plumbing (if it's wrong
the agent simply doesn't run), authority (wrong guesses are politically expensive), and
hard constraints (a missed never-event that ships is an incident, not a learning
opportunity). Everything else is deliberately left to the calibration loop.

Ask, one at a time, adapting to answers:

1. "Walk me through your review process: where do new ads show up, what do you check,
   and what happens before one goes live?" One answer seeds the process map, the intake
   location, and the first taste dimensions at once. Ask them to paste the exact board
   or channel link — mapping starts from the real thing, not a description of it.
2. "Who sends you the ads, and who has final say on whether one ships?" The final-say
   person is the **reviewer of record**; their feedback trains the rubric. Capture
   their identity in the source tool too (handle, tag, or account) — delivery tagging
   and skip rules need it.
3. "When I find a problem, what should I ping you about right away, and what should
   just go in the written feedback?" Record the escalation boundary in config.
4. "Has an ad ever gone live with a mistake? What happened?" The answer sets the
   initial conservatism posture — a team that has shipped a compliance mistake gets a
   stricter default than one that has never been burned. Conservatism can be calibrated
   down later; it cannot be calibrated up after a bad approval has already leaked.
5. "What are your dealbreakers — what always gets an ad sent back?" These are
   hard-fail criteria from day one.
6. Walk the remaining taste dimensions briefly, in their language, skipping anything
   already covered: pacing and hook timing, how early the product shows up, on-screen
   text rules, spelling and grammar, CTA rules. These seed rubric criteria whose
   severity starts conservative and is tuned by the loop — do not interrogate edge
   cases here.
7. "Do you review videos, statics, or both?" Build one rubric per asset type; this
   also determines what the agent must be able to ingest.
8. "Are any of these submissions you can't edit — creator or partner work that's
   approve/reject only?" Editable internal assets get fix notes; uneditable submissions
   get approve/reject with a one-line reason. Also ask for platform context the rubric
   should not flag (for example a missing CTA the ad platform adds itself). Record
   content-type rules in config.
9. "Do you have any written guidelines — brand rules, claims or legal restrictions, a
   do-not-say list, a QA checklist? Share whatever you have and I'll build from it."
   Anything counts — a checklist, a per-product spec sheet, even a single slide.
   Then: "Does anyone's taste override everything — a founder or brand lead? What are
   their known vetoes?" Written rules and named vetoes are never-events.

Expect process questions to be answered easily and the rubric to arrive incomplete:
in every production setup, the rubric came from the team's artifacts plus their
historical feedback plus adjudication during calibration — never from the interview
alone. The interview nails plumbing and authority; calibration builds taste.

### Deliberately not asked — the loop calibrates these

Do not burn interview time on things the reviewer will naturally see in output and
correct: severity tiering (start conservative — only never-events block; a reviewer's
"that's fine, don't flag it" moves a check down-tier), the judgment-layer checks that
only surface as disagreements, feedback tone and phrasing (seed from anything they
share, refine as they edit), how nitpicky to be per format, which checks weigh most in
practice, turnaround expectations, and vocabulary (adopt their words for hook, end
card, claim as they appear). Stated dealbreakers and revealed dealbreakers differ; the
loop learns the real ones.

Seed each rubric from, in priority order: (a) their imported checklist or rubric,
(b) their historical reviewer feedback (Phase 4 harvests it), (c) the brand-audit bundle
under `/agent/brain/brand-audit/<scope>/` when present, (d) a sensible default. Keep
imported reviewer criteria in their own section that automatic refreshes never rewrite.

Rubrics separate three things per asset type: success criteria (concrete, checkable),
the analysis prompt (evidence capture), and feedback rules (how many comments, tone,
timestamped for video / location-referenced for static).

## Phase 2 — Naming convention

This package normally runs after Meta onboarding, so the convention should already be
on file. Read, in order:

1. `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json` — the operational
   naming decoder written by Meta onboarding.
2. The naming-conventions section of
   `/agent/brain/<workspace>/data-sources/meta/account-context.md`.

When found, confirm in one line that the same scheme applies to the creative files sent
for review, and move on — do not re-interview. Only when neither exists,
reverse-engineer it: "Show me three recent file names. What does each part mean?" If
the team has no convention and wants one, propose a simple one and confirm.

Either way, write the spec plus worked examples to `naming-convention.md` in this
package's scope folder, so QA passes never depend on another package's files at review
time.

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

Three plumbing facts must be captured explicitly, because a wrong guess means the agent
silently does nothing: the **trigger condition** (what exactly "new ad waiting" looks
like — a file posted, a status change, an assignee set), the **asset carrier** (which
field, comment, or attachment actually holds the file — a Drive link in a comment, a
custom field, the message upload itself), and the **approved-state signal** (how an
already-approved ad is marked — a reaction, a status, a folder, a name suffix). All
three go in config; the review skill skips anything already carrying the approved
signal.

**Delivery — where QA feedback goes.** Ask where they want feedback and how they want to
be notified. Default: post the QA back into the tool where the review already happens
(Asana task comment, Frame.io timestamped comments, the Slack thread), plus an optional
Slack summary tagging the reviewer. Record every destination in config, along with the
notification style and the feedback-out phrasing every summary ends with (default:
"reply no if this shouldn't have editor comments").

Per-platform intake and delivery mechanics live in the review skill's
`references/platform-recipes.md`, with evidence levels per platform. The recipe list is
not the scope: any platform the team names is supported through the no-recipe path there.
If a needed tool is not connected yet, use the standard integration connect flow
(registry app or native connection) before writing the adapter into config. Do not
hand-roll credentials.

## Phase 4 — Live calibration before lock-in

The trust-builder, and round one of a loop that never stops. Finished ads carry no
training signal — they were already approved — so calibration runs on the team's next
real ads, flowing through the intake configured in Phase 3:

1. With the user's explicit confirmation, stand up the intake watch now with config
   status `calibrating`, so the real pipeline is exercised end to end before go-live.
2. Tell the team calibration is on: drop new ads wherever they normally land (the
   configured intake) and review them exactly as they normally would — Runneth will QA
   each one alongside them, clearly marked as calibration.
3. QA each new arrival with the draft rubric per `creative-qa-review`, delivered to the
   configured destinations.
4. The reviewer grades each review (agree / disagree / missed something) — their normal
   review comments count as signal too. Fold every correction into the rubric. Record
   all signals in `training-log.json`.
5. Adjudicate every ambiguous criterion with the reviewer before it hardens: is it
   permanent pass/fail (compliance, claims), situational judgment (context decides),
   or campaign-scoped (expires with the campaign)? Only permanent pass/fail criteria
   can hard-block; campaign-scoped ones carry an expiry note in the rubric.
6. Ask how far back their review history goes. If the intake source holds past
   reviewer feedback that is cheap to read (for example a PM board with comments on
   each task), harvest it as extra seed signal — and analyze the actual assets
   alongside the comments, never the comment text alone. A bonus, never a dependency.
7. Lock the rubric as v1 once ~10 reviews are graded, or earlier if the reviewer says
   agreement is good enough. Until then the package stays in calibration mode, never
   unsupervised.

Setup calibration is only the first round: the same loop keeps running live (see
`creative-qa-calibrate`), inheriting the reviewer's judgment from every reaction and
correction so the rubric keeps converging on their taste for as long as the package runs.

## Phase 5 — Lock in and go live

1. Confirm the rubric(s) as v1 with the reviewer. Archive nothing yet; this is v1.
2. Write `config.json` with: scope, reviewer of record (name + platform identity),
   asset types, intake adapters (each with its trigger condition, asset carrier, and
   approved-state signal), delivery adapters (with notification style and feedback-out
   phrasing), content-type rules (editable vs approve/reject-only), naming mode,
   escalation boundary, initial conservatism posture, refresh cadence (default: every
   10 signals or rejection rate above 30%), owner to alert on failures, and status
   flipped from `calibrating` to `live`.
3. The intake routine(s) normally already exist from Phase 4 calibration — confirm the
   schedule still suits and update in place rather than recreate. If calibration ran
   without a watch, stand up the routine(s) now with the user's explicit confirmation of
   schedule and destinations. Either way: default to once daily when the user has no
   schedule preference or does not answer, and include in every routine prompt the
   deterministic detection contract, the state-file update step, the skip rules
   (already processed, already human-approved), and the failure-alert rule.
4. Tell the team how to give feedback in one line, and that the rubric refreshes itself
   as they do.

## Reconfiguration

Re-running this skill updates the existing config in place. Confirm what is changing,
never silently reset the training log, rubric history, or processed ledger.
