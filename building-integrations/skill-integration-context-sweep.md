# integration-context-sweep Skill

## What this skill does

When a new integration connects, you gain access to an entirely new world of
context. This skill systematically sweeps that world, figures out where every
meaningful piece of context belongs in the file system, disperses it there,
and — critically — builds the retrieval guarantees that ensure it actually gets
used in future conversations.

The hard problem this skill solves: context that gets filed but never retrieved
has zero value. This skill treats the retrieval guarantee as a first-class
output, not an afterthought.

Three outputs per run:
1. **Dispersed context** — new and enriched files across the brain file system
2. **Retrieval wiring** — INDEX.md entries, cross-references in frequently-read
   files, and routing hooks that ensure new context gets loaded at the right moment
3. **Sweep report** — a visible summary of what was found, where it went,
   and exactly when each piece will now be referenced

---

## Trigger

**Primary:** Called at the end of `integration-activation`, in the same turn.
Runs third in the connection sequence:
  1. `integration-onboarding` → capabilities + basic summary
  2. `integration-activation` → value design + workflow proposals
  3. `integration-context-sweep` → context dispersal + retrieval wiring

**Manual:** "Sweep [integration] for context", "pull context from [integration]",
"update the brain from [integration]", or any time someone says they've added
significant new content to a connected platform.

**Re-run:** Safe to re-run anytime. Each run compares what's in the integration
against what's already in the brain and updates only what's changed or missing.

---

## Core principle: the retrieval guarantee

Every piece of context this skill saves must have a defined path back to the
surface. Before writing any file, answer two questions:

**When will this be needed?**
Name the specific conversation type, task, or trigger that would make this
context relevant. Be specific: "when someone asks about briefing," not "when
relevant."

