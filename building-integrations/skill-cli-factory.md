# cli-factory Skill

## What this skill does

Builds a custom CLI for any API or platform — designed around how this specific
person and team actually use it, not just what the API can return.

Leads with deep research. Reads the live platform like a detective. Proposes in
plain language before building anything. Asks at most one sharp question, only
when the research genuinely can't answer it.

---

## Triggers

Load this skill when someone says any of the following:
- "build me a CLI for X"
- "can we connect X to my workflow"
- "I want to pull data from X"
- "make something for X API"
- "can we do something with X"
- "I keep having to manually check X"
- Any mention of a platform + friction or a manual workflow

---

## Core operating principle

You are a detective, not an auditor.

An auditor catalogs what exists. A detective reads what's actually happening.
Every platform accumulates baggage — old projects nobody touches, teams that
exist in name only, labels someone created once and forgot. Your job is to
figure out what's alive, what's dead, and how each person actually works in
the platform — then design around the real picture, not the official one.

The person talking to you is one lens. There are other people on the team who
use the same platform differently. Know both.

---

## Phase 1 — Who is this person?

Read their team file from `/agent/brain/team/`.
Pull out:
- Their role and what they actually own day-to-day
- How they tend to work (builder vs. reviewer, async vs. in-the-weeds)
- What they've been working on recently — from conversation history and one-pagers
- Any frustrations or manual workflows mentioned in passing
- Which integrations they've used before and what they got out of them

Also check conversation history for prior mentions of this platform:
```sql
SELECT m.message_json, c.conversation_json
FROM messages m
JOIN conversations c ON m.conversation_id = c.conversation_id
WHERE json_extract(m.message_json, '$.content') LIKE '%<platform>%'
ORDER BY c.updated_at_ms DESC LIMIT 30
```

Look for: past requests that went unbuilt, workflows described in passing,
frustrations named explicitly, what they did with the data afterward.

---

## Phase 2 — Platform detective work (the critical phase)

This phase runs against the live platform. Do not skip it. Do not form opinions
before completing it.

The goal is to understand **how this org actually uses this platform** —
not what's theoretically possible, not what the docs say, not what a generic
company would do. What's real, alive, and in use right now, by specific people.

### Step 1: Pull the full structure

Query every major entity: teams, projects, boards, spaces, workspaces, channels —
whatever the platform organizes work into. Get names, members, states, and the
last activity date on each.

### Step 2: Separate signal from noise

Every platform has baggage. Apply these heuristics ruthlessly:

**Dead or legacy signals:**
- No activity in the last 45 days
- Zero open/active work items
- Members who don't appear in any recent activity
- Names with "(old)", "(archive)", "(deprecated)", or a year in them
- States, labels, or categories with zero items attached
- Structures created more than 6 months ago that were never heavily used

**Alive signals:**
- Work items updated or commented on in the last 14 days
- Members who are actively moving, creating, or commenting on work
- Names that match current known initiatives from team files or brain
- Structures with a healthy ratio of open-to-closed work
- Cycles or sprints that are currently running

When something is ambiguous — looks partially alive — flag it as worth clarifying
rather than assuming either way.

### Step 3: Map who actually works where

Cross-reference platform members with `/agent/brain/team/` files.
For each known team member, determine:

- Which team/project/space do they appear in most often?
- What kinds of work do they create vs. just get assigned?
- Are they active in cycles/sprints or working in a continuous backlog?
- How do they describe work? (issue titles, naming patterns)
- Are there structures they seem to own vs. just be present in?

Build a per-person map. The same platform often has completely different
meanings for different people. One person's view of a platform is not another's.
A CLI built for one without knowing the other misses half the picture.

### Step 4: Find the vocabulary

How does this team describe their work in this platform?
- What do they call things (pods, squads, epics, projects, initiatives)?
- Are there naming conventions in issue titles or project names?
- What do their custom workflow states say about how they think about progress?
- What labels are actually used vs. created and forgotten?

The CLI must speak their language, not the platform's defaults.

