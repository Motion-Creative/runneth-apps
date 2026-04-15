# Video QA Judge

One judge per workspace. Represents this workspace's QA taste, built from
accept/reject signals on Runneth's video review comments.

## Status

- Rubric: starter template, not customer-initialized
- Signals: 0
- Agreement score: not computed

## Initialize the rubric

### Customer examples first

Before QA-ing videos, feed Runneth whatever the customer already has. It can be
a rubric, slide screenshot, creative brief, QA framework, bullet list, notes,
approved/rejected examples, or a short blurb about what the reviewer looks for.

Tell Runneth:

> "Use these examples to initialize `rubric.md` for the Video QA judge. Synthesize what this customer checks for, write the first Analyze Media prompt, and keep uncertain assumptions explicit."

Runneth should rewrite `rubric.md` from the starter template into a
customer-specific rubric. The rubric should include the Analyze Media prompt
that Runneth will use before posting timestamped comments.

If no examples exist, ask for a few before starting. Only use the generic
starter rubric when the user explicitly wants a cold-start calibration.

### Batch one calibration

Use the first batch of videos to test the initialized rubric.

1. Runneth runs Analyze Media using the prompt in `rubric.md`.
2. Runneth posts 3-6 timestamped comments per video.
3. The human accepts, rejects, or annotates Runneth comments.
4. Runneth calls `/api/training-data` and writes the snapshot to `training-log.json`.
5. Runneth updates `rubric.md` based on the batch one signal.

## Files

| file | purpose |
|------|---------|
| `rubric.md` | Starter template, then current active rubric |
| `rubric-history/` | Archived versions with dates |
| `training-log.json` | Snapshot of signals from the app's SQLite |
| `score-history.json` | Agreement score over time |

## Sync training data

To refresh `training-log.json` from the live app:

```
GET /<app-route>/api/training-data
```

Read the response and write it to `training-log.json`.

## Rubric refinement

Refine when: 20+ new signals since last rubric version, or score drops >5%.

1. Read new signals from `/api/training-data`
2. Compare against current `rubric.md`
3. Archive current → `rubric-history/vN-YYYY-MM-DD.md`
4. Write updated `rubric.md`, including the Analyze Media prompt
5. Re-score against held-out videos → append to `score-history.json`

## One primary reviewer

All signals from all users feed the judge. For reliable training, one person
should do the majority of the reviewing. The judge learns to match their taste.
