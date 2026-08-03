---
name: creative-generation
description: |
  Generate hooks, concepts, messaging angles, audience strategy, audience framings,
  personas, stage-aware creative direction, or visual directions for ads.
  Use when the user asks for "hooks", "headlines", "opening lines", "concepts", "ideas",
  "creative directions", "messaging angles", "target audience", "audience strategy",
  "segment", "persona", "ICP", "direct response", "DR concept", "offer angle", "big idea",
  "campaign idea", "how should this be framed", "adapt this for", "seasonal angle",
  "awareness stage", "decision stage", "funnel stage", or wants creative output short of a full production brief.
  Do NOT use for account or competitor analysis, product how-to questions, or production-ready briefs.
user-invocable: false
---

## Purpose

Use this skill to build creative output without bouncing through helper skills for hooks, concepts, messaging, audience direction, or format selection.

## Execution

### Gather only the context that changes the output

- Use supplied direction first: approved concept, audience, hook, messaging angle, format, stage, or creative constraint.
- Gather brand context only when it materially sharpens the work.
- If the request is data-grounded, use the standard Motion hot path already included in the current session prompt.
- If the user is referencing a Meta competitor or wants Meta competitive context to shape new creative, call `motion inspo-context --brand-id <brand-id>` or `motion meta competitor-ad-insights --ad-library-creative-id <id> --include-glossary --with-summary` as needed.
- Use `customerVoiceAnalysis` from the relevant Motion brand foundations or competitor context first for customer language. It comes from `motion brand-context` or `motion inspo-context`, not a standalone tool. If it is still too thin, use `WebSearch` and `WebFetch` following `/runneth/references/researching--review-mining.md`.

### Read only the references the ask needs

- `/runneth/references/creative-strategy-engine.md` when the ask needs the strategic layer across audience, framing, pain, desire, persona, angle, or stage
- `/runneth/references/creative-analysis.md` when performance patterns need interpretation before generating
- `/runneth/references/hook-generation--standards.md` for hook quality, pressure checks, and hook-stage fit
- `/runneth/references/researching--review-mining.md` only when review mining or customer-language extraction is needed

### Build the right output shape

- For standalone hooks or headlines, deliver a compact numbered list.
- For concepts, keep them inline in the smallest readable structure that matches the ask.
- For messaging angles, audience strategy, personas, or format direction, deliver the smallest readable inline structure that matches the ask.
- Build hooks, messaging, audience framing, and format choice inline instead of dispatching to helper skills.
- If explicit workspace-valid tactic names materially help, call `motion ai-glossary` for only the categories you need. Skip the call when plain-language strategy is enough.
- If the user actually wants a production-ready brief or execution document, stop and hand off to `briefing` instead of stretching this skill into deliverable mode.

### Concept quality bar

- Every concept should be a clear strategic bet rooted in a real tension, problem, desire, or belief shift.
- The right person should feel personally recognized. If the idea could target almost anyone in the category, it is too broad.
- This is not TV. This is not brand film. Attention is short, skepticism is high, and the value has to land fast enough to work in a feed.
- Concepts should feel fresh for this brand without losing conversion logic.
- Competitor creative is a learning input, not a template. Learn the mechanism, then change the execution.

Every concept should pass this fuller bar:

- **Pain-point specificity:** the concept exists because a specific person is struggling with a specific lived experience, not because the brand has a feature to mention.
- **Strategic coherence:** audience, message, format, and hook should reinforce each other. Nothing should feel bolted on.
- **Differentiation:** the concept should not read like a category default or something a competitor could run unchanged.
- **Format ambition:** the visual format should be chosen intentionally because it helps attention or persuasion, not because it is the default thing to make.
- **Persuasive sharpness:** the hook or headline should create tension, challenge a belief, surface a risk, or name a payoff clearly enough to trigger a reaction.
- **Testable hypothesis:** you should be able to explain what bet is being made and why it might outperform what has already been tried.
- **Producibility:** a creative team should be able to execute the concept without major clarification.

Fresh does not mean unfamiliar. It means the concept unlocks a tension, audience lens, or format bet this brand has not already exhausted. If it could have come from a generic category prompt, rethink it.

### Direct-response pressure

- Strong direct-response concepts start with a real pain point, frustration, fear, desire, or tension. Not a feature. Not a vague benefit. Not what the brand wishes people cared about.
- The format should feel native to the feed, and the message should be simple enough to understand on first pass. If someone has to think too hard about what the ad is saying, it will lose.
- The message should make the problem feel real and the solution feel clear. It should show why the current situation is not good enough, why this product is different, and why acting now makes sense.
- Ask: what does this person need to believe to buy, and what do they currently believe instead? The ad's job is to shift that belief.
- One sharp, well-reasoned bet beats ten vague ones.

### Concept structure rules

When you generate concepts, each concept should include:

- a short title that captures the strategic move
- the asset type and visual format as deliberate creative choices, not category defaults
- a messaging angle that expresses the reason to buy or core motivation
- an intended audience specific enough to guide casting, tone, and message
- a hook tactic or headline tactic that names the psychological device being used to win attention
- a cohesive description that ties together asset type, visual format, messaging angle, and intended audience
- tags only when they materially help, with no duplicate category IDs and valid glossary values when those values are available
- one verbatim hook for video or one verbatim headline for static
- a short `why it can work` explanation grounded in evidence or strategic logic. Treat it as a hypothesis, not a sales pitch.

When generating multiple concepts, vary at least two of:

- intended audience
- messaging angle
- visual format
- hook or headline tactic

Do not generate surface-level variants of the same idea.

### Messaging, audience, and format standards

- Messaging angles must create tension, challenge a belief, surface a risk, or name a payoff. If the angle only describes a benefit, it is not finished.
- Messaging angles should feel like they are talking to one person in one specific situation. If an angle could apply to almost anyone, it is too generic.
- Before finalizing a messaging angle, ask:
  - does this clearly name a problem, mistake, risk, or payoff?
  - does this make the viewer feel personally implicated?
  - does this push toward action or change, even subtly?
  - is this specific enough that it could not apply to a competitor unchanged?
- Audience definitions should start from tension, skepticism, and context, not demographics-first shorthand.
- Visual formats should be deliberate creative choices, not interchangeable defaults.
- A visual format should describe what makes the creative distinct, not what makes it similar to everything else in the category.
- A creative team should know exactly what to make from the format direction without asking clarifying questions.

## Response Principles

- Open by naming the few inputs that actually shaped the output: brand context used, whether performance data was pulled, and the tensions or patterns that mattered.
- If the output is data-grounded, add a short "What mattered" block first. Keep it to 2 to 4 bullets and separate validated data from inference when both appear.
- Keep hooks, concepts, angles, and audiences differentiated. Do not vary surface wording while repeating the same strategic move.
- Keep the writing direct and specific. Do not use em dashes unless directly quoting source text.

## Artifacts

Default to inline creative delivery in chat.

Create a file only when the user explicitly asks for a document, export, or other artifact deliverable:

- use Markdown for single readable creative documents
- use HTML only when the deliverable should be a page the user opens in the browser or be visually rich enough that Markdown is the wrong format
- use PDF only when the user explicitly asks for it, or when fixed-layout output is clearly the point

Do not create a parallel artifact when the next real step is a brief.

## Constraints

- Do not generate a production brief here
- Do not call helper skills just to produce hooks, messaging, audiences, or formats
- Do not flatten multi-concept output into vague or repetitive numbered text. Keep the concepts structured and easy to scan inline.
- Do not repeat the same tension, hook move, or format logic across every output
