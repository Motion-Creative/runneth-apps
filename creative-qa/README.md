# Creative QA

A creative review app with an AI QA judge training loop. Runneth reviews uploaded video and static image ad creatives, humans accept or reject the feedback, and those signals train a personal QA judge stored in the agent brain.

Supports:
- Static image ads (JPG, PNG, GIF, WebP) with click-to-annotate pin comments
- Video ads (MP4, MOV, WebM) with timestamp-anchored comments
- Two-track routing: Objective (assign to team) and Subjective (escalate to Creative Strategist)
- Automatic QA pass via monitor routine — uploads trigger analysis within minutes

---

## Setup in a new workspace

Run these steps in order.

### 1. Create the app

```
app create creative-qa
```

### 2. Copy source files

```
cp -r server/* /agent/apps/creative-qa/server/
cp -r frontend/* /agent/apps/creative-qa/frontend/
```

### 3. Build and verify

```
app build creative-qa
app verify creative-qa
```

### 4. Create the judge brain folder

```
cp -r brain-template /agent/brain/creative-qa-judge
```

This creates `/agent/brain/creative-qa-judge/` with an empty training log, score history, the judge README, and a starter rubric template.

The starter rubric is not customer-specific yet.

### 5. Get the app URL

```
app list
```

Return a link widget with `kind=app` using the route shown.

### 6. Initialize the rubric

Before Runneth QA's creatives, give it customer-specific review material: a QA checklist, creative brief, bullet list of what reviewers look for, approved/rejected examples, or a short description of common failure modes.

Tell Runneth:

> "Use these examples to initialize `/agent/brain/creative-qa-judge/rubric.md`. Synthesize what this customer checks for, start from the generic analysis prompts in the brain-template README, adapt them to this customer's criteria, and keep uncertain assumptions explicit."

Runneth should update the workspace copy of `rubric.md`, not the repo template. The initialized rubric should include:
- Image and video review criteria
- Both analysis prompts (image and video) adapted to this customer
- Routing rules (O vs S)
- Comment rules
- Open questions or assumptions

If no examples exist, ask for a few before starting.

### 7. Set up the auto-runner

After the rubric is initialized, set up the monitor routine so uploads are reviewed automatically:

> "Set up the Creative QA auto-runner monitor for this workspace."

Runneth will create a recurring reminder that checks `/api/pending-qa` and runs a QA pass on any uploaded creatives that have not been reviewed yet.

### 8. Run batch one calibration

Upload the first batch of creatives. For each asset, Runneth runs the appropriate analysis (image: `read` tool, video: `motion analyze-media`), posts 3–6 comments, and the human accepts, rejects, or annotates each one. Review the agreement score and update `rubric.md` before the next batch.

---

## What this creates

```
/agent/apps/creative-qa/          <- the running app
/agent/brain/creative-qa-judge/   <- the judge (workspace-specific)
  README.md
  rubric.md                       <- starter template, then customer-initialized
  rubric-history/                 <- archived versions
  training-log.json               <- signal snapshot
  score-history.json              <- agreement score over time
```

---

## How Runneth runs a QA review

### Image assets

1. Read `rubric.md`, use the Image Analysis Prompt
2. Resolve file path: `/agent/apps/creative-qa/uploads/<file_path>`
3. Run `read` on that path — image sent as visual attachment
4. Post 3–6 comments with `source: "runneth"`, `routing: "objective"|"subjective"`, `timestamp_seconds: 0`, and `pin_x`/`pin_y` for location-specific findings

### Video assets

1. Read `rubric.md`, use the Video Analysis Prompt
2. Copy video to `./uploads/` → run `motion analyze-media` with the prompt
3. Post 3–6 timestamped comments with `source: "runneth"`, `routing: "objective"|"subjective"`, exact `timestamp_seconds` from the analysis

### Comment rules

- 1–2 lines max per comment. Lead with the fix, not the explanation.
- ASCII-only text when posting from the agent shell (use `-` not em dashes, straight quotes, no emoji).
- Routing must be set on every comment.

---

## Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/assets | List all assets |
| POST | /api/assets | Create asset record |
| PUT | /api/assets/:id/upload | Upload raw binary (agent shell) |
| POST | /api/assets/:id/upload/chunk | Upload one base64 chunk (browser) |
| POST | /api/assets/:id/upload/complete | Finalize chunked upload |
| GET | /api/assets/:id/stream | Stream video |
| GET | /api/assets/:id/data | Fetch image as base64 JSON |
| GET | /api/assets/:id/comments | Get all comments |
| POST | /api/assets/:id/comments | Post comment |
| PATCH | /api/comments/:id | Update resolved / rejected / annotation / routing |
| GET | /api/pending-qa | Assets awaiting first Runneth pass |
| GET | /api/training-data | Training signals and stats |

---

## Training signals

| Field | Meaning |
|-------|---------|
| `source: "runneth"` | Posted by Runneth |
| `source: "human"` | Posted by a human reviewer |
| `routing: "objective"` | Measurable pass/fail finding |
| `routing: "subjective"` | Judgment call, needs strategist |
| `resolved: 1` | Human accepted this Runneth comment |
| `rejected: 1` | Human rejected this Runneth comment |
| `annotation` | Optional human note on a Runneth comment |
| `pin_x`, `pin_y` | Location of finding on image (0–1 fraction) |

Human comments are "what Runneth missed" — equally valuable training data.

---

## Rubric refinement cadence

Refine when 20+ new signals since last version, or agreement score drops >5%.

1. Sync training data → `training-log.json`
2. Archive `rubric.md` → `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md`, including both analysis prompts
4. Re-score on held-out assets → append to `score-history.json`