### Step 5: Identify the seams

Every org has structural seams — places where different groups' work meets,
overlaps, or depends on each other.
- Where do cross-team dependencies live?
- Which structures are one person's domain vs. shared territory?
- Are there parallel views of the same work (a PM view and an engineering view)?
- Where does work tend to get stuck between groups?

These seams are often where the most valuable compound commands live.

### Step 6: Write the internal map

Before forming any proposal, write a short internal summary (not shown to user):

```
ALIVE: [list structures, teams, projects that are genuinely active]
DEAD/LEGACY: [list structures to ignore in the CLI design]
PER-PERSON:
  [Person A]: primarily works in [X], creates [type of work], [pattern notes]
  [Person B]: primarily works in [Y], rarely touches [Z], [pattern notes]
VOCABULARY: [their words for things]
SEAMS: [where groups intersect or hand off]
KEY OPEN QUESTION: [one thing the data can't answer — if any]
```

---

## Phase 3 — API capabilities (scoped, not exhaustive)

Now look at what the API can actually do — but only in service of the
structures and patterns you found in Phase 2.

- What data is available for the alive structures?
- What auth is in place? What scopes? What's missing?
- Are there existing skills or CLIs that overlap?
- What's the NOI — the one thing this API can reveal that the platform's own
  UI doesn't surface?

The NOI must be one sentence and grounded in THIS org's usage, not a generic
reframe. "For Motion's team, Linear isn't a sprint board — it's the gap between
what the Runneth roadmap says is moving and what's actually been touched in the
last two weeks."

---

## Phase 4 — The question (only if the map has a genuine gap)

After Phase 2, there is usually one thing that can't be read from the data.
This is the only thing worth asking about.

**What makes a question worth asking:**
- The answer materially changes what the CLI is designed to do
- It references something specific found in the platform mapping
- It's about a genuine ambiguity — not something the detective work could have
  resolved with more effort
- It's answerable in one sentence

**What makes a question not worth asking:**
- It's something the live data already answered
- It could be asked about any platform to any person
- It's a hypothetical ("what would you want...")
- It's really the agent avoiding doing more research

**Tone for the question:**
Conversational. Specific. A little curious. Not a form field.

Good: *"I can see the [team] is where your squad actually lives — [members], you — but the [other project] overlaps with some
of the same work. When you're in planning mode, which of those is your
primary lens?"*

Bad: *"Who is the primary audience for this CLI?"*

If nothing is genuinely ambiguous after the mapping, skip the question entirely.
Go straight to the proposal.

---

## Phase 5 — The proposal

Write this like a colleague who just spent an hour digging into their setup and
came back genuinely interested in what they found. Not a spec doc. Not a PRD.

**Tone:**
- Lead with what you found, not what you're going to build
- Use their vocabulary, not the platform's defaults or technical terms
- Express genuine interest in the interesting things you found
- Be direct about what you think they actually need
- One or two sentences of warmth goes a long way

**Structure:**

```
What I found:
[2-4 sentences about the actual structure — specific, a little surprising,
 using their words. Name real things you found. Dead things can be named too:
 "looks like the old BR team is legacy at this point."]

What this tells me:
[1-2 sentences connecting the structure to what they actually need.
 State your inference confidently. "This looks like a cross-team
 visibility problem more than a personal tracking problem."]

What I'd build:
[Commands as questions they answer, in plain language, named in their
 vocabulary. Include a short "compound" note for non-obvious commands.]

[ONE question here if needed — grounded in the mapping, specific, warm]

Say yes to build, or push back on anything.
```

**Command naming rules:**
- Name commands after the question they answer, not the endpoint they call
- Use the team's vocabulary (their word for "team" or "project" or "sprint")
- Compound commands get one sentence explaining what they join or calculate
- Always include `sync`, `search`, `sql`, `doctor` — but don't make them
  the centerpiece

---

## Phase 6 — Build

Follow the printing-press CLI conventions:

