# Video QA

A video review app with an AI QA judge training loop.
Runneth reviews uploaded videos, humans accept or reject the feedback,
and those signals train a personal QA judge stored in the agent brain.

---

## Setup in a new workspace

Run these steps exactly, in order.

### 1. Create the app

```bash
app create video-qa
```

### 2. Copy source files

```bash
cp -r server/* /agent/apps/video-qa/server/
cp -r frontend/* /agent/apps/video-qa/frontend/
```

### 3. Build and verify

```bash
app build video-qa
app verify video-qa
```

### 4. Create the judge brain folder

```bash
cp -r brain-template /agent/brain/video-qa-judge
```

This creates `/agent/brain/video-qa-judge/` with empty training log,
score history, and the judge README. No rubric yet — that comes next.

### 5. Get the app URL

```bash
app list
```

Return a `link` widget with kind=app using the route shown.

### 6. Initialize the rubric

**Option A — you have a rubric document:**
Upload the document to the conversation and say:
> "Read this and write the initial rubric for the Video QA judge."

Runneth synthesizes criteria from the doc and writes
`/agent/brain/video-qa-judge/rubric.md`.

**Option B — start from scratch:**
Have the reviewer watch and comment on 15-20 videos in the app.
Once there are 50+ accept/reject signals, say:
> "Synthesize the Video QA rubric from our training data."

Runneth calls `/api/training-data`, extracts patterns, writes the rubric.

**Recommended: do A first, then B to validate.**
The first agreement score shows where the document rubric matches actual taste.

---

## What this creates

```
/agent/apps/video-qa/          ← the running app
/agent/brain/video-qa-judge/   ← the judge (workspace-specific)
  README.md
  rubric.md                    ← written by Runneth on initialization
  rubric-history/              ← archived versions
  training-log.json            ← signal snapshot (live source is app SQLite)
  score-history.json           ← agreement score over time
```

---

## How Runneth runs a QA review

```
1. Read /agent/brain/video-qa-judge/rubric.md
2. Copy video to ./uploads/ → run motion analyze-media
3. POST /api/videos — create video record
4. PUT /api/videos/:id/upload — upload raw binary (Content-Type: application/octet-stream)
5. POST /api/videos/:id/comments — one comment per observation:
   { source: "runneth", user_name: "Runneth", text: "...", timestamp_seconds: N }
```

Use exact timestamps from the media analysis. Post 3-6 comments per video.

---

## Syncing training data to brain

The app captures signals in SQLite automatically. To sync to brain:

```
GET /api/training-data
```

Read the response and write it to `/agent/brain/video-qa-judge/training-log.json`.
Do this before rubric synthesis or scoring.

---

## Key API endpoints

| method | path | description |
|--------|------|-------------|
| GET | `/api/videos` | List all videos |
| POST | `/api/videos` | Create video record |
| PUT | `/api/videos/:id/upload` | Upload raw binary |
| GET | `/api/videos/:id/stream` | Stream video (range-request supported) |
| GET | `/api/videos/:id/comments` | Get all comments |
| POST | `/api/videos/:id/comments` | Post comment |
| PATCH | `/api/comments/:id` | Update resolved / rejected / annotation |
| GET | `/api/training-data` | All training signals + stats |

---

## Training signals

| field | meaning |
|-------|---------|
| `source: "runneth"` | Posted by Runneth |
| `source: "human"` | Posted by a human reviewer |
| `resolved: 1` | Human accepted this Runneth comment |
| `rejected: 1` | Human rejected this Runneth comment |
| `annotation` | Optional human note on a Runneth comment |

Human comments are "what Runneth missed" — equally valuable training data.

---

## Rubric refinement cadence

Refine when 20+ new signals since last version, or score drops >5%.

1. Sync training data → `training-log.json`
2. Archive `rubric.md` → `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md`
4. Re-score on held-out videos → append to `score-history.json`

---

## Identity

No auth. Commenters type their name inline when leaving feedback.
Name persists for the browser session. One primary reviewer recommended
for clean training signal — the judge learns to match one person's taste.
