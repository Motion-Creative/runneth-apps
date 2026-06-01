---
name: setup-runneth-classic
description: |
  First-run setup for the runneth-classic pack. Does a deep silent pre-discovery
  across Motion brand-context, workspace-goal, saved reports, recent ad performance,
  custom conversions, and the public web, then runs a short conversational onboarding
  that confirms what was discovered and enriches the gaps. Hands off to brand-audit to
  deepen the brand foundation. Triggered automatically by runneth-classic's post-install
  step. Can be re-invoked any time with "set up runneth", "reconfigure runneth", or
  "rerun runneth setup".
user-invocable: true
---

## Purpose

Configure runneth-classic for the workspace. The pack's behavioral rules read the files this setup writes — surface preference tunes inline-vs-artifact defaults, winner-definition tunes "what's working" answers, watched brands feed competitor research, customer voice intent feeds brand-audit and downstream creative work.

This setup is built on one design principle: **Runneth should walk into the conversation already knowing as much as possible.** A senior strategist showing up to onboard a new account does the homework first — they read the brand site, look at recent ads, check what reports the team has, talk to people who've already worked with them. The conversation that follows is confirmation and enrichment, not blank-slate discovery.

Phase 0 does that homework silently. Phase 1 confirms and enriches. The customer feels like Runneth gets them from the first sentence.

## Execution

### Workspace identification first

Before anything: resolve the active workspace. Use the default workspace from Motion context. Save per-workspace files under `/agent/brain/runneth-classic/workspaces/<workspace-slug>/`.

---

## Phase 0 — Pre-discovery (silent, before any user-facing message)

**No user-facing message in this phase.** Run the gathering, build the internal model, then transition into Phase 1 with the synthesis.

### What to gather

Run these in parallel where possible. Be efficient — don't let pre-discovery take more than 90 seconds of wall clock.

**From Motion (always):**

1. `motion brand-context --data-query "brand foundations, fundamentals, product information, competitors, customer voice analysis"` — the workspace's existing brand model. This is the single most important call.
2. `motion workspace-goal` — preferred conversion metric and attribution windows for Facebook and TikTok entries.
3. `motion reports` — list of saved reports with their `tableKpis`, `sortBy`, `filters`.
4. `motion meta custom-conversion-metrics` — custom conversion registry (Meta only; skip if no Meta connection).
5. `motion spend-threshold` — workspace significance threshold.
6. `motion meta insights --date-range last_30d --sort topSpend --limit 50 --include-metrics --include-summaries` — what creatives are actually running on Meta right now, including format mix and messaging themes from summaries.
7. `motion tiktok insights --date-range last_30d --sort-by spend --sort-direction desc --grain ads --limit 30 --include-metrics` — what's running on TikTok (skip if no TikTok connection).
8. **Historical creative library for graveyard inference** — `motion meta insights --date-range last_365d --sort topSpend --limit 500 --include-metrics --include-summaries --group-by creative --include-glossary` — the full year of creative work. This is what we use to infer what was tested and abandoned vs. what's still running.

**From the brain (if exists):**

9. Check `/agent/brain/brand-audit/<workspace>/` — if `strategy.md` and `brand-context.md` exist from a prior brand-audit run, read them.
10. Check `/agent/brain/runneth-classic/workspaces/<slug>/` — if this is a re-invocation, read existing setup files.
11. Check `/agent/brain/runneth-classic/integrations-intent.md` — org-level integrations the team has already named.

**From the public web (when useful):**

12. If `brandUrl` is in brand-context, `WebFetch` the URL → confirm category, positioning, product type. Pull whatever About / How-it-works copy is visible.
13. `WebSearch "<brand name> reviews"` — check whether public review surfaces exist (Trustpilot, G2, Capterra, Amazon, Reddit). Don't read them in depth; just identify their existence so customer-voice questions can be framed correctly.
14. **Social listening / cultural context** — `WebSearch` for category conversations on Reddit, TikTok, X. Use the brand's `brandCategory` and `productCategory` plus the implied persona's pain to seed 2–3 broad queries. Example queries for a SaaS performance-marketing tool: `site:reddit.com performance marketers complaining attribution`, `tiktok performance marketing inside jokes 2026`, `r/marketing biggest frustrations this year`. Capture: emerging language patterns, current frustrations, cultural moments the brand could credibly speak to, what's getting roasted in the category. Save the synthesis to `/agent/brain/runneth-classic/workspaces/<slug>/cultural-context.md` for downstream creative-strategy reads.

