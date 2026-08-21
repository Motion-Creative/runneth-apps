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

Direct questions, friendly tone. Plain language, no technical terms — and prefer words
from a creative strategist's vocabulary: say "guidelines" or "grading criteria" rather
than "rubric" in anything user-facing (files keep their internal names). The person on
the other side is a marketer, not a developer. Never show file paths, JSON, or API
language unless they ask.

Deliver the gap questions as **one message grouped into short bold sections**, each
section a bolded header with its questions as bullets beneath it — always this shape:

```
**Where assets live**
- Where do new ads show up for review?
- Drop the link to that exact board or channel.

**Who reviews**
- Who sends you the ads, and who has final say on whether one ships? ("It depends
  who briefed it" is fine — just name the people and the rule.)

**What you check**
- What do you check before approving an ad?
- What are the most common reasons an ad gets sent back?
- Do you review videos, statics, or both?
- Anything specific on pacing or hook timing, how early the product shows up,
  on-screen text, spelling, CTA rules?

Answer however is easiest — type it out, paste screenshots, or send one voice note
covering everything. I'll follow up only on whatever's missing.
```

Drop sections the artifacts already answered (confirm those in a line instead); never
deliver the questions as prose paragraphs or one at a time.

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

## Phase 1 — Artifacts first, then the gaps

Discovery exists to nail the things feedback can never teach: plumbing (if it's wrong
the agent simply doesn't run), authority (wrong guesses are politically expensive), and
hard constraints (a missed never-event that ships is an incident). Everything else is
deliberately left to the calibration loop — so keep the interview short.

**Gather before asking.** Before the first question:

1. Scan this conversation and recent workspace context for existing QA signal: review
   feedback, rejection notes, guidelines, complaints about ads that shipped wrong.
2. Check the workspace brain for what other packages already captured — brand-audit
   bundle, Meta onboarding account context, claims rules.
3. Check the connected integrations and the workspace's integration notes for where
   creative work already lives (a PM tool, Slack channels, Drive, a review tool) so the
   intake question can arrive as a suggestion, not a cold ask.
4. Open with one question: "Do you have any guidelines or QA notes written down
   anywhere — brand rules, claims or legal restrictions, a do-not-say list, a
   checklist? Share whatever you have and I'll build from it, so I can check every ad
   against the same rules you do." Anything counts — a checklist, a per-product spec
   sheet, even a single slide.

Build a draft picture from all of that, then send **only the questions the artifacts
left open**, batched into one sectioned message. Never re-ask something already
answered — confirm it instead ("sounds like X has final say — right?").

**The question bank** (skip whatever is already known):

- Intake: "Where do new ads show up for review?" When the integration map already
  hints at the answer, lead with the suggestion instead ("I can see Asana is connected
  — is that where finished ads land?"). Either way, ask them to paste the exact board
  or channel link — mapping starts from the real thing, not a description of it.
- Review criteria: "What do you check before approving an ad?" Seeds the process map
  and the first taste dimensions.
- Authority: "Who sends you the ads, and who has final say on whether one ships?"
  "It depends" is a normal answer: config accepts several **reviewers of record** plus
  the resolution rule ("whoever briefed the ad"), and any listed reviewer's feedback
  counts as training signal. Capture each reviewer's identity in the source tool
  (handle, tag, or account) — delivery tagging and skip rules need it.
- Dealbreakers: "What are the most common reasons an ad gets sent back?" The recurring
  ones become hard-fail criteria from day one.
- Formats, grouped with the check questions: "Do you review videos, statics, or both?"
  One rubric per asset type.
- Taste dimensions not yet covered, briefly, in their language: pacing and hook timing,
  how early the product shows up, on-screen text rules, spelling and grammar, CTA
  rules. Severity starts strict and the loop tunes it — do not interrogate edge cases.

Expect the artifacts plus a handful of gap questions to cover plumbing and authority,
and the rubric to still arrive incomplete: in every production setup it was built from
artifacts plus historical feedback plus adjudication during calibration — never from
the interview alone.

### Deliberately not asked — the loop calibrates these

Do not burn interview time on things the reviewer will naturally see in output and
correct: strictness (always start strict — a bad approval that leaks cannot be
calibrated back, so calibration only ever loosens), severity tiering (a reviewer's
"that's fine, don't flag it" moves a check down-tier), content-type rules (default:
every asset gets fix notes; when some submissions turn out to be approve/reject-only —
creator or partner work that can't be edited — the reviewer will say so and it lands
in config), platform context not to flag (surfaces as waved-off flags), the escalation
boundary
(default: only never-events interrupt the reviewer; everything else rides in the
written feedback — tune from which flags they act on), the judgment-layer checks that
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

Never proactively offer to build an app, dashboard, or new surface for QA intake or
delivery — this package leans heavily on living in the tools the team already uses
(their PM tool, review tool like Frame.io, Drive, or Slack). If the user explicitly
asks for an app, build it; just never steer them there.

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
2. Write `config.json` with: scope, reviewer(s) of record (names + platform
   identities, plus the resolution rule when the reviewer varies per ad),
   asset types, intake adapters (each with its trigger condition, asset carrier, and
   approved-state signal), delivery adapters (with notification style and feedback-out
   phrasing), content-type rules (editable vs approve/reject-only), naming mode,
   escalation rule (default: interrupt only for never-events), refresh cadence
   (default: every 10 signals or rejection rate above 30%), owner to alert on failures,
   and status flipped from `calibrating` to `live`.
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