**How will it get loaded?**
Choose one of these mechanisms and implement it:
- **INDEX.md routing** — rich entry with explicit "use this when" triggers
- **Frequent-file cross-reference** — a pointer added to a file that's already
  read often (team file, account.md, a skill's SKILL.md)
- **Session-open hook** — a routing rule added to the session-open routine
  for context that should always load for a specific conversation type
- **Active surfacing** — tell the user in this turn, so they don't have to
  wait for retrieval

If you can't answer both questions, the context is not ready to be filed.
File it as a stub with a note, or surface it directly in the response instead.

---

## Phase 1 — File system audit

Before touching the integration, understand what already exists and what's
missing.

### 1a. Map existing context
Read `/agent/INDEX.md` to get the full list of what's in the brain.
Categorize existing files by type:

| Type | Where it lives | Examples |
|---|---|---|
| Person context | `/agent/brain/team/*.md` | Team files, role notes, work style |
| Creative strategy | `/agent/brain/creative/` or `/agent/brain/brand/` | Account docs, design system, briefs |
| Process / SOP | Anywhere under `/agent/brain/` | Playbooks, workflows, how-to docs |
| Org structure | `/agent/brain/team/overview.md` (or equivalent org map file) | Teams, relationships, alliances |
| Product / roadmap | Referenced in team files, conversations | Current priorities, decisions |
| Research | Anywhere under `/agent/brain/` | Audience insights, competitive intel |
| Integration-specific | `/agent/brain/integrations/<name>/` | Capabilities, activation plans |

### 1b. Identify gaps
Build a gap list: what SHOULD exist in the brain but doesn't?

Check for these common high-value gaps:
- [ ] Creative strategy SOP or process document
- [ ] Audience / ICP research or personas
- [ ] Brand voice guidelines beyond what's in brand context
- [ ] Competitive intelligence
- [ ] Campaign structure or naming conventions (beyond what's in account.md)
- [ ] Team process docs (how they run sprints, how they brief, how they review)
- [ ] Product decisions or principle documents
- [ ] Onboarding or setup guides that capture org knowledge
- [ ] Meeting notes or async updates with strategic decisions

For each gap, note it. The sweep will look for content to fill it.

---

## Phase 2 — Integration deep sweep

Query the integration systematically. The goal is not to read everything —
it's to find what's worth bringing into the brain.

### Sweep strategy by integration type

**Notion:**
- Search for pages with titles matching gap categories (SOPs, guides, strategy, research, audience, brand, process)
- Query all databases for structured information (CRM-style, planning docs, asset trackers)
- Look for pages authored or owned by known team members
- Flag pages with high word count and structured headings — those are usually the substantive docs
- Skip: meeting notes older than 90 days, one-off pages with < 200 words, archived content

**Linear:**
- Read project descriptions (these often contain strategy context)
- Read initiative updates (these capture decisions and direction)
- Look for issue descriptions with substantial context (not just "fix bug")
- Check cycle retrospective notes if they exist
- Skip: one-line issues, automated entries, closed tickets older than 60 days

**GitHub:**
- Read READMEs for every active repo
- Read wiki pages if they exist
- Read PR descriptions for architectural decisions (look for "because", "we decided", "the reason")
- Look for ADR (Architecture Decision Record) files
- Skip: generated files, package manifests, changelogs, minor bug fix PRs

**Slack:**
- Read pinned messages in channels the integration has access to
- Look for messages with links to key documents
- Find recurring decision language ("we decided", "going forward", "the policy is")
- Skip: casual conversation, reactions-only threads, anything > 90 days old

**General signals for high-value content:**
- Long-form text with structure (headings, numbered lists, tables)
- Multiple people referenced or tagged
- Dates suggesting it's current (< 90 days) or foundational ("v1", "established")
- Words like: SOP, process, how we, guide, decision, policy, strategy, because,
  background, context, overview

**Skip signals:**
- Mostly links with no surrounding text
- Appears auto-generated or template-filler
- Single author, created and never updated
- Duplicates something already in the brain

---

## Phase 3 — Context classification

For each piece of content found in Phase 2, classify it before doing anything.

### Classification dimensions

**Type** (where it belongs):
- `person` → enriches a team file
- `process` → new brain file under `/agent/brain/` + skill SKILL.md reference
- `creative_strategy` → enriches `/agent/brain/creative/` or `/agent/brain/brand/`
- `org_structure` → enriches `/agent/brain/team/overview.md` (or equivalent org map file)
- `product` → enriches relevant team files or creates new brain file
- `research` → new brain file, indexed for briefing and analysis tasks
- `platform_usage` → enriches `/agent/brain/integrations/<name>/activation.md`

**Retrieval trigger** (when it's needed):
- `always_creative` — any creative task: briefing, hook writing, concept work
- `always_account` — any account-facing analysis
- `person_specific` — load when this specific person is in the conversation
- `task_specific` — load for a specific task type (e.g., "when writing a brief")
- `on_request` — valuable but not frequently needed; INDEX it well and surface on demand

**Freshness** (how to handle updates):
- `evergreen` — foundational, changes rarely; overwrite on update
- `living` — updated frequently; append with date or maintain a log
- `snapshot` — one-time capture; preserve as-is, note the date

---

## Phase 4 — Dispersal

For each piece of classified content, write it to the right location
and wire the retrieval guarantee immediately.

### Where things go

**Person context:**
Enrich the relevant team file directly. Add a section or update existing
sections. Don't create a separate file — the team file is already read when
that person shows up. The context will be retrieved automatically.

Example: Found a Notion doc by [team member] about how they run integration reviews.
→ Add to [person].md under "Process notes" with a summary and link to the
full doc.

**Process / SOP content:**
Write to `/agent/brain/<category>/<name>.md`.
Then add a reference in the SKILL.md of any skill that would use this process.
If a skill is about briefing, it should reference the creative SOP. If a skill
is about onboarding, it should reference the integration playbook.

Example: Found a Notion page with the full creative briefing SOP.
→ Write to `/agent/brain/creative-sop.md`
→ Add reference in the briefing skill (if one exists) or note it in INDEX.md
  with trigger: "use this when writing briefs or creative strategy docs"

**Creative strategy content:**
If it's account-specific, write to `/agent/brain/creative/` or the most relevant brain subfolder.
If it's brand-level, write to `/agent/brain/brand/`.
Add a cross-reference in `account.md` so it gets picked up in
account-facing sessions.

**Org structure content:**
Enrich `/agent/brain/team/overview.md` (or equivalent org map file) directly. This file is read when
cross-team dynamics are at play. The context will be retrieved naturally.

**Product / roadmap content:**
Enrich the relevant team files (the PM or lead who owns this area).
If it's significant enough to stand alone, create `/agent/brain/product/<name>.md`
and add a pointer in the relevant team files.

**Research content:**
Write to `/agent/brain/research/<name>.md`.
Add a reference in the INDEX with trigger: "use when briefing, strategy, or
audience work is happening."

### Handling duplicates and conflicts

- If content overlaps with what's already in the brain: enrich the existing
  file rather than creating a parallel copy. Duplicate context is worse than
  no context — it creates confusion about which version is canonical.
- If the integration content directly contradicts existing brain content:
  surface the conflict in the sweep report. Do not silently overwrite. Ask
  which is correct.
- If content is substantially similar but more detailed: update the existing
  file with the additional detail, noting the source.

---

## Phase 4b — Gap resolution (no gap leaves unassigned)

Every gap identified in Phase 1b must be resolved before the sweep ends.
A gap that gets noted but not assigned to a retrieval layer will never be filled.

For each gap, one of three outcomes:

**Outcome A — Gap filled by the integration.**
Content was found. Disperse it (Phase 4), assign a retrieval layer (Phase 5).
Done.

**Outcome B — Gap not filled, but content could exist.**
The integration didn't have it, but it plausibly exists somewhere.
Assign it to a specific layer anyway:
- If it's foundational enough that the next conversation would benefit from
  it: add it to Layer 1 as a named slot with a stub file, so the system knows
  to look for it and the user knows it's missing.
- If it's important but not urgent: write a clear entry in the INDEX with
  "MISSING — if you have this, share it and I'll add it" in the note.
- Do not write a vague open thread. Name the specific document or format
  that would fill the gap, and where it would live when it arrives.

**Outcome C — Gap not applicable.**
After deeper inspection, this gap doesn't apply to this org. Remove it from
the gap list with a note explaining why (e.g., "no competitive intel file
needed — they operate in a category with no direct competitors").

No gap leaves the sweep without an outcome assigned.

---

## Phase 5 — Retrieval wiring (the critical phase)

This is what separates a useful context sweep from an expensive filing exercise.

For every piece of context added, implement at least one retrieval guarantee.

### Mechanism 1: INDEX.md entry with explicit routing cues

Every new file gets an INDEX.md entry. But the entry must include:
- Rich aliases covering every way someone might ask about this topic
- A **"Use this when:"** field naming specific conversation types, tasks,
  or trigger phrases
- A **"Also read with:"** field naming related files that should be loaded
  together with this one

Example of a weak INDEX entry:
```
note: Creative SOP document from Notion.
```

Example of a strong INDEX entry:
```
note: Step-by-step creative briefing process, documented by the team.
      USE THIS WHEN: writing a brief, starting a creative concept, someone
      asks how we approach creative strategy, hook writing, concepting sessions.
      ALSO READ WITH: brand context, account.md, any brief template.
```

The "use this when" field is what makes INDEX.md a routing surface instead
of a file list.

### Mechanism 2: Cross-references in frequently-read files

The most reliable retrieval path: add a pointer in a file that's already
being read regularly.

Files that get read in most sessions:
- Team files (read whenever that person is in the conversation)
- `account.md` (read in account-facing sessions)
- `team/overview.md` (read in cross-team situations)
- Skill SKILL.md files (read when that skill activates)

When you add context that's relevant to one of these files, add a pointer:
```
## See also
- Creative SOP: /agent/brain/creative-sop.md (read before writing briefs)
- Integration playbook: /agent/brain/integration-playbook.md
```

This creates a retrieval path that doesn't depend on keyword matching.

### Mechanism 3: Session-open hooks

For context that should load for ALL conversations of a certain type,
propose a session-open addition. Write it as a concrete rule addition to
`/agent/user.md` (for org-wide triggers) or note it clearly in the sweep
report as a manual step for the workspace admin to review.

Example: "If this integration's creative SOP should always load when a
briefing conversation starts, add to session-open: if first message contains
briefing, hook, or creative concept keywords → also read /agent/brain/creative-sop.md"

Don't silently add session-open rules. Surface them and ask for approval —
session-open runs on every conversation and bad routing rules have wide impact.

### Mechanism 4: Open thread closure

After dispersal, scan all conversation one-pagers in
`/agent/brain/conversations/*/one-pager.md` for open threads.

Look for threads where the newly found context would be directly useful:
- A conversation where someone asked about the creative process but no
  SOP existed yet → note in that one-pager that the SOP now exists
- A conversation where someone asked about a team member's background and
  the answer was "limited context" → update their team file and close the thread

This is how context that was pulled in for the future also helps the past.

### Mechanism 5: Immediate surfacing

Some context is so relevant to the current moment that it shouldn't wait
for future retrieval. Surface it now in the sweep report.

Signs that context should be surfaced immediately:
- It directly answers a question from the current or recent conversations
- It contradicts or updates something in a recent conversation
- It's relevant to work that's actively in flight right now (check one-pagers)

---

## Phase 6 — Sweep report

Return a visible summary to the user. This serves two purposes:
1. Makes the work visible so they trust the system is building something real
2. Tells them exactly when they'll see each piece of context again

**Format:**

---

**[Integration] context sweep — what I found and where it went**

**Added ([N] things):**

- **[Name of context]** — [1 sentence on what it is]
  → [Layer 1 / Layer 2 / Layer 3] — you'll see this when: [specific trigger]

[Repeat for each significant addition]

**Enriched:**
- **[Person or area]** — [what was added in one sentence]

**Layer 1 additions (always-loaded — confirm these):**
[List any new Layer 1 additions with one sentence on why each warrants
always-loading. These need explicit confirmation before they take effect.
If none: omit this section.]

**Gaps — assigned and handled:**
- **[Gap name]** — [wasn't found in this integration]
  → [Layer 2: indexed as "MISSING — share X and I'll add it" /
     Layer 1 stub created and waiting /
     Not applicable because Y]

**One conflict to resolve:**
[If any. Be specific. "The integration says X, the brain currently says Y.
Which is right?" If none: omit this section.]

---

Do NOT include:
- File paths (say "your creative briefing process" not a filesystem path)
- Technical language about the brain, INDEX.md, or skill files
- A list of every minor update — only significant context worth knowing about
- Gaps listed as "open" — every gap gets an outcome in this report

---

## Step 6b — Initialize quirks and usage files (if data layer exists)

If a data layer has been built for this integration, confirm that both of these
files exist. If they don't, create them now with the standard header.

**`/agent/brain/integrations/<name>/quirks.md`**
```markdown
# [Integration] Quirks

> Read this file before any session involving this integration.
> Layer 1 — always loaded when this platform is active.
> Protocol: /agent/brain/integrations/QUIRKS-PROTOCOL.md

*No quirks documented yet. Add entries as they are discovered.*
```

**`/agent/brain/integrations/<name>/usage-patterns.md`**
```markdown
# [Integration] Usage Patterns

> Updated after sessions involving this integration's data layer.
> Layer 2 — loaded when integration data layer is in use.
> Protocol: /agent/brain/integrations/USAGE-FEEDBACK-PROTOCOL.md

*No patterns documented yet. Patterns accumulate from usage.*
```

Also: check the quirks file for any `unhandled` entries from previous runs.
If any exist, surface them in the sweep report as priority items.

---

## Step 7 — Update the integration activation plan

Append a "Context sweep" section to
`/agent/brain/integrations/<name>/activation.md`:

```markdown
## Context sweep (as of [date])

### Added to brain
| Context | Type | Layer | Trigger |
|---|---|---|---|
| [name] | [type] | [1/2/3] | [when it loads] |

### Enriched
| File | What changed |
|---|---|
| [file] | [what was added] |

### Layer 1 additions
[List any new always-loaded documents, with confirmation status.
 "Proposed" = surfaced to user, not yet confirmed.
 "Confirmed" = user approved, now always-loaded.]

### Gap resolution
| Gap | Outcome | Layer |
|---|---|---|
| [gap name] | [filled / stub created / not applicable] | [1/2/3/n-a] |

### Open threads closed
[List of conversation one-pagers updated with newly available context]

### Conflicts surfaced
[Any contradictions between integration content and existing brain content]
```

Update `/agent/INDEX.md` for every new file created.

---

## What to do when the integration has too much content

Some integrations (especially Notion) have hundreds of pages. Don't try to
sweep everything in one pass.

**Prioritization rules:**
1. Content that fills a known gap > content that enriches existing context
2. Content about people in active conversations > content about anyone else
3. Content about current projects (< 90 days) > content about past work
4. Structured docs (SOPs, guides) > unstructured notes

**If the scope is very large:**
Sweep the highest-priority category, then tell the user: "I've pulled in the
creative strategy docs. There's also [X] in [integration] I haven't touched
yet — want me to sweep that next?" Let them direct the depth.

---

## The retrieval layer model

After this skill runs, every piece of context has an assigned retrieval layer.
Nothing leaves unassigned.

```
Layer 0 — Always loaded, every session
  Lives in the system prompt or /agent/user.md.
  Use only for org-wide behavioral rules and standing instructions.
  Not a context destination — a behavioral layer.

Layer 1 — Always loaded for relevant session types
  Context embedded in or cross-referenced from files that are always read
  for a given conversation type (team files, account.md, overview.md,
  skill SKILL.md files, session-open routine reads).
  → Reliability: very high. Gets loaded every matching session.
  → When to use: foundational context that would be useful in most
    conversations of a type. Creative SOPs, core process docs, key
    person context, account-level strategy.
  → Gate: Layer 1 additions should be few and far between. Every new
    Layer 1 document adds load to every relevant session. Approve them
    deliberately. In early integration setup, more Layer 1 additions are
    expected — things that establish the foundation. Over time, the bar
    should rise.

Layer 2 — Keyword-triggered via INDEX.md
  Context loaded when a conversation contains matching triggers.
  → Reliability: high when the INDEX entry has explicit "use this when"
    guidance. Low when the entry is just a title and aliases.
  → When to use: important context that's specific to certain task types
    or topics — not every session, but reliably for the right ones.

Layer 3 — On-demand
  Context that's too specific or infrequent for automatic loading.
  → Reliability: depends on surfacing proactively or user asking.
  → When to use: specialized reference material, historical context,
    rarely-needed details.
  → Warning: Layer 3 only = at risk of never being retrieved. If something
    is Layer 3 and high-value, consider whether to surface it immediately
    in the sweep report instead of filing it.
```

### Layer assignment rules

**Assign Layer 1 when:**
- It's genuinely foundational — a creative SOP, an org process doc, the way
  the team briefs, core brand principles — things that shape every conversation
  of a type
- Losing this context would noticeably degrade responses in regular sessions
- It doesn't exist yet in the brain (new Layer 1 documents are most justified
  when filling a gap, not when adding a third version of something already there)
- The person connected the integration specifically to make this context available

**Propose Layer 1 additions explicitly, don't silently add them.**
Layer 1 changes affect every matching session. Surface the proposal in the
sweep report with one sentence on why this warrants always-loading. Let the user
confirm. For new integration setups, this confirmation can be lightweight —
"I'm adding the creative SOP as always-loaded for briefing sessions, let me
know if you'd rather it be on-demand" — but it should always be named.

**Assign Layer 2 when:**
- Important but specific — relevant for some conversations, not all
- Can be reliably triggered by keywords or task types
- The INDEX entry can be written with enough specificity to route correctly

**Assign Layer 3 when:**
- Specialized or infrequent
- Better surfaced proactively when relevant than always loaded
- Historical or reference material

**If unsure between Layer 1 and Layer 2:**
Default to Layer 2 with a strong INDEX entry. Promote to Layer 1 only after
it's been useful in practice. Early integration setup is the exception —
when the brain is sparse, more Layer 1 is appropriate to establish the foundation.

---

## Skill changelog

| Date | Version | Change |
|---|---|---|
| 2026-05-09 | v1.1 | Added gap resolution rule: no gap leaves unassigned. All gaps get a layer outcome or explicit "not applicable." Layer 1 additions require explicit surface + confirmation. Layer assignment rules formalized. Sweep report updated to show gap outcomes and Layer 1 proposals. |
| 2026-05-09 | v1.0 | Initial version. Three-phase model: sweep, disperse, wire retrieval. Runs as third layer of integration connection flow after onboarding + activation. |
