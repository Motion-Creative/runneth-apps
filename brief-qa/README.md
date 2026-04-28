# Brief QA

A creative brief review app with an AI QA judge training loop. Runneth reviews briefs you save to the app, humans accept or reject the feedback, and those signals train a personal QA judge stored in the agent brain.

---

## Setup in a new workspace

Run these steps exactly, in order.

### 1. Create the app
```
app create brief-qa
```

### 2. Copy source files
```
cp -r server/* /agent/apps/brief-qa/server/
cp -r frontend/* /agent/apps/brief-qa/frontend/
```

### 3. Build and verify
```
app build brief-qa
app verify brief-qa
```

### 4. Create the judge brain folder
```
cp -r brain-template /agent/brain/brief-qa-judge
```

This creates `/agent/brain/brief-qa-judge/` with an empty training log, score history,
the judge README, a starter rubric, and the brief saving convention.

### 5. Get the app URL
```
app list
```

Return a link widget with `kind=app` using the route shown.

### 6. Run onboarding

Tell Runneth: *"Set up Brief QA"*

Runneth will ask for any existing QA criteria or rubric you want to start from.
If you have one, share it. Leave blank to start from the default rubric.

The default rubric is not customer-specific. It evolves through your feedback signals
over time. The more briefs you QA, the more the judge aligns with your standards.

### 7. Save your first brief and QA it

When you finish writing a brief, tell Runneth to save it to Brief QA:

> "Save this brief to Brief QA"

Runneth saves it to `/agent/brain/briefs/<brand>/` and posts it to the app.
Then tell Runneth to QA it:

> "QA the [brief title] brief"

Runneth reads the rubric, evaluates the brief, and posts 3–5 comments.
Open the app, review the comments, and accept, reject, or annotate each one.

---

## What this creates

```
/agent/apps/brief-qa/          <- the running app
/agent/brain/brief-qa-judge/   <- the judge (workspace-specific)
  README.md                    <- operational guide for Runneth
  rubric.md                    <- starter rubric, then reviewer-initialized
  brief-saving-convention.md   <- how to save and post briefs
  rubric-history/              <- archived rubric versions
  training-log.json            <- signal snapshot (live source is app SQLite)
  score-history.json           <- agreement score over time
  generation-notes.md          <- brief quality patterns (created after first refinement)
/agent/brain/briefs/           <- saved brief files
  <brand-slug>/
    YYYY-MM-DD-<title>.md
```

---

## How Runneth saves a brief

See `brain-template/brief-saving-convention.md` for the full spec.

The short version: save the brief as a markdown file with a frontmatter block under
`/agent/brain/briefs/<brand-slug>/`, then POST it to the app. The frontmatter carries
the strategic metadata (audience, awareness stage, mechanic, format, persona, etc.)
that the app surfaces in the brief list and that the judge reads before evaluating.

---

## How Runneth runs a QA review

1. Read `/agent/brain/brief-qa-judge/rubric.md`
2. Fetch the brief: `GET /api/briefs/:id`
3. Evaluate across six dimensions: strategic clarity, hook quality, copy execution,
   visual direction specificity, deliverables completeness, guardrails coverage
4. Post 3–5 comments — each 3 lines or fewer, tagged to a section

### Agent shell comment posting

Comment text must be ASCII-only to avoid proxy encoding issues.

```bash
curl -s -X POST "http://localhost/<app-route>/api/briefs/$BRIEF_ID/comments" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$COMMENT_TEXT\", \"section\": \"$SECTION\", \"user_name\": \"Runneth\", \"source\": \"runneth\"}"
```

Use `-` instead of em dashes. No smart quotes, emoji, or characters above U+007F.
Use chunked transfer encoding for large payloads (see brain README for the Python pattern).

---

## Brief sections

| Section ID | What it covers |
|---|---|
| `concept` | Concept overview — strategic clarity, through-line |
| `hook` | Hook copy, visual direction, hook variations |
| `body` | Body copy, numbered points, text overlay instructions |
| `cta` | CTA copy, tone direction, text overlay |
| `visual` | Opening visual, body structure, energy, pacing |
| `deliverables` | Format specs, aspect ratio, duration, caption requirements |
| `guardrails` | Claim restrictions, brand rules, platform constraints |
| `overall` | Cross-section observations |

---

## Training signals

| Field | Meaning |
|---|---|
| `source: "runneth"` | Posted by Runneth |
| `source: "human"` | Posted by a human reviewer |
| `resolved: 1` | Human accepted this Runneth comment |
| `rejected: 1` | Human rejected this Runneth comment |
| `annotation` | Human note explaining the accept/reject |

Human comments (what Runneth missed) are equally valuable training data.

---

## Rubric refinement cadence

Refine when 20+ new signals since the last version, or score drops more than 5%.

1. `GET /api/training-data` and write to `training-log.json`
2. Archive `rubric.md` to `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md`
4. Write or update `generation-notes.md` with patterns from rejected comments and annotations
5. Re-score on held-out briefs, append to `score-history.json`

---

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/config | Read workspace config |
| POST | /api/config | Save config |
| GET | /api/briefs | List briefs with comment stats |
| POST | /api/briefs | Create a brief |
| GET | /api/briefs/:id | Get a brief |
| PATCH | /api/briefs/:id | Update status or content |
| DELETE | /api/briefs/:id | Delete a brief |
| GET | /api/briefs/:id/comments | Get all comments |
| POST | /api/briefs/:id/comments | Post a comment |
| PATCH | /api/comments/:cid | Update resolved / rejected / annotation |
| DELETE | /api/comments/:cid | Delete a comment |
| GET | /api/training-data | All training signals + stats |

---

&copy; 2026 Motion Creative