### Structure
```
/agent/apps/<platform>-pp-cli/
  main.go
  cmd/
    root.go       — NOI in Long description, auth docs, exit codes
    <command>.go  — one file per command
    sync.go
    search.go
    sql.go
    doctor.go
  internal/
    client/       — HTTP/GraphQL client, types, auth from env
    store/        — SQLite schema, upsert, FTS5, sync_log
    output/       — table (TTY) / auto-JSON (piped) / --compact
```

### Non-negotiable output behavior
- Terminal → human table, status on stderr
- Piped → auto-JSON, no flag needed
- `--compact` → named high-gravity fields only
- Exit codes: 0 success · 2 no results · 3 API/auth error · 4 store error

### Every CLI must include by default

**`doctor` command — required, non-negotiable**
Checks auth, API connectivity, store health, and — critically — reads
`/agent/brain/integrations/<name>/quirks.md` if it exists and surfaces
all `unhandled` quirks with plain-language descriptions and workarounds.
Format: `⚠ Known issue: [symptom]  Workaround: [what to do]`

**Quirk-aware error handling — required**
The `client.go` HTTP/GraphQL client must:
- Check the quirks file on init and apply known defensive patterns
- Return structured errors that distinguish API errors from known quirks
- When a known quirk is detected, return the workaround message instead
  of the raw platform error

**Usage observation hooks — required**
Each command's `RunE` function writes a lightweight observation to the
store's `command_log` table on every successful run:
```sql
CREATE TABLE IF NOT EXISTS command_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  command     TEXT NOT NULL,
  flags_json  TEXT,          -- flags passed, as JSON
  result_rows INTEGER,
  ran_at      TEXT NOT NULL
);
```
This table is what usage-patterns.md reads from. It stays local — never
sent anywhere. The `sql` command can query it directly:
```bash
<cli> sql "SELECT command, COUNT(*) as runs FROM command_log GROUP BY command ORDER BY runs DESC"
```

### After build
1. Compile and verify every command with `--help`
2. Run `doctor` and confirm it passes
3. Confirm `command_log` table exists in the store after one command run
4. Write SKILL.md at `/agent/.agents/skills/<platform>-cli/SKILL.md`
5. Create `/agent/brain/integrations/<name>/quirks.md` as an empty file
   with the standard header — ready for entries
6. Create `/agent/brain/integrations/<name>/usage-patterns.md` as an
   empty file with the standard header — ready for entries
7. Update `/agent/INDEX.md`
8. Update person's team file if durable new context surfaced
9. Note in the SKILL.md which structures are alive vs. legacy
   so future sessions don't have to re-detect

---

## SKILL.md for generated CLIs — required sections

```markdown
# <platform>-cli Skill

## When to use
[Specific triggers. Explicit DO NOT USE for adjacent use cases.]

## Who this is designed for
[Which team members use this and how — per-person notes where relevant]

## Live structures (as of [date])
[The alive teams/projects/workspaces this CLI is built around.
 Note legacy structures to ignore.]

## Binary + auth
[Path, env vars, how to find values]

## Command reference
[Every command, 2-3 real examples, named in the team's vocabulary]

## Agent workflows
[Named workflows for each person or question type — specific to the
 NOI and the team's actual structure, not generic]

## Known quirks (as of [date])
[Summary of active quirks from quirks.md — handled vs. unhandled.
 Update this section whenever quirks.md changes.]

## Usage patterns (as of [date])
[Most-used commands and observed workflows from usage-patterns.md.
 Update after meaningful usage accumulates — 3+ sessions.]
```

---

## The detective's checklist before proposing

Before writing a single word of the proposal, confirm:

- [ ] I know which structures are alive and which are legacy
- [ ] I can name at least 2 people and describe how they use this platform differently
- [ ] I know what this team calls things (their vocabulary, not the platform's defaults)
- [ ] I know where the seams are between groups
- [ ] I have a NOI that is specific to this org, not a generic reframe
- [ ] My question (if I have one) references something I actually found in the platform

If any of these are unchecked, do more research. Do not compensate with a
generic question.
