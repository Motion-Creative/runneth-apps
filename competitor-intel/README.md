# competitor-intel

On-demand competitor ad scan. When the user asks what competitors are running, Runneth pulls
each tracked competitor's active ads from Motion's ad library, summarizes what every brand is
running and what changed since the last scan, answers in chat, and refreshes one durable
reference file per workspace.

The value is in the delta. "Brand X launched four UGC ads on the solopreneur burnout angle since
the last scan" is intelligence. A list of their active ads is a fact sheet. Every report answers:
**what should the team pay attention to right now?**

No scheduled routine, no Slack delivery, no setup skill, no config files. The first scan asks the
user in chat which competitors to track. If the user wants a recurring scan, they ask Runneth to
schedule one themselves — the skill never creates one.

Install time: ~1 minute. No upstream use cases required.

---

## What gets installed

| File | Destination | On exists |
|------|-------------|-----------|
| `SKILL.md` | `/agent/.agents/skills/competitor-intel/SKILL.md` | Overwrite |

That's the whole install. No seeds, no post-install setup flow.

---

## Install in a fresh sandbox

```bash
mkdir -p /agent/.agents/skills/competitor-intel
cp SKILL.md /agent/.agents/skills/competitor-intel/SKILL.md
```

Then say "what are my competitors running?" in chat. The first run asks which brands to track.

---

## How it works

**Every run:**
1. Resolves the workspace (`motion workspace-goal`) and derives the workspace slug
2. Reads `/agent/brain/competition/<workspace-slug>/competitor-watch.md` for the tracked list and the previous scan summary (first run: asks the user which 3–5 brands to track and resolves each via `motion search-brands`)
3. Pulls each brand's active ads: `motion inspo-creatives --brand-id <id> --status active --sort newestLaunchDate --limit 150`
4. Summarizes per brand: ad count, format mix, recurring angles, verbatim hooks, long-runners
5. Compares against the previous scan summary in the watch file — what's new, what's gone, what shifted
6. Replies in chat (never Slack) and overwrites the watch file with the fresh summary and scan date

**First run:** records the baseline summary, no diff. Second run onward reports the delta.

**Adding/removing competitors:** "add [brand] to the competitor watch" or "remove [brand]" updates
the tracked-competitors table in the watch file. No separate config.

---

## What this creates at runtime

```
/agent/brain/competition/<workspace-slug>/
  competitor-watch.md    — tracked competitor list + last-scan summary + scan dates
```

After the first successful scan, the skill also appends one sentinel-guarded block to
`/agent/user.md` (`runneth-apps:competitor-intel:read-before-competitor-questions v2`): when
anyone asks a competitor question, read the watch file first, and refresh it via the skill if the
question needs fresher data than the last scan date. Idempotent — re-runs never duplicate it.

---

## Triggers

The skill runs only on explicit request in chat:

| Phrase | What happens |
|--------|-------------|
| "what are my competitors running" | Full scan of all tracked brands |
| "competitor scan" / "competitor watch" | Same |
| "competitive intel" / "what changed in the market" | Same |
| "what's [brand] been testing lately" | Answered from the watch file, refreshed if stale |
| "add a competitor" / "remove a competitor" | Updates the tracked list in the watch file |

---

## Fallbacks

- **Brand not in Motion's ad library:** Skipped with a note. Suggest trying `motion search-brands` with a different term.
- **Empty portfolio (0 active ads):** Noted in the report, not treated as an error.
- **No previous scan:** First-scan mode — baseline summary, labeled as such, no diff.

---

## Version history

- **2.0.0** (2026-06-12) — Trimmed to a single on-demand skill. Cut the auto-invoked setup skill,
  the auto-scheduled weekly routine, auto Slack posts, baseline JSON files, inspoBrands.json, and
  migration-helper.sh. The tracked list and scan record now live in one `competitor-watch.md` per
  workspace. Added the sentinel-guarded user.md instruction installed after the first scan.
- **1.1.0** (2026-06-02) — Brain data path moved to `/agent/brain/competition/`.
- **1.0.0** (2026-05-20) — Initial release, translated from the `competitor-intel` skill in
  `motion-creative-plugin`. Weekly scheduled scan with setup skill, Slack delivery, and baselines.