### Build the internal model

Synthesize what you have into a working picture. Cover at minimum:

- **What they sell.** Physical product / SaaS / service / marketplace / agency / other. From `productType` and `productCategory` in brand-context, confirmed by the website if fetched.
- **Brand category.** From `brandCategory` in brand-context.
- **Primary persona implied.** From brand-context's customer voice analysis or competitor positioning. May need confirmation but pick the strongest candidate.
- **Customer voice sources likely.** SaaS / B2B → internal sources (Gong calls, support tickets, sales notes). Physical / consumer → public reviews (Trustpilot, Amazon, Reddit). Cross-check with the WebSearch result.
- **Competitors already tracked.** Brand IDs from brand-context's `competitorBrands` array.
- **Workspace goal and attribution.** From `motion workspace-goal`.
- **Inferred winner-definition.** From workspace-goal plus the patterns in saved reports.
- **What creative is currently running.** Format mix, messaging themes, persona tells from the top 30-day creatives.
- **What's been tested and abandoned (the inferred graveyard).** From the 365-day creative library: identify patterns that were tested with meaningful spend then dropped to zero, OR formats/tactics that appeared once or twice and never returned. Group by visual format, asset type, hook tactic, and messaging angle using glossary tags. Distinguish two cases: (a) patterns that peaked then died ("tried at scale, killed") and (b) patterns that were tested once and never iterated on ("tried once, abandoned"). Save the synthesis to `/agent/brain/runneth-classic/workspaces/<slug>/graveyard-inference.md` so Turn 5b can present specific findings rather than asking blank-slate.
- **What's been iterated on heavily (the validated patterns).** From the same 365-day pull: patterns that appear repeatedly across variants, that maintain or grow spend over time, or that show up in multiple campaigns. These are the brand's bench — what the team has signed off on as good.
- **Whether brand-audit has already run.** Yes / no based on `/agent/brain/brand-audit/<workspace>/` existence.

**The graveyard inference is not a confident claim.** Patterns get paused for many reasons — seasonal rotation, creator contract ending, fatigue, a strategist's preference shift. Phase 1 surfaces specific findings as questions, not assertions, and the customer corrects what we got wrong.

### After Phase 0

You now have an internal model. Phase 1 starts with the synthesis as the opener.

---

## Phase 1 — Confirmation and enrichment

**Critical rule for every turn in Phase 1:**

**Ask ONE question per turn. Wait for the user's response. Save what they said. Then ask the next question.**

Do not list multiple questions in a single message. Do not show the user a roadmap. Do not say "Step 2," "Step 3," or "Step N" anywhere in chat. The customer should never see numbered steps. Internal turn numbers in this skill exist for your reference only.

**Anti-pattern (the failing pattern from real test installs — do not do this):**

> Setting up Runneth. I'll ask a few questions then build your brand foundation.
> Step 2 — Surface preference: Slack, web, or both?
> Step 3 — Winner definition: Your workspace goal is set to ROAS...
> Step 4 — Connection check: Meta is connected...

> Step 9 — Brand foundation. Last thing before I hand off to brand-audit: what's the brand website URL?

**Correct pattern:** one question, one turn, save, move on. Use "Step N" or numbered headings *never*. Use ordinary conversational flow.

### Tone for the whole onboarding

- Warm, direct, like a senior strategist who already did the homework.
- Show what you already know. Don't make the customer repeat things Motion can already see.
- When you do ask, ask sharply and use your context. Examples: "Since you're SaaS, my guess is your customer voice is internal — Gong calls, support tickets — right?" not "Where do reviews live?"
- Acknowledge corrections immediately and update the internal model before continuing.

### Turn 1 — Pre-discovery synthesis + first confirm

Open with what you found. This is the message that should make the customer feel like Runneth gets them.

Example shape (adapt every value to what Phase 0 actually surfaced):

