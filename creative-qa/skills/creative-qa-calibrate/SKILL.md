---
name: creative-qa-calibrate
description: >
  The training loop for Creative QA. Two modes: backtest (grade the draft rubric against
  the team's last ~10 reviewed assets before going live) and refresh (fold accumulated
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
   the analysis prompt. Never rewrite the reviewer-supplied criteria section without
   their explicit approval.
4. Score the new version against the graded set and log score + trend in the rubric's
   Learning Notes. Target: 90-100% agreement, video and static scored separately.
5. Tell the reviewer in one short message what changed and the new version number.

## Backtest mode (pre-launch)

Same mechanics, run against historical assets: pull the last ~10 reviewed assets and the
reviewer's real feedback, QA each with the draft rubric, present "would this have been
your feedback?", grade, fold in corrections, and repeat on a second batch if agreement
is clearly low. The rubric locks as v1 only after this pass.
