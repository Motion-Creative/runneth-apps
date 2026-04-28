# Brief Saving Convention

This document defines how a completed brief gets saved and surfaced in Brief QA.
Brief generation itself is unconstrained — use whatever skills, inputs, and format
make sense. This convention only covers the save step that happens afterward.

---

## Where briefs live

Save every completed brief under `/agent/brain/briefs/`:

```
/agent/brain/briefs/
  <brand-slug>/
    YYYY-MM-DD-<brief-title-slug>.md
```

Examples:
- `/agent/brain/briefs/acme/2026-05-01-summer-sale-ugc-brief.md`
- `/agent/brain/briefs/northstar/2026-05-10-hook-refresh-problem-aware.md`

---

## Brief file format

Every brief file starts with a frontmatter block, followed by the full brief markdown.

```
---
brand: Acme
for: Creator
goal: Drive trial signups
landing_page: https://acme.com/free-trial
awareness_stage: Problem-Aware
mechanic: Reframe
format: Yapper
persona: Busy Professional
pain: Can't focus at home
messaging_angle: The problem isn't your environment, it's your tools
created: 2026-05-01
---

# Creator Brief: Acme Focus App

[Full brief content below...]
```

All frontmatter fields are optional except `brand`, `for`, and `goal`.
Use what you know. Leave fields blank rather than guessing.

---

## Posting to Brief QA

After saving the file, post it to the Brief QA app so it appears in the review queue.
Parse the frontmatter, then POST using chunked transfer encoding:

```python
import http.client, json, re
from pathlib import Path

def parse_frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        return {}, text
    fm = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, text[match.end():]

path = "/agent/brain/briefs/acme/2026-05-01-summer-sale-ugc-brief.md"
text = Path(path).read_text()
fm, body = parse_frontmatter(text)

payload = {
    "title": fm.get("goal", Path(path).stem),
    "brand_name": fm.get("brand", ""),
    "for_context": fm.get("for", ""),
    "goal": fm.get("goal", ""),
    "landing_page": fm.get("landing_page", ""),
    "full_brief": body.strip(),
    "metadata": {
        "awareness_stage": fm.get("awareness_stage", ""),
        "mechanic": fm.get("mechanic", ""),
        "format": fm.get("format", ""),
        "persona": fm.get("persona", ""),
        "pain": fm.get("pain", ""),
        "messaging_angle": fm.get("messaging_angle", ""),
    }
}

data = json.dumps(payload).encode("utf-8")
conn = http.client.HTTPConnection("localhost")
conn.putrequest("POST", "/brief-qa/api/briefs")
conn.putheader("Content-Type", "application/json")
conn.putheader("Transfer-Encoding", "chunked")
conn.endheaders()
conn.send(f"{len(data):X}\r\n".encode())
conn.send(data)
conn.send(b"\r\n0\r\n\r\n")
result = json.loads(conn.getresponse().read())
print("Posted:", result["brief"]["id"])
conn.close()
```

---

## When to save and post

- Brief is complete and ready for review
- User asks to "save this to Brief QA" or "QA this brief"
- Any brief the user will want Runneth feedback on

Do not save drafts, partial briefs, or exploration work unless explicitly asked.

---

## What this enables

Once a brief is in the app:
- Runneth can QA it: read rubric, evaluate, post comments
- Reviewer accepts/rejects each comment
- Signals accumulate and refine the judge over time

The file in `/agent/brain/briefs/` is the persistent record.
The app is the review surface.