> "Setting up your Runneth. Before asking anything, I dug through what Motion already has on <Brand Name>:
>
> - **What you sell:** <SaaS workflow tool for performance marketers | physical wellness products | etc.>, built for <implied persona>.
> - **How you measure:** Workspace goal is <metric> (<attribution>). Your saved reports lean on <pattern observed across reports>.
> - **What's running:** Your top creatives over the last 30 days lean on <format + messaging theme synthesized from the top 50>.
> - **Who you're already watching:** <names from competitorBrands>.
>
> Sound right at a glance, or did I miss something obvious?"

Wait for the user's response.

- **"Yes / sounds right / 👍"** → proceed to Turn 2.
- **Correction** ("we're not selling physical products," "actually our primary persona is X") → acknowledge the correction in one short phrase, update the internal model, then proceed to Turn 2. Save the correction note to `/agent/brain/runneth-classic/workspaces/<slug>/pre-discovery-corrections.md` so future turns inherit it.
- **"What else?"** → briefly add 2-3 more observations from the internal model if useful (e.g., "I also saw you're tracking N custom conversions, and your spend threshold is set to $X"), then ask again if it sounds right.

### Turn 2 — Surface preference

Cannot be inferred from any signal. Ask directly.

> "Where will you mostly use me — Slack, the web app, or both?"

Save to `/agent/brain/runneth-classic/workspaces/<slug>/surface-preference.md`:

```markdown
# Surface preference
Captured: <ISO date>
Primary surface: <slack | web | both>
```

### Turn 3 — Winner definition + the why

Lead with the inference you already built in Phase 0. Confirm in one sentence, then ask the why in the same turn.

> "Looks like ROAS is your headline metric — your workspace goal is set to it and your saved reports lean on it. Spend shows up as the scale signal. So for winners I'd default to: ROAS as the efficiency call, spend as the scale check. Sound right, or do you grade differently? And the why behind it — growth mode, profitability squeeze, or holding steady?"

(Adjust the lead based on what Phase 0 actually surfaced — if workspace-goal points to a custom conversion, frame around that. If saved reports are all spend-sorted, lead with spend.)

The `why` answer changes how downstream creative bets get prioritized. Growth mode tolerates riskier upper-funnel bets. Profitability mode favors proven bottom-funnel formats. Maintenance mode wants iterations on what already works.

When the user responds, save to `/agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md`:

```markdown
# Winner definition for <workspace>
Captured: <ISO date>

Primary signal: <spend | conversion value | ROAS | custom conversion | other>
Secondary signal: <if applicable>
Custom conversion ID: <if applicable>
Business mode: <growth | profitability | maintenance | launch | other>
User's exact words on the metric: "<verbatim>"
User's exact words on the why: "<verbatim>"
```

### Turn 4 — Creative workflow tools

Can be partially inferred. If Phase 0 surfaced any connected integrations or saved tool references, lead with those:

> "I see you have Slack connected. For everything else — where do briefs live? Where do creative assets and final cuts go? Where do performance updates and weekly decisions get shared? Anything else worth knowing — name it and how your team uses it."

If nothing connected yet:

> "A few quick questions about how creative work flows for your team:
>
> - Where do briefs live? Notion, Google Drive, Frame.io, somewhere else?
> - Where do creative assets and final cuts go?
> - Where do performance updates and weekly decisions get shared?
> - Anything else worth knowing — name it and how your team uses it."

Parse each named tool from any of the four sub-questions. Save to `/agent/brain/runneth-classic/integrations-intent.md` (ORG-LEVEL, not workspace-scoped):

```markdown
# Integrations Intent
Captured: <ISO date>

## <tool name>
Connected: <yes | no>
Used for: <brief delivery | asset storage | performance updates | other — what the user said>
How we use it: <user's description, verbatim if short>
Specific surfaces / IDs / channels: <if mentioned>
```

If the file already exists, merge — don't overwrite. New entries append; existing entries update only if the user explicitly contradicts the prior entry.

Acknowledge briefly. Examples:

- "Got it — briefs in Notion, assets in Frame.io, performance in #performance Slack channel."
- "Saved. I'll know where to put briefs and where to look for assets when those integrations get connected."

### Turn 4b — The graveyard (confirm what Phase 0 inferred)

**Only run this turn if Phase 0's `graveyard-inference.md` has at least one specific pattern worth surfacing.** Skip silently if the 365-day pull was too thin to identify anything.

