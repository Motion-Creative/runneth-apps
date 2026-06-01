---
name: setup-runneth-classic
description: |
  First-run setup for the runneth-classic pack. Walks the user through a 10-step
  configuration conversation that captures surface preference, winner-definition,
  Meta/TikTok connection status, integrations intent, watched brands, customer voice,
  and optional uploads, then hands off to brand-audit to build the brand foundation.
  Triggered automatically by runneth-classic's post-install step. Can be re-invoked
  any time with "set up runneth", "reconfigure runneth", or "rerun runneth setup".
user-invocable: true
---

## Purpose

Configure runneth-classic for the workspace. The pack's behavioral rules read the files this setup writes — surface preference tunes inline-vs-artifact defaults, winner-definition tunes "what's working" answers, watched brands feed competitor research and ongoing dossiers, customer voice intent feeds brand-audit and downstream creative work.

This setup runs once at install. It can be re-invoked any time the user wants to update what was captured.

## Execution

### Workspace identification first

Before any questions: resolve the active workspace. Use the default workspace from Motion context. Save all per-workspace files under `/agent/brain/runneth-classic/workspaces/<workspace-slug>/`.

If the user is running setup against a different workspace than the default, ask which workspace once and use that.

### Phase A: Synchronous configuration

#### Step 1 — Welcome

```
Setting up Runneth for <workspace>. I'll ask a few quick questions, then 
build your brand foundation in the background. Total time: about 15 minutes,
most of it me working while you can step away.

Ready?
```

Wait for confirmation. Then proceed.

#### Step 2 — Surface preference

```
Where will you mostly use me — Slack, the web app, or both?
```

Save to `/agent/brain/runneth-classic/workspaces/<slug>/surface-preference.md`:

```markdown
# Surface preference
Captured: <ISO date>
Primary surface: <slack | web | both>

## Implications for delivery
- <slack>: never default to HTML files; always inline replies; verify artifacts before claiming they're ready
- <web>: inline default for short content, openable handoff for long-form deliverables
- <both>: inline by default, with surface-aware overrides
```

#### Step 3 — Winner-definition (inferred + confirmed)

Silent background pulls:
1. `motion workspace-goal` → check the `preferredConversionMetric` for both Facebook (Meta) and TikTok entries
2. `motion reports` → list saved reports
3. For each saved report, examine `tableKpis`, `sortBy`, and `filters` to infer the metrics the user actually tracks
4. If the workspace-goal references a custom conversion, resolve it via `motion meta custom-conversion-metrics`

Then synthesize a one-sentence confirmation:

```
Looks like ROAS is your headline metric — that's what your workspace goal is set to,
and your saved reports lean on it too. Spend shows up as a secondary signal. So for 
"winners" I'd default to: ROAS as the efficiency call, spend as the scale check.

Sound right, or do you grade winners differently?
```

User confirms or corrects. Save to `/agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md`:

```markdown
# Winner definition for <workspace>
Captured: <ISO date>

Primary signal: <spend | conversion value | ROAS | custom conversion | other>
Secondary signal: <if applicable>
Custom conversion ID: <if applicable>
User's exact words: "<verbatim>"

## How to use this
Read this file before any "what's working / top performers / winners" query.
Re-rank performance pulls by the primary signal. Use the secondary as a tiebreaker
or contextual check, not the lead metric.
```

If no Meta or TikTok account is connected: skip the inference, default to "spend primary, ROAS secondary," note the assumption in the file, and continue.

#### Step 4 — Performance connection check

Pull `motion workspace-goal` results from Step 3 to check what's connected.

- **Both Meta and TikTok connected** → silent, continue
- **Only Meta connected** → silent, continue
- **Only TikTok connected** → silent, continue
- **Neither connected** →

```
Your Meta and TikTok accounts aren't connected yet. Want to connect now? 
Without one of them, performance work won't have data to read.
```

If user wants to connect: surface the standard Motion connection flow. If not: continue, note in the close that they'll need to connect later for performance work.

#### Step 5 — Integrations inventory

```
Quick rundown — what tools does your team use day-to-day, even if Runneth 
isn't connected to them yet? Tell me each tool and how you use it. I'll save 
this so when you connect one later, I already know how you actually work with it.

Common ones (skip what doesn't apply):
- Slack — what channels matter, what's discussed where
- Notion / Google Drive — where brand docs, briefs, decisions live
- HubSpot / Salesforce — what stage data you track
- Intercom / Zendesk — customer support, sentiment work
- Gong / Granola — sales calls, meeting transcripts
- Linear / Jira / Asana — engineering or project work
- Apollo / Clay — prospect / ICP intelligence
- Anything else — name it and how you use it
```

Open-ended response. Parse each named tool and save to `/agent/brain/runneth-classic/integrations-intent.md` (ORG-LEVEL — not workspace-scoped):

