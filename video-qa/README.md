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
score history, the judge README, and a starter rubric template. The starter
rubric is not customer-specific yet.

### 5. Get the app URL

```bash
app list
```

Return a `link` widget with kind=app using the route shown.

### 6. Feed customer examples and initialize the rubric

Before Runneth QA's videos, give it customer-specific review material. It can
be rough: a bullet list, slide screenshot, creative brief, QA checklist,
example notes, rejected/approved examples, or a short blurb describing what the
reviewer looks for.

Tell Runneth:

> "Use these examples to initialize `/agent/brain/video-qa-judge/rubric.md` for Video QA. Synthesize what this customer checks for, start from the generic Analyze Media evidence prompt in the repo README, adapt it to this customer's rubric, and keep uncertain assumptions explicit."

Runneth should update the workspace copy of `rubric.md`, not the repo template.
The initial rubric should include:

- review criteria
- the Analyze Media prompt
- timestamped comment rules
- open questions or assumptions

If no examples exist, ask for a few before starting. Only use the generic
starter rubric when the user explicitly wants a cold-start calibration.

### 7. Run batch one calibration

Use the first batch of videos to test the initial rubric.

1. Upload the first batch of videos.
2. For each video, Runneth runs Analyze Media using the prompt in `rubric.md`.
3. Runneth posts 3-6 timestamped QA comments.
4. The human accepts, rejects, or annotates each Runneth comment.
5. Sync `/api/training-data` into `training-log.json`.
6. Review the agreement score and update `rubric.md` before the next batch.

---

## What this creates

```
/agent/apps/video-qa/          ← the running app
/agent/brain/video-qa-judge/   ← the judge (workspace-specific)
  README.md
  rubric.md                    ← starter template, then customer-initialized
  rubric-history/              ← archived versions
  training-log.json            ← signal snapshot (live source is app SQLite)
  score-history.json           ← agreement score over time
```

---

## How Runneth runs a QA review

```
1. Read /agent/brain/video-qa-judge/rubric.md, especially the Analyze Media prompt
2. Copy video to ./uploads/ → run motion analyze-media with that prompt
3. POST /api/videos — create video record
4. PUT /api/videos/:id/upload — upload raw binary (Content-Type: application/octet-stream)
5. POST /api/videos/:id/comments — one comment per observation:
   { source: "runneth", user_name: "Runneth", text: "...", timestamp_seconds: N }
```

The media analysis should capture exact timestamps, scene changes, visible
text, spoken words or voiceover summary, audio cues, product/offer/CTA
mentions, pacing changes, and any moment that could confuse, distract, or fail
to persuade the target viewer. The final QA comments should be based on the
rubric, not generic taste.

Use exact timestamps from the media analysis. Post 3-6 comments per video unless
the rubric says otherwise.

### Judge docs and Analyze Media prompt

The generic Analyze Media evidence prompt is judge behavior, not app behavior.
It lives in `brain-template/README.md` so it is copied into each workspace brain.

When initializing or updating a workspace, use the brain README to merge the
generic evidence prompt into `/agent/brain/video-qa-judge/rubric.md` without
overwriting customer-specific review criteria or learning notes.

### Agent shell comment posting

When Runneth posts comments from the agent shell, keep the JSON body ASCII-only.
Do this even though the browser UI can handle Unicode.

Comment text posted through shell automation should:

- use `-` instead of em dashes
- use straight quotes or no quotes
- avoid emoji, smart quotes, accented characters, and any character above U+007F
- be JSON-escaped before interpolation into `curl -d`

Reason: the app may sit behind a proxy that rewrites escaped Unicode before the
request reaches Fastify, which can cause a `Content-Length` mismatch and reject
the request. ASCII-only comment text avoids this failure mode.

Reliable shell pattern:

```bash
curl -s -X POST "http://localhost/<app-route>/api/videos/$VID/comments" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"$COMMENT_TEXT\",\"timestamp_seconds\":$TS,\"user_name\":\"Runneth\",\"source\":\"runneth\"}"
```

If comment text is generated in Python before posting, strip non-ASCII before
building the `curl` body:

```python
comment_text = comment_text.encode("ascii", "ignore").decode()
```

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
3. Write updated `rubric.md`, including the Analyze Media prompt
4. Re-score on held-out videos → append to `score-history.json`

---

## Identity

No auth. Commenters type their name inline when leaving feedback.
Name persists for the browser session. One primary reviewer recommended
for clean training signal — the judge learns to match one person's taste.
