---
name: competitor-intel
description: >
  On-demand competitor ad scan. Pulls each tracked competitor's active ads via
  motion inspo-creatives, summarizes what every brand is running and what changed since the
  last scan recorded in the workspace's competitor-watch.md, answers in chat, and refreshes
  that file. First run asks the user which competitors to track. Invoke on "what are my
  competitors running", "competitor scan", "competitor watch", "competitive intel",
  "what changed in the market", "what's <brand> been testing", or "add/remove a competitor".
---

# Competitor Intel — On-Demand Competitor Scan

One job: when asked, pull the tracked competitors' active ads, tell the user what each brand is running and what changed since the last scan, and refresh one durable file per workspace:

`/agent/brain/competition/<workspace-slug>/competitor-watch.md`

Results go in chat. This skill never posts to Slack, never creates reminders, routines, or scheduled runs, and writes no config or state files — the watch file is the only artifact. If the user wants a recurring scan, they can ask Runneth to schedule one themselves; the skill only mentions that option once, after the first scan.

**Core principle:** the value is in the delta. "They launched four UGC ads on the burnout angle since the last scan" is intelligence. "They have 40 active ads" is a fact sheet.

---

## Step 1 — Resolve workspace and load the watch file

1. Run `motion workspace-goal`. Capture the workspace ID and name. Derive `<workspace-slug>`: lowercase the workspace name, hyphens for spaces, strip special characters.
2. Read `/agent/brain/competition/<workspace-slug>/competitor-watch.md` if it exists. It holds the tracked competitor list and the previous scan's summary — keep both in memory for the diff at Step 3.
3. If the file is missing or lists no competitors, this is a first run — do Step 1a before scanning.

### Step 1a — First run: ask which competitors to track

Ask one question in chat:

> "Who are the 3–5 competitor brands you want me to watch? Names or website domains both work."

For each brand the user gives, resolve it in Motion's ad library:

```bash
motion search-brands --search-term "<name or domain>" --limit 5 --with-brand-context
```

- One clear match → confirm it briefly.
- Multiple close matches → list them (name + one-line description), ask which.
- No match → say the brand isn't in Motion's ad library yet, try one alternate search term, otherwise skip it with a note.

Confirm the final list before scanning. The list lives in `competitor-watch.md` — there is no separate config file.

### Adding or removing competitors later

When the user asks to add or remove a brand: resolve adds via `motion search-brands`, update the "Tracked competitors" table in `competitor-watch.md`, confirm in chat. Re-scan only if they ask.

## Step 2 — Pull each competitor's active ads

For each tracked brand:

```bash
motion inspo-creatives --brand-id <brandId> --status active --sort newestLaunchDate --limit 150
```

Read the returned file. Note per brand:

- Active ad count and format mix (video / static / carousel)
- Launch dates — what's new since the last scan date, and which ads have been running a long time (long-runners are the clearest signal of what's working for them)
- Recurring hooks and messaging angles — quote the strongest hooks verbatim, don't paraphrase

If the question needs positioning context, also run `motion inspo-context --brand-id <brandId>`.

## Step 3 — Compare to the previous scan

If `competitor-watch.md` recorded a previous scan, compare each brand against its last summary:

- New ads or messaging angles that weren't there before
- Ads or angles from the last summary with no live counterpart now
- Count or format shifts worth a sentence

That's the bar — a plain "here's what's new, here's what's gone" against the previous summary. No cohort math, no baseline files.

If this is the first scan, skip the diff and label the report "First scan — baseline recorded."

## Step 4 — Reply in chat

Deliver the report in the conversation, never anywhere else:

- **What changed** up top — 3–5 bullets max, only findings worth the team's attention
- Per brand: a one-line read (quiet / active / shifting), what they're running (themes, verbatim hooks, format mix, ad count), and what's new or gone since the last scan date
- A quiet market means a short report. Don't pad.

After the first successful scan only, add one line: *"Want this on a schedule? Ask me to set up a recurring competitor scan any time."* The skill itself never creates one.

## Step 5 — Write competitor-watch.md

Overwrite `/agent/brain/competition/<workspace-slug>/competitor-watch.md`:

```markdown
# <Workspace Name> — Competitor Watch

**Workspace:** <workspace name> (`<workspace-id>`)
**Last scan:** <YYYY-MM-DD>
**Previous scan:** <YYYY-MM-DD or "none — first scan">

## Tracked competitors

| Brand | Brand ID | Added |
|---|---|---|

## Last scan summary

### <Brand>
- Active ads: <N> (<format mix>)
- Running: <themes + top verbatim hooks, launch dates for notable ads>
- Changed since previous scan: <new / gone / shifted, or "first scan">

## Scan history

| Date | Headline |
|---|---|
| <YYYY-MM-DD> | <one-line what-changed> |
```

Keep the scan-history table to the last ~10 rows — it's context for the next diff, not an archive.

## Step 6 — Install the user.md snippet (first successful scan only)

Idempotent via sentinel. If `/agent/user.md` already contains `runneth-apps:competitor-intel:read-before-competitor-questions v2`, skip. Otherwise append:

```markdown
<!-- runneth-apps:competitor-intel:read-before-competitor-questions v2 -->
### Competitor questions — read the competitor watch file first

When anyone asks about competitors, their ads, or what changed in the market:

1. Read `/agent/brain/competition/<workspace-slug>/competitor-watch.md` first — it holds the tracked competitor list and the latest scan summary with dates.
2. If the question needs fresher data than the last scan date, run the `competitor-intel` skill to refresh the file before answering.

If no competitor-watch file exists for the workspace yet, run `competitor-intel` once before answering.
<!-- /runneth-apps:competitor-intel:read-before-competitor-questions -->
```

## Error handling

| Condition | Response |
|---|---|
| Brand not found in Motion's ad library | Skip with a note; offer a different search term |
| `motion inspo-creatives` returns 0 creatives | Note thin data, don't over-interpret |
| No previous scan in the watch file | First-scan mode — record the baseline, no diff |

## Anti-patterns

- **Don't schedule anything.** No reminders, routines, or recurring runs — not even when the data feels weekly-shaped. Recurring scans are something the user asks Runneth for directly.
- **Don't post to Slack** or any channel outside the current conversation.
- **Don't write JSON config or baseline files.** The watch file is the only artifact.
- **Don't report state when you have a previous scan.** Report the delta.
- **Don't paraphrase hooks** when the verbatim copy is sharper.
- **Don't hardcode workspace IDs, brand IDs, or brand names.** Resolve everything from the workspace the skill runs against.
