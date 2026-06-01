---
name: setup-runneth-classic
description: |
  First-run setup for the runneth-classic pack. Walks the user through configuration
  one question at a time, capturing surface preference, winner-definition, Meta/TikTok
  connection status, integrations intent, watched brands, customer voice, and optional
  uploads, then hands off to brand-audit to build the brand foundation. Triggered
  automatically by runneth-classic's post-install step. Can be re-invoked any time
  with "set up runneth", "reconfigure runneth", or "rerun runneth setup".
user-invocable: true
---

## Purpose

Configure runneth-classic for the workspace. The pack's behavioral rules read the files this setup writes — surface preference tunes inline-vs-artifact defaults, winner-definition tunes "what's working" answers, watched brands feed competitor research, customer voice intent feeds brand-audit and downstream creative work.

Runs once at install. Can be re-invoked any time the user wants to update what was captured.

## CRITICAL: This is a conversation, not a form

**Ask ONE question per turn. Wait for the user's response. Save what they said. Then ask the next question.**

Do not list multiple steps in a single message. Do not show the user a roadmap of "Step 2, Step 3, Step 4..." Do not preface answers with "I'll now ask about X, then Y, then Z." Each turn is one question, conversational, like a senior strategist working through onboarding with a new client.

**Anti-pattern (do not do this):**

> Setting up Runneth. I'll ask a few questions then build your brand foundation.
> Step 2 — Surface preference: Slack, web, or both?
> Step 3 — Winner definition: Your workspace goal is set to ROAS...
> Step 4 — Connection check: Meta is connected...
> Once you answer steps 2 and 3, I'll move to 5-8...

**Correct pattern (do this):**

Turn 1 — Welcome (one sentence). Then the first question.
[User responds.]
Turn 2 — Save the answer. Brief acknowledgment. Then the next question.
[User responds.]
Turn 3 — Save. Acknowledge. Next question.

And so on. One question, one turn, save, move on.

## Tone

- Warm, direct, like a senior strategist who's done this onboarding hundreds of times.
- Confident inference when you have signal (winner-definition, connection status). Surface what you already know rather than asking when you don't need to.
- Acknowledge briefly when the user answers — one short phrase, not a paragraph.
- Skip the framing language. Don't say "Now I'll ask about your watched brands" — just ask about them.

## Execution

### Workspace identification first

Before any questions: resolve the active workspace. Use the default workspace from Motion context. Save per-workspace files under `/agent/brain/runneth-classic/workspaces/<workspace-slug>/`.

If the user is running setup against a different workspace than the default, ask which workspace once (this is one of the conversational turns) and use that.

### Turn 1 — Welcome + first question (combined, short)

The welcome and the surface-preference question happen in the same turn. Don't make the user respond just to a welcome.

Example:

> "Setting up your Runneth. Quick — where will you mostly use me, Slack, the web app, or both?"

Wait for response. When they answer, save to `/agent/brain/runneth-classic/workspaces/<slug>/surface-preference.md`:

```markdown
# Surface preference
Captured: <ISO date>
Primary surface: <slack | web | both>
```

Then continue to the next turn.

### Turn 2 — Winner definition (inferred + confirmed)

Before this turn, run these silently in the background:

1. `motion workspace-goal` → check `preferredConversionMetric` for Facebook (Meta) and TikTok entries
2. `motion reports` → list saved reports
3. For each saved report, examine `tableKpis`, `sortBy`, and `filters` to infer the metrics the user actually tracks
4. If workspace-goal references a custom conversion, resolve via `motion meta custom-conversion-metrics`

Then ask in one sentence with the inference:

> "Looks like ROAS is your headline metric — your workspace goal is set to it and your saved reports lean on it. Spend shows up as a secondary signal. So I'd default winners to: ROAS as the efficiency call, spend as the scale check. Sound right, or do you grade differently?"

When they respond:

- Confirmation → save the inferred definition
- Correction → save what they actually said, verbatim

Save to `/agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md`:

```markdown
# Winner definition for <workspace>
Captured: <ISO date>

Primary signal: <spend | conversion value | ROAS | custom conversion | other>
Secondary signal: <if applicable>
Custom conversion ID: <if applicable>
User's exact words: "<verbatim>"
```

If no Meta or TikTok account is connected, the inference will be thin. Just ask directly:

> "Heads up — I don't see a Meta or TikTok account connected yet. For now I'll default winners to spend as the primary, ROAS as the secondary. Does that match how you grade?"

### Turn 3 — Connection check (silent or one-line ask)

Pull `motion workspace-goal` results.

- **Both Meta and TikTok connected** → skip this turn entirely, go to the integrations inventory turn
- **Only Meta connected, or only TikTok connected** → skip this turn, go to integrations inventory
- **Neither connected** → ask:

> "Your Meta and TikTok accounts aren't connected yet. Want to connect now? Without one, performance work won't have data to pull."

If they want to connect, surface the standard Motion connection flow. If not, continue and note the gap in the closing.

### Turn 4 — Integrations inventory

```
"What tools does your team use day-to-day, even ones I'm not connected to yet?
Slack, Notion, HubSpot, Gong, anything else — name each one and how you use it.
I'll save it so when you connect any of them, I already know how you actually work.

(Or skip — you can add them later.)"
```

Open-ended response. Parse each named tool. Save to `/agent/brain/runneth-classic/integrations-intent.md` (ORG-LEVEL, not workspace-scoped):

```markdown
# Integrations Intent
Captured: <ISO date>

## <tool name>
Connected: <yes | no>
How we use it: <user's description>
Specific surfaces / IDs / channels: <if mentioned>
```

If the file already exists, merge — don't overwrite. New entries append; existing entries update only if the user explicitly contradicts the prior entry.

