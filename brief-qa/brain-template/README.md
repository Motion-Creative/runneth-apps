# Brief QA Judge

This folder is the workspace-specific brain for Brief QA. It holds the active rubric,
training signals, and config that shapes how Runneth evaluates briefs.

Brief generation is handled separately in chat. This app is the review surface.
See `brief-saving-convention.md` for how completed briefs get posted here.

---

## Files

| File | Purpose |
|---|---|
| `rubric.md` | Active QA criteria + evaluation prompt. Updated each refinement cycle. |
| `brief-template.md` | The brief format used by this workspace, if provided during onboarding. Used by the QA judge to know what sections to expect and evaluate. |
| `brief-saving-convention.md` | How to save a brief to `/agent/brain/briefs/` and post it to the app. |
| `training-log.json` | Signal snapshot synced from the app SQLite. |
| `score-history.json` | Agreement score over time. |
| `generation-notes.md` | Patterns synthesized from rejected comments and annotations that should inform how future briefs are written. Updated alongside rubric refinement. |
| `rubric-history/` | Archived rubric versions: `vN-YYYY-MM-DD.md`. |

---

## Onboarding

Run onboarding when a user says "set up Brief QA", "run Brief QA onboarding", or any clear
variation. Also trigger when Brief QA is used for the first time and `GET /api/config`
returns `onboarding_complete: false` or nothing.

**One question. Ask it directly.**

> "Do you have an existing QA rubric, review checklist, or criteria you want me to use?
> If yes, share it now and I'll use it as the foundation. Leave blank to start from the
> default rubric -- it refines from your feedback over time."

After the user answers:

### Save config to app

```python
import http.client, json

config = {
    "onboarding_complete": True,
    "qa_rubric": "",    # full text if they provided criteria, else empty string
    "completed_at": int(__import__("time").time() * 1000),
}

data = json.dumps(config).encode("utf-8")
conn = http.client.HTTPConnection("localhost")
conn.putrequest("POST", "/brief-qa/api/config")
conn.putheader("Content-Type", "application/json")
conn.putheader("Transfer-Encoding", "chunked")
conn.endheaders()
conn.send(f"{len(data):X}\r\n".encode())
conn.send(data)
conn.send(b"\r\n0\r\n\r\n")
conn.getresponse().read()
conn.close()
```

### Merge custom QA criteria (if provided)

Add the user's criteria to the top of `rubric.md` under `## Reviewer Criteria`.
These take precedence over the default criteria when there is a conflict.
Do not replace the evaluation prompt -- add above it.

If the user provided nothing, leave `rubric.md` unchanged.

### Confirm

> "Brief QA is ready. When you finish a brief, tell me to save it to Brief QA and I'll
> QA it from there."

---

## How Config Shapes QA Evaluation

### qa_rubric -- custom evaluation criteria

If `rubric.md` contains `## Reviewer Criteria`, those are primary. They run before the
default six-dimension rubric. Where they conflict with defaults, reviewer criteria win.

### brief context -- audience and format

The brief itself carries the context the judge needs. Read the brief's `for_context` field
and `metadata` (awareness_stage, mechanic, format, persona) before evaluating. These shape
which rubric dimensions matter most for this specific brief -- not a global config setting.

---

## How Runneth Runs a QA Review

Tell Runneth: "QA the [brief title] brief" or "QA brief [ID]."

1. Read `/agent/brain/brief-qa-judge/rubric.md`
2. Read `GET /api/config` for audience and template context
3. Fetch the brief: `GET /api/briefs/:id`
4. Evaluate against rubric criteria (reviewer criteria first, then defaults)
5. Post 3-5 comments -- each 3 lines or fewer, section-tagged, specific and actionable

Comment POST (ASCII-only, chunked):

```python
import http.client, json

def post_comment(brief_id, text, section):
    payload = {"text": text, "section": section, "user_name": "Runneth", "source": "runneth"}
    data = json.dumps(payload).encode("utf-8")
    conn = http.client.HTTPConnection("localhost")
    conn.putrequest("POST", f"/brief-qa/api/briefs/{brief_id}/comments")
    conn.putheader("Content-Type", "application/json")
    conn.putheader("Transfer-Encoding", "chunked")
    conn.endheaders()
    conn.send(f"{len(data):X}\r\n".encode())
    conn.send(data)
    conn.send(b"\r\n0\r\n\r\n")
    resp = conn.getresponse()
    return json.loads(resp.read())
```

Comment text rules (proxy safety):
- ASCII only -- no em dashes, smart quotes, emoji, accented characters
- Use `-` instead of em dashes, straight quotes or no quotes

---

## Training Loop

### What feeds the loop

- **Runneth comments** that are accepted or rejected train the QA judge
- **Human comments** (what Runneth missed) are equally valuable training signals
- **Annotations** on rejected comments capture the reasoning behind disagreements

Both paths matter. Accepted Runneth comments confirm the judge's current calibration.
Rejected comments and human additions show where it's off.

### Two destinations for signals

Signals feed into two places:

1. **`rubric.md`** -- refines the evaluation criteria and prompt
2. **`generation-notes.md`** -- surfaces patterns about what makes briefs succeed or fail
   for this reviewer, which any brief writer (human or Runneth) can read before writing

`generation-notes.md` is not a generation skill. It is a preferences document.
Examples of what ends up there:
- "Hooks that open with a question tend to get rejected. Preference is pattern interrupt."
- "Visual direction is consistently flagged as too vague -- reviewer wants shot-specific direction."
- "CTAs that lead with the offer (free, money-back) perform better than urgency CTAs."

### Syncing training data

```python
import urllib.request, json

req = urllib.request.Request("http://localhost/brief-qa/api/training-data")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

with open("/agent/brain/brief-qa-judge/training-log.json", "w") as f:
    json.dump(data, f, indent=2)
```

### Refinement cadence

Refine when 20+ new signals since last version, or score drops more than 5%:

1. Sync training data
2. Archive `rubric.md` to `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md` (preserve `## Reviewer Criteria` if present)
4. Write updated `generation-notes.md` from patterns in rejected comments and annotations
5. Re-score on held-out briefs, append to `score-history.json`

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/config | Read workspace config |
| POST | /api/config | Save config (all keys at once) |
| GET | /api/briefs | List briefs with comment stats |
| POST | /api/briefs | Create a brief record |
| GET | /api/briefs/:id | Get a brief |
| PATCH | /api/briefs/:id | Update status or content |
| DELETE | /api/briefs/:id | Delete a brief |
| GET | /api/briefs/:id/comments | Get comments |
| POST | /api/briefs/:id/comments | Post a comment |
| PATCH | /api/comments/:cid | Accept / reject / annotate |
| DELETE | /api/comments/:cid | Delete comment |
| GET | /api/training-data | All signals + stats |
