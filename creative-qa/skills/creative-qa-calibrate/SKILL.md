---
name: creative-qa-calibrate
description: >
  The training loop for Creative QA. Two modes: pre-launch calibration (QA the team's
  next real ads alongside the reviewer until agreement is good) and refresh (fold accumulated
  reviewer signals back into the rubric on the configured cadence, version-bump, and track
  the agreement score toward 90-100%).
  Triggers: "calibrate QA", "backtest the rubric", "refresh the rubric", refresh threshold
  reached (default every 10 signals or rejection rate above 30%).
---

# Creative QA Calibrate

The reviewer of record's judgment is ground truth. Every Runneth review is scored
against it, and the agreement score is the number this loop drives up.

## Collect signals

Revisit delivered reviews queued in `state.json` and read the reviewer's responses in
the source tool and Slack:

| Reviewer response | Signal |
|---|---|
| agree / approved / checkmark / "send it" | accepted |
| "no" / "don't flag this" / "it's a proof" | rejected — Runneth flagged something it shouldn't |
| their own correction or note | human correction — what Runneth missed or got wrong |
| no reply, asset shipped | neutral — no signal on QA quality |

Append each to `training-log.json` (append-only) with asset id, comment, dimension,
and date. Corrections and rejections are the most valuable signal. If most recent
signals are neutral, flag to the reviewer that the loop is running blind and one-tap
reactions are what make it smarter.

## Refresh (cadence: config, default 10 signals or >30% rejection)

1. Gather signals since the last version. Per rubric dimension compute accept rate,
   reject rate, and signal count; require at least 5 signals per dimension before
   drawing a conclusion.
2. Archive the current rubric to `rubric-history/<type>-vN-YYYY-MM-DD.md`.
3. Rewrite the rubric: sharpen criteria the reviewer consistently confirms, soften or
   remove dimensions with high rejection, absorb corrections as new criteria, update
   the analysis prompt. New criteria get adjudicated with the reviewer: permanent
   pass/fail (compliance, claims), situational judgment, or campaign-scoped with an
   expiry note — only permanent pass/fail can hard-block. Move checks between severity
   tiers as responses show: a waved-off flag moves down-tier or out; nothing moves up
   to blocking without the reviewer's explicit confirmation. Never rewrite the
   reviewer-supplied criteria section without their explicit approval.
4. Score the new version against the graded set and log score + trend in the rubric's
   Learning Notes. Target: 90-100% agreement, video and static scored separately.
5. Tell the reviewer in one short message what changed and the new version number.

## Calibration mode (pre-launch)

Same mechanics, run during setup on the team's next real ads: finished ads carry no
training signal, so the team keeps working normally while the draft rubric QAs each new
arrival through the configured intake, clearly marked as calibration. Grade every
review, fold in corrections, and harvest past reviewer feedback from the intake source
when it is cheap to read (a bonus, never a dependency). The rubric locks as v1 after
~10 graded reviews, or earlier if the reviewer calls agreement good enough.