Surface 2–3 specific findings as questions. Don't list everything Phase 0 inferred — just the strongest 2–3. The customer corrects what we got wrong.

> "Looking at the last year of your ad library, a few patterns stood out:
>
> - You tested heavily on **greenscreen / talking-head format** between October and December, peaked at $40K spend, then dropped to zero in January. Was that intentional — bad performance, or just seasonal rotation?
> - **Founder-led testimonials** appeared in a small test in March and never came back. Tried once and not for you, or just not gotten back to?
> - You haven't tested any **pain-agitation hooks** in the past year. Deliberate, or just not a direction yet?
>
> Any of those reads wrong, and is there anything else you've sworn off I should avoid proposing?"

Compose dynamically from `graveyard-inference.md`. Use specific time ranges, specific spend numbers, and specific glossary categories the customer will recognize. Don't be vague.

Update `graveyard-inference.md` based on the response. Save customer corrections verbatim so the orchestrator's Step 0 re-anchor reads them on every future creative-strategy turn:

```markdown
# Graveyard for <workspace>
Last updated: <ISO date>

## Confirmed dead (do not propose)
- <Pattern>: <why — user's words>
- <Pattern>: <why — user's words>

## Not actually dead (revisit possible)
- <Pattern>: <correction — e.g., "we paused those for fall, want to test again Q1">

## Never tried, deliberately
- <Pattern>: <why — user's words>

## Inferred by Phase 0 but not confirmed
- <Pattern>: <observation — customer didn't address>
```

When this turn fires, the orchestrator's creative-strategy chains read this file before generating concepts or hooks. The graveyard becomes binding — do not propose patterns marked "confirmed dead."

### Turn 4c — Current pressure (what's coming up)

Can't be inferred. Single direct question.

> "Anything coming up in the next 60 days I should know about — launches, sales, big creative bets you're trying to make work?"

Save to `/agent/brain/runneth-classic/workspaces/<slug>/current-pressure.md`:

```markdown
# Current pressure for <workspace>
Captured: <ISO date>
Refresh cadence: every 60 days, or on request

## Coming up
- <event / launch / sale / push>: <when>, <what we're trying to make work>

## Active right now
- <campaign or focus the team is invested in>

## Recent changes
- <platform shifts, attribution drift, account issues the team has been navigating>
```

This file should refresh roughly every 60 days. The orchestrator surfaces it for any creative-strategy turn so concepts respect upcoming pressure.

### Turn 5 — Watched brands

Lead with what Phase 0 already saw. The workspace likely has competitors tracked in brand-context. Enrich:

> "You already have <Competitor A> and <Competitor B> in your tracked brands. Anything else you watch for inspo specifically — brands you admire and want to learn from but might not be direct competitors? Or other competitors I should add?"

If nothing tracked yet:

> "Any brands worth keeping an eye on? Two buckets — inspo brands (you admire and want to learn from) and direct competitors (you're actively differentiating against). Drop names or skip."

For each new name given, call `motion search-brands --search-term "<name>"` to resolve the brand ID. If multiple matches, surface candidates and ask which one (extra conversational turn).

Save to:
- `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/inspo.md`
- `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/competitors.md`

Per file:

```markdown
# Watched brands — <Inspo | Competitors>
Captured: <ISO date>

## <Brand Name>
Brand ID: <motion brand ID, or "not resolved" if search-brands failed>
Domain: <if returned>
Why we're watching: <user's reason if given>
Added: <ISO date>
```

If a name couldn't be resolved (`search-brands` returned nothing or low confidence), flag it in the file as `not resolved` and tell the user. Don't fail silently.

Pass the resolved competitor list forward to brand-audit's setup so it pre-fills the competitor shortlist.

Acknowledge: "Saved. Tracking <N> inspo and <M> competitor brands."

### Turn 6 — Customer voice

Use what Phase 0 inferred about product type to frame the question. Don't ask generically.

**If product type is SaaS / B2B / service:**

> "Since you're <SaaS / B2B / service>, my guess is your customer voice mostly lives internal — Gong calls, support tickets, sales call notes — rather than public reviews. Where's the strongest source for you?"

**If product type is physical / consumer:**

> "Where do customer reviews live for <brand>? Trustpilot, Amazon, Reddit, your own site? Plus anything internal I should also use — interviews, support tickets, recorded customer calls."

