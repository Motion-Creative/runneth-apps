# Integration Usage Feedback Protocol

## What this is

When someone uses a CLI or integration, that usage is a signal. Which commands
get run, what the output gets used for, what they ask about next, what they
ignore — all of it shapes what the CLI should prioritize, what the defaults
should be, and how the experience should evolve for this person over time.

This protocol defines what gets tracked, where it lives, and how it feeds back
into the CLI, the SKILL.md, and the activation proposal the next time someone
sets up this integration.

---

## Where usage data lives

Each integration gets a `usage-patterns.md` file at:
```
/agent/brain/integrations/<name>/usage-patterns.md
```

This is **Layer 2** in the retrieval model — loaded when a conversation involves
this integration's CLI or when someone asks how to use the integration.

---

## What gets tracked

Usage patterns are observed from conversation context, not from telemetry.
Every time a CLI command is run or an integration is used in a session:

### Command-level signals
- Which commands are run and in what sequence
- Which flags get used vs. which get ignored
- What `--sort`, `--metric`, `--preset` values get chosen most often
- Whether `--compact` gets used (signals agent-driven vs. human-driven use)
- Whether output is piped (| jq, > file) vs. read directly

### Output signals  
- What the user does with the data (asks a follow-up question, writes a brief,
  makes a decision, shares it somewhere)
- Which metrics or fields they reference after seeing the output
- Whether they narrow or expand a query after seeing results
- What they ask next that suggests the output didn't fully answer their question

### Friction signals
- Commands that error and get retried with different flags
- Queries where the user says "hmm", "that's not quite right", "can you filter"
- Outputs that prompt "what does X mean" or clarifying questions
- Places where the user routes around the CLI and asks in natural language instead

### Non-use signals
- Commands that exist but never get run
- Proposed workflows from activation that don't get followed up on
- CLI features that users consistently ask about in natural language rather
  than using the command directly

---

## Usage patterns entry format

```markdown
## [Command or workflow name]

**Last observed:** YYYY-MM-DD
**Use frequency:** high / medium / low / unused
**Primary user(s):** [names if person-specific patterns]

**How it's actually used:**
[What the person does with this command in practice — be specific.
 "Runs ads --preset last_30d --compact every Monday morning before
 the weekly brief" is specific. "Uses ads command for analysis" is not.]

**What they do with the output:**
[What action follows — brief writing, Slack message, decision, further filtering]

**Friction observed:**
[Any points where the command didn't quite fit what they needed]

**Personalization signals:**
[Consistent flag choices, metric preferences, date patterns that reveal
 how this person specifically uses the command]

**Suggested improvement:**
[One specific thing that would make this command work better for observed usage.
 Tie it to a concrete observation, not a hypothesis.]
```

---

## How usage feeds back into the CLI

Usage patterns drive three types of improvements:

### 1. Default changes
If a user consistently overrides a default — always passes `--sort thumbstop_ratio`
when the default is `spend`, always uses `last_14d` when the default is `last_30d` —
that's a signal the default is wrong for them.

Action: Update the SKILL.md agent workflow section with person-specific defaults.
Note them as personalization hints: "For [person]: default sort is [metric]."

If a pattern appears across multiple users, it's a signal the CLI default
itself is wrong. Flag it in the usage-patterns.md as a candidate for a code
change. If the pattern is strong enough (3+ users, consistent across sessions),
write it as a skill candidate (SC-NNN) and route through the learning loop.

### 2. Compound command priority
The compound commands proposed in the activation proposal should reorder
based on what actually gets used.

If `stale` gets run every week and `top` never gets run, the next activation
proposal for this integration should lead with `stale`. If a proposed workflow
never gets followed up on, it gets demoted or replaced.

Update the activation plan's "Proposed workflows" section after meaningful
usage data accumulates (3+ sessions with the integration).

### 3. New command candidates
When a user consistently asks for something in natural language that could be
a compound command — "which of my active ads haven't had a comment in a week",
"show me which TikTok concepts had their best week in Q1" — that's a compound
command waiting to be written.

Write it as a skill candidate with `type: cli-command` and the integration name.
Route through the standard SC-NNN learning loop. When evidence_count ≥ 3,
propose building it and adding it to the CLI.

---

## How usage feeds back into the SKILL.md

The SKILL.md for each integration CLI has an "Agent workflows" section.
After meaningful usage data accumulates, update this section to reflect
how the integration is actually being used:

- Reorder proposed workflows by observed frequency
- Add person-specific workflow notes: "[Person] typically runs shift then breakdown
  in sequence — run both when she asks about performance changes"
- Remove or deprioritize workflows that never get followed up on
- Add context about what users do with outputs: "The stale command output
  usually goes into a brief or a Slack message — format the response accordingly"

This makes the SKILL.md progressively more accurate to actual behavior rather
than initial proposals.

---

## Personalization signals

Some usage patterns are person-specific and should feed into that person's
team file rather than the shared usage-patterns.md.

Person-specific patterns to capture in team files:
- Consistent metric preferences ("always sorts by thumbstop, not spend")
- Workflow cadence ("runs the weekly shift command every Monday")  
- Output preferences ("always pipes to jq, prefers compact output")
- Question patterns ("tends to ask about concept-level patterns, not individual ads")
- What they do after getting data ("next step is always a brief, not a report")

When a person-specific pattern is strong enough (appears in 3+ sessions), add
it to their team file under a "Working patterns with [integration]" section.
This means the next time they're in a session involving this integration, their
preferences are already loaded.

---

## The feedback loop in practice

```
User runs CLI command
        ↓
Runneth observes: command, flags, output, what user does next
        ↓
During session: use signals to personalize follow-up responses
  (if they always use thumbstop, frame analysis around thumbstop)
        ↓
After session: update usage-patterns.md with new observations
  Update person's team file if person-specific pattern
  Flag skill candidates if new compound command emerges
  Flag default change candidates if consistent override pattern
        ↓
On integration re-sweep or re-activation:
  Reorder workflows by actual frequency
  Update SKILL.md agent workflows
  Surface any unbuilt compound commands as proposals
        ↓
On learning loop review (evidence_count ≥ 3):
  Promote compound command candidates to build queue
  Promote default changes to CLI code change queue
```

---

## The trust layer: what usage feedback prevents

Usage feedback is also how we catch and prevent the pattern the user named:
a user having to tell us the same thing twice.

When a user corrects a CLI behavior or asks for something the command doesn't do:
1. The correction goes into `corrections.jsonl` (existing mechanism)
2. The underlying CLI gap goes into `usage-patterns.md` as a friction signal
3. If it's a platform quirk, it also goes into `quirks.md`
4. The skill candidate gets written if it's a missing compound command
5. The SKILL.md gets updated immediately with the correct behavior pattern

The difference between corrections.jsonl and usage-patterns.md:
- corrections.jsonl captures what was wrong and what's correct — the fact of the correction
- usage-patterns.md captures the pattern of use that led there and the improvement — the fix

Both are needed. One ensures the correction is remembered. The other ensures
the system improves so the correction doesn't need to happen again.