Acknowledge briefly: "Got it, saved [tool names]."

### Turn 5 — Watched brands

```
"Any brands worth keeping an eye on? Two buckets:
- Inspo brands — admire, follow for creative ideas, want to learn from
- Direct competitors — actively differentiating against

Drop names or skip."
```

For each name given, call `motion search-brands --search-term "<name>"` to resolve the brand ID. If multiple matches, surface candidates and ask which one — that's an extra conversational turn.

Save to:
- `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/inspo.md`
- `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/competitors.md`

Per file:

```markdown
# Watched brands — <Inspo | Competitors>
Captured: <ISO date>

## <Brand Name>
Brand ID: <motion brand ID>
Domain: <if returned>
Why we're watching: <user's reason if given>
Added: <ISO date>
```

Pass the competitor list forward to brand-audit's setup so it pre-fills the competitor shortlist there.

Acknowledge: "Saved. Tracking [N] inspo and [M] competitor brands."

### Turn 6 — Customer voice

```
"Where do customer reviews live? Trustpilot, Amazon, Reddit, an internal doc —
just name the sources. Also: any themes you specifically watch (shipping complaints,
gift-purchase signals, comparison-to-competitor), and any non-public customer voice
I should use (Gong call quotes, internal feedback)."
```

Save to `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice-intent.md`:

```markdown
# Customer voice intent
Captured: <ISO date>

## Review sources
- <source 1>

## Themes to watch
- <theme 1>

## Non-public sources
- <Gong calls, internal docs, etc.>
```

Pass review sources forward to brand-audit.

### Turn 7 — Optional uploads (conditional)

Check `./uploads/` for files dropped during setup using `ls ./uploads/`.

**If files exist:**

```
"I see <N> files in uploads. Want me to classify them? Each can be:
- Brand context (voice, positioning, audience docs)
- Legal guidelines (claims rules, compliance docs)
- Competitor creative (competitor ads, references)
- Reviews / VOC (review CSVs, interview transcripts, Gong quotes)
- Other (tell me what)"
```

For each file, classify and save to the right path:
- BRAND_CONTEXT → `/agent/brain/runneth-classic/workspaces/<slug>/brand-context-upload.md`
- LEGAL_GUIDELINES → `/agent/brain/runneth-classic/workspaces/<slug>/compliance-notes.md`
- COMPETITOR_CREATIVE → `/agent/brain/runneth-classic/workspaces/<slug>/competitor-references/<filename>`
- REVIEWS → `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice/reviews-upload.md`
- Other → ask once where it should live, save accordingly

**If no files in uploads:** skip this turn entirely.

### Turn 8 — Hand off to brand-audit

```
"Now I'll build your brand foundation — products, customer voice, keywords, the
competitor work, and the persona × angle × stage matrix. Takes about 10–15 minutes.
I'll come back with your first prompts when it's done."
```

Invoke the `setup-brand-audit` skill. Pre-populate with:

- Brand site URL (brand-audit will ask if not captured)
- Review sources from Turn 6
- Competitor shortlist from Turn 5
- Slack channels for refresh ping (brand-audit will ask)

Brand-audit runs its full Foundation layer and writes to `/agent/brain/brand-audit/<workspace-slug>/`.

### Turn 9 — Closing handoff (automatic, after brand-audit completes)

When brand-audit reports completion, post into the same conversation thread. Read the resulting `strategy.md` to grab the primary persona name and pain for the example prompts.

Sourced from `post-install-intro.md` at the pack root, with token substitution:

```
You're set up. Foundation built for <Brand Name>.

What's now active automatically:
- Plan mode — I'll show you what I'm about to do before doing it
- Brain search — ask "do we have anything on X?" for any topic
- Team profiles — I'm building a profile of you and your team as we work
- Integration intent — I know what tools your team uses and how
- Health monitoring — if any tool or routine stops working, I'll tell you
- Roles + permissions — admins and members are scoped

What's available on demand:
- Performance deep-dives, paid strategy briefs, weekly performance decks,
  competitor scans, creative briefs, hook and concept generation

When you want any of those running on a schedule, just say so.

Try one:
1. Pull this week's top performers from your account
2. Give me 5 hooks for <persona from strategy.md> facing <pain from strategy.md>
3. Show me what <inspo brand from Turn 5> is running right now
```

## How to handle multi-answer turns

If the user answers multiple questions in one message ("Slack, and winners are spend"), that's fine — parse all of them and save each. Don't make them re-answer. Then move to the next unanswered question without re-asking the ones they already covered.

## How to handle "skip" or "next"

If the user says "skip" / "next" / "pass" / "n/a" on any question, save an explicit "skipped" marker and move on. Don't re-ask. They can always come back via "update my setup."

## How to handle off-topic asks during setup

If the user asks something unrelated mid-setup ("what's your favorite hook tactic"), answer briefly then return to the setup question they were on. Don't lose state.

## Re-invocation

If the user says "set up runneth," "reconfigure runneth," or "rerun runneth setup," re-run the entire flow. Each turn's save updates the existing file rather than creating a duplicate.

For partial updates ("update my watched brands," "change my winner definition"), jump directly to the relevant turn and update only that file.

## Constraints

- Do not invoke this skill on every conversation. One-time setup, re-runnable only on explicit request.
- Do not auto-activate any routines. Opt-in per the pack's design.
- Do not assume a Meta account is connected. Check workspace-goal first.
- Do not save any file in `./uploads/` itself. Uploads are read-only.
- Update `/agent/INDEX.md` after Turn 8 completes with entries for all files written.
- **Do not list multiple turns / steps / questions in a single message. One question per turn, every time.**
