# Video QA Judge

One judge per workspace. Represents this workspace's QA taste, built from
accept/reject signals on Runneth's video review comments.

## Status

- Rubric: not yet initialized
- Signals: 0
- Agreement score: not computed

## Initialize the rubric

### Option A — Document-seeded (fastest)

Upload any existing rubric, creative brief, QA framework, or slide deck to
the conversation. Tell Runneth:

> "Read this document and use it to write the initial rubric for the Video QA judge."

Runneth will synthesize the criteria and write `rubric.md` here.
Start QA-ing videos immediately. The review exercise will validate and refine it.

### Option B — Review-exercise

Have the primary reviewer watch and comment on 15-20 videos in the app naturally.
Once 50+ accept/reject signals exist, tell Runneth:

> "Synthesize the Video QA rubric from our training data."

Runneth will call `/api/training-data`, extract patterns, and write `rubric.md`.

### Combining both (recommended)

Use Option A to get a rubric fast, then Option B to validate it.
The first agreement score shows where stated criteria match actual behavior.

## Files

| file | purpose |
|------|---------|
| `rubric.md` | Current active rubric — written by Runneth |
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
4. Write updated `rubric.md`
5. Re-score against held-out videos → append to `score-history.json`

## One primary reviewer

All signals from all users feed the judge. For reliable training, one person
should do the majority of the reviewing. The judge learns to match their taste.
