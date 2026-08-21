---
name: creative-qa-review
description: >
  Run on "QA this", "review this ad", "is this ready", an asset shared for review, or a
  scheduled intake run. One QA pass on one ad asset (video or static) against the
  workspace's trained rubric: deterministic checks first (naming, placeholders, banned
  claims, spec, dedup), AI checks second (content vs rubric, copy spelling, reference
  fidelity). Produces a verdict plus 3-6 comments, renames to convention when configured,
  and delivers feedback to the configured destinations. Source-agnostic.
---

# Creative QA Review

## Step 0 — Load context

Read, in order:
1. `/agent/brain/creative-qa/<scope>/config.json` — if missing, hand off to `setup-creative-qa`.
2. The matching rubric (`rubric-video.md` or `rubric-static.md`).
3. `naming-convention.md` when naming mode is on.
4. `state.json` — skip any asset already processed or already human-approved
   (approval reaction/comment from the reviewer of record in the source tool).

## Step 1 — Acquire the asset

Read `references/platform-recipes.md` in this skill folder for the source platform's
intake mechanics and evidence level. A platform with no recipe is still in scope through
the no-recipe path defined there; a stale recipe never blocks a pull.

Resolve the asset from wherever it lives: download the file from the link (Drive,
review tool, DAM, Slack file), or use the uploaded file directly. Downloads must land
in the conversation's `./uploads` directory — `google drive download` and
`slack download` already put them there — because media analysis can only read files
there. Delete downloaded files when the pass completes. If acquisition fails, report
the failure to the configured owner; never mark the asset processed.

## Step 2 — Deterministic gates (hard checks, before any AI judgment)

Run every gate that applies; each failure becomes a comment, and hard failures set
the verdict floor:

- **Placeholder leak:** any unresolved bracket token or template word in on-asset copy.
- **Banned claims:** case-insensitive scan of all available copy against the rubric's
  do-not-say list (global medical/drug-style phrases plus workspace-specific bans),
  honoring the allow list so product names never false-fire.
- **Spec:** aspect ratio, dimensions, duration bounds, export requirements from the rubric.
- **Naming:** does the current file name match `naming-convention.md`? Build the correct
  name when it does not.
- **Dedup:** confirm the asset is not already in the processed ledger.

## Step 3 — Evidence capture (AI, graded against the rubric)

- **Video:** analyze with
  `motion analyze-media --filename <name> --prompt "<rubric analysis prompt>"`
  (video files only, file must be in `./uploads`, max 50 files per call).
  Capture transcript, on-screen text inventory, scene/cut structure, hook window, audio.
- **Static:** read the image file directly (multimodal file read; `analyze-media` is
  video-only) against the rubric's analysis prompt. Capture full text inventory,
  hierarchy, CTA, logo, safe zones.
- **Copy spelling:** transcribe every word and number exactly as rendered; any
  misspelling is a hard fail.
- **Reference fidelity (when the workspace stores product reference photos):** grade the
  render against the references — product accuracy, label/fine-print legibility, and an
  AI-artifact check with forced binary output. Never grade fidelity against a text
  description when references exist.

Normalize model outputs before deciding: PASS/FAIL strings and true/false booleans are
equivalent and must be coerced to one form so a boolean can never slip past a string check.

## Step 4 — Verdict and comments

- **HARD_FAIL** — banned claim, placeholder leak, wrong product, copy misspelling,
  confirmed AI artifact, or spec violation the platform will reject.
- **SOFT_FAIL** — real issues worth fixing that a human could still waive.
- **PASS** — ships as-is (naming fix alone does not block a PASS).

Severity starts conservative and is tuned by the loop: hard constraints (banned claims,
legal rules, named vetoes, and the other HARD_FAIL causes) block from day one; every
other check only flags (SOFT_FAIL at most) until the reviewer has confirmed it matters.
A check never moves up to blocking without their explicit confirmation.

Write 3-6 comments max, most important first, per the rubric's feedback rules:
timestamped for video, location-referenced for static. Each comment states the issue,
the evidence, and the fix. Respect content-type rules in config: editable internal
assets get fix notes; partner/creator submissions that cannot be edited get
approve/reject with a one-line reason.

## Step 5 — Naming

Per config: rename the file to convention (or attach the corrected name to the feedback).
The proposed name is part of the QA output either way.

## Step 6 — Deliver

Post to every configured destination: the source tool first (task comment, review-tool
comments, thread reply), then the Slack summary tagging the reviewer of record. End the
summary with the standing out: a one-line way for the reviewer to reject the review
itself (for example "reply no if this shouldn't have editor comments"), because that
reply is training signal.

## Step 7 — Record

Write one unified QA record per `templates/qa-record.md` into `state.json`: verdict,
gate results, comment list, destination message ids, and the awaiting-feedback flag. Append nothing to the training log
yet; signals are collected when the reviewer responds (see `creative-qa-calibrate`).

If the count of unprocessed signals in `training-log.json` has reached the refresh
threshold in config, tell the reviewer a calibration pass is due and offer to run it.