```markdown
# Integrations Intent
Captured: <ISO date>

## <tool name>
Connected: <yes | no>
How we use it: <user's description>
Specific surfaces / IDs / channels: <if mentioned>

## <next tool>
...
```

If `integrations-intent.md` already exists, merge — don't overwrite. New entries append; existing entries update only if the user explicitly contradicts the prior entry.

#### Step 6 — Watched brands

```
Any brands you want me to keep an eye on? Two buckets:
- **Inspo brands** — brands you admire, follow for creative ideas, want to learn from
- **Direct competitors** — brands you're actively differentiating against

Drop names for each (or skip — you can add them later). I'll resolve each in 
Motion's ad library so I can pull their ads when you need them.
```

For each name given, call `motion search-brands --search-term "<name>"` to resolve the brand ID. If multiple matches, surface the candidates and ask once which one.

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

#### Step 7 — Customer voice

```
What does customer voice look like for <workspace>? Quick rundown:
- Where do reviews live? (Trustpilot, Amazon, Reddit, internal doc, etc.) 
  — I'll mine them during brand-audit
- Any themes you specifically watch? (e.g. "shipping complaints," 
  "comparison to [competitor]," "gift-purchase signals") — I'll flag these
- Any non-public customer voice I should also use? (Gong call quotes, internal 
  feedback docs, customer interviews) — drop links or names, upload files in the next step

Or skip — brand-audit will work from whatever it can find on the public web.
```

Save to `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice-intent.md`:

```markdown
# Customer voice intent
Captured: <ISO date>

## Review sources
- <source 1>
- <source 2>

## Themes to watch
- <theme 1>
- <theme 2>

## Non-public sources
- <Gong calls, internal docs, etc.>
```

Pass the review sources forward to brand-audit so it doesn't re-ask.

#### Step 8 — Optional uploads

Check `./uploads/` for files dropped during setup. Use `ls ./uploads/` via Bash.

If files exist:

```
I see <N> files in uploads. Want me to classify them? Each can be:
- Brand context (voice, positioning, audience docs)
- Legal guidelines (claims rules, compliance docs)
- Competitor creative (competitor ads, references)
- Reviews / VOC (review CSVs, interview transcripts, Gong quotes)
- Other (something else useful, tell me)
```

For each file, classify and save to the right path:

- BRAND_CONTEXT → `/agent/brain/runneth-classic/workspaces/<slug>/brand-context-upload.md`
- LEGAL_GUIDELINES → `/agent/brain/runneth-classic/workspaces/<slug>/compliance-notes.md`
- COMPETITOR_CREATIVE → `/agent/brain/runneth-classic/workspaces/<slug>/competitor-references/<filename>`
- REVIEWS → `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice/reviews-upload.md` (passes to brand-audit)
- Other → ask once where it should live, then save

If no files in uploads: skip silently.

#### Step 9 — Hand off to brand-audit

```
Now I'm building your brand foundation — products, customer voice, keywords, 
your watched competitors, and the persona × angle × stage strategy matrix. 
This takes 10-15 minutes. I'll come back with your first-try prompts when it's done.
```

Invoke the `setup-brand-audit` skill (already installed via the `brand-audit` use case in the cascade). Pre-populate brand-audit's setup with:

- Brand site URL (ask brand-audit to ask if not captured)
- Review sources from Step 7
- Competitor shortlist from Step 6
- Slack channels for refresh ping (ask brand-audit to ask)

Brand-audit runs its full Foundation layer (brand-intake → product-catalog → review-audit → brand-relevant-keywords → competitor-analysis → creative-strategy-engine) and writes to `/agent/brain/brand-audit/<workspace-slug>/`.

### Phase B: After brand-audit completes (automatic continuation)

#### Step 10 — Closing handoff

When brand-audit reports completion, post the closing message into the same conversation thread. Read the resulting `strategy.md` to grab the primary persona name and pain for the example prompts.

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
3. Show me what <inspo brand from Step 6> is running right now
```

## Re-invocation

If the user says "set up runneth," "reconfigure runneth," or "rerun runneth setup," re-run the entire flow. Each step's save updates the existing file rather than creating a duplicate.

For partial updates ("update my watched brands," "change my winner definition"), jump directly to the relevant step and update only that file.

## Constraints

- Do not invoke this skill on every conversation. It's a one-time setup, re-runnable only on explicit request.
- Do not auto-activate any routines (Monday competitor scan, Friday deck, brand-audit refresh). These are opt-in per the pack's design.
- Do not assume a Meta account is connected. Check workspace-goal first.
- Do not save any file in `./uploads/` itself. Uploads are read-only inputs; saved versions go under `/agent/brain/runneth-classic/workspaces/<slug>/`.
- Update `/agent/INDEX.md` after Phase A completes with entries for all files written during setup.