**Always also ask:**

> "Any themes you specifically watch — shipping complaints, comparison to <competitor>, gift-purchase signals, churn reasons?"

Save to `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice-intent.md`:

```markdown
# Customer voice intent
Captured: <ISO date>

## Primary sources
- <source 1, with connection status>
- <source 2>

## Themes to watch
- <theme 1>
- <theme 2>

## Non-public sources
- <Gong calls, internal docs, etc.>
```

### Turn 7 — Optional uploads (conditional)

Check `./uploads/` for files dropped during setup using `ls ./uploads/`.

**If files exist:**

> "I see <N> files in uploads. Want me to classify them? Each can be:
> - Brand context (voice, positioning, audience docs)
> - Legal guidelines (claims rules, compliance docs)
> - Competitor creative (competitor ads, references)
> - Reviews / VOC (review CSVs, interview transcripts, Gong quotes)
> - Other (tell me what)"

For each file, classify and save to the right path:

- BRAND_CONTEXT → `/agent/brain/runneth-classic/workspaces/<slug>/brand-context-upload.md`
- LEGAL_GUIDELINES → `/agent/brain/runneth-classic/workspaces/<slug>/compliance-notes.md`
- COMPETITOR_CREATIVE → `/agent/brain/runneth-classic/workspaces/<slug>/competitor-references/<filename>`
- REVIEWS → `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice/reviews-upload.md`
- Other → ask once where it should live, save accordingly

**If no files in uploads:** skip this turn entirely — do not say "no files in uploads" out loud. Just move on.

### Turn 8 — Hand off to brand-audit

If brand-audit hasn't run for this workspace yet, hand off:

> "Now I'll build your brand foundation — products, customer voice, keywords, the competitor work, and the persona × angle × stage matrix. Takes about 10-15 minutes. I'll come back with your first prompts when it's done."

If brand-audit already ran (Phase 0 saw `/agent/brain/brand-audit/<workspace>/strategy.md` from a prior session), skip the heavy run and only refresh deltas:

> "Brand foundation is already built from earlier. I'll refresh anything that's stale based on what you just told me, then we're done. Give me a minute."

Invoke the `setup-brand-audit` skill. Pre-populate with:

- Brand site URL (brand-audit will ask if not in brand-context)
- Review sources from Turn 6
- Competitor shortlist from Turn 5
- Slack channels for refresh ping (brand-audit will ask)

Brand-audit runs its Foundation layer and writes to `/agent/brain/brand-audit/<workspace-slug>/`.

### Turn 9 — Closing handoff (automatic, after brand-audit completes)

When brand-audit reports completion, post into the same conversation thread. The closing is not a status list — it's a narrative summary that paints a picture of what Runneth now knows and how it will use that to work differently. The customer should read this and feel like Runneth genuinely gets them.

**Required reads before composing the close:**

1. `/agent/brain/brand-audit/<workspace>/strategy.md` — primary persona, pain, angle, stage, lens fit
2. `/agent/brain/brand-audit/<workspace>/brand-context.md` — brand name, positioning
3. `/agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md`
4. `/agent/brain/runneth-classic/workspaces/<slug>/surface-preference.md`
5. `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/inspo.md`
6. `/agent/brain/runneth-classic/workspaces/<slug>/watched-brands/competitors.md`
7. `/agent/brain/runneth-classic/workspaces/<slug>/customer-voice-intent.md`
8. `/agent/brain/runneth-classic/integrations-intent.md`
9. `/agent/brain/runneth-classic/workspaces/<slug>/pre-discovery-corrections.md` (if exists)

Synthesize into a five-section close. Each section is specific to what was captured. Compose dynamically; do not just paste a template.

**Structure:**

