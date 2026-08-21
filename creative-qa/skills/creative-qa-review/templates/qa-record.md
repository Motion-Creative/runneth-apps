# Unified QA record

Every reviewed asset writes one record into `state.json` in this shape, regardless of
which platform it came from or where feedback went. Calibration reads only this shape.

```json
{
  "asset_id": "<stable id: source message ts, task gid, file id, or content hash>",
  "reviewed_at": "YYYY-MM-DDTHH:mm:ssZ",
  "asset": {
    "type": "video | static",
    "original_name": "<filename as received>",
    "proposed_name": "<name per naming-convention.md, null if naming off>",
    "renamed": false
  },
  "source": {
    "platform": "<slack | asana | frame_io | notion | drive | upload | ...>",
    "ref": "<task gid / message ts / page id / file id>",
    "link": "<permalink when the platform has one>"
  },
  "verdict": "PASS | SOFT_FAIL | HARD_FAIL",
  "gates": {
    "placeholder": "pass | fail",
    "claims": "pass | fail",
    "spec": "pass | fail",
    "naming": "pass | fail | off",
    "dedup": "new"
  },
  "comments": [
    {
      "number": 1,
      "dimension": "<rubric dimension>",
      "location": "<mm:ss for video, region for static>",
      "issue": "",
      "evidence": "",
      "fix": ""
    }
  ],
  "delivery": [
    { "destination": "<platform + channel/task ref>", "message_ref": "<ts or story gid>" }
  ],
  "reviewer": "<reviewer of record>",
  "feedback": { "status": "awaiting", "signals_written": false }
}
```

Rules:

- `asset_id` is the dedup key; it must be derivable the same way on every run.
- A record is written even for PASS verdicts; passes are calibration signal too.
- `feedback.status` moves to `collected` only when `creative-qa-calibrate` has read the
  reviewer's response and appended signals to `training-log.json`.