```
You're set up. Here's what I've got on you for <Brand Name>:

**Who you're building for.**
<2 sentences synthesizing the strongest persona × pain × stage × lens intersection
from strategy.md. Name the persona. Name the specific tension. Note the awareness
stage and the messaging lens that fits.>

**How you grade winners.**
<1-2 sentences from winner-definition.md, in plain language. Include the spend floor
and the secondary signal. Frame it as "so when you ask me 'what's working' I'll lead
with X and re-rank by Y.">

**Who you're watching.**
<List inspo brands by name with a one-line note on each ("admire their <observed
pattern>"). List competitor brands by name with a one-line note ("actively
differentiating against"). If any brand wasn't resolvable in Motion's ad library,
flag it: "flagged but not in the library yet — say the word and I'll search".>

**Where work flows.**
<Specific bullets from integrations-intent.md: briefs → <tool>, assets → <tool>,
performance updates → <tool>. Include the customer voice source from
customer-voice-intent.md with connection status.>

**How this changes how I work with you.**
<A short narrative paragraph (3-4 sentences) tying the above into concrete behavior.
This is the part that paints the picture. Example shape: "When you ask what's working,
I'll lead with <winner signal>, surface <persona>'s ads first, and re-rank by your
<secondary signal> check. When you want hooks, I'll condition them on <persona>
facing <pain> and run them through the <lens> lens. When you want a competitor read,
I know to start with <competitor>. When you have a brief to write, I know it lives
in <brief tool>.">

**Try one:**
1. <Performance-grounded prompt tied to their winner-definition, e.g., "Pull this
   week's top performers, re-ranked by spend with a $200 floor.">
2. <Persona-grounded prompt tied to their strategy.md, e.g., "Give me 5 hooks for
   <specific persona> facing <specific pain>.">
3. <Watched-brand-grounded prompt tied to Turn 5, e.g., "Show me what <inspo brand>
   is running right now.">

Do you want me to <single concrete next move tied to the strongest opportunity
in what was captured>?
```

**Composition rules for the close:**

- **Be specific to this workspace.** If the persona is "performance marketer who can't tell which creative element is moving the needle," use those exact words from strategy.md — don't paraphrase to "a marketer struggling with attribution."
- **Use names, not categories.** "Viktor and Foreplay" not "two competitors." "Notion" not "a brief management tool."
- **Acknowledge gaps honestly.** If Parker AI couldn't be resolved in the ad library, say so. If Gong isn't connected yet, frame it as "connect when you're ready and I'll mine calls directly."
- **Tie the narrative paragraph to actual user choices.** The "How this changes how I work" section should reference specific values from the captures, not generic capabilities.
- **End with one specific yes/no.** Not three options. Not "any of these sound good?" One concrete question tied to the strongest opportunity visible in the captured data.

**What this close does NOT include:**

- A list of installed use cases. Customers don't care about plan-mode and corpus-search as line items — they care about what those capabilities feel like in practice. The narrative paragraph captures that implicitly.
- A description of recurring routines. Those are opt-in and explicit — mentioning them sets a false expectation.
- Generic example prompts. Every "Try one" prompt must reference a specific captured value (persona name, watched brand name, integration tool name).

---

## Handling complications mid-onboarding

### Multi-answer turns

If the user answers multiple questions in one message ("Slack, and winners are spend"), parse all of them and save each. Don't make them re-answer. Then move to the next unanswered question without re-asking.

### "Skip" or "next"

If the user says "skip" / "next" / "pass" / "n/a" on any question, save an explicit "skipped" marker and move on. Don't re-ask. They can always come back via "update my setup."

### Off-topic asks during setup

If the user asks something unrelated mid-setup ("what's your favorite hook tactic"), answer briefly then return to the turn they were on. Don't lose state.

### Re-invocation

If the user says "set up runneth," "reconfigure runneth," or "rerun runneth setup," re-run Phase 0 from scratch (so the model is fresh) and re-run Phase 1. Each turn's save updates the existing file rather than creating a duplicate.

For partial updates ("update my watched brands," "change my winner definition"), jump directly to the relevant turn and update only that file.

## Constraints

- Do not invoke this skill on every conversation. One-time setup, re-runnable only on explicit request.
- Do not auto-activate any routines. Opt-in per the pack's design.
- Do not assume a Meta account is connected. Check workspace-goal first.
- Do not save any file in `./uploads/` itself. Uploads are read-only.
- Update `/agent/INDEX.md` after Phase 1 completes with entries for all files written.
- **Do not list multiple questions in a single message. One question per turn.**
- **Never say "Step N" or use numbered step headings in any user-facing message.** Internal turn numbers in this skill exist for the skill author's reference only. The customer should never see them.
- Phase 0 must complete before Turn 1 starts. The opener must include synthesis from Phase 0; it cannot be a generic welcome.
