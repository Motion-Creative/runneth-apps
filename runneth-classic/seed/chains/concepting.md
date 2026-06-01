# Chain: concepting

Theme triggered: "concepts," "ideas," "directions," "fresh angles," strategic creative bets.

## Skill sequence

```
1. Step 0 re-anchor (always)
   ├── /agent/brain/brand-audit/<workspace>/strategy.md  (REQUIRED — persona × angle × stage matrix)
   ├── /agent/brain/brand-audit/<workspace>/brand-context.md
   ├── /agent/brain/brand-audit/<workspace>/review-audit.md  (customer voice)
   ├── /agent/brain/runneth-classic/workspaces/<slug>/standing-decisions.md
   └── /agent/brain/runneth-classic/strategy/messaging-lenses.md

2. Performance retrieval (only when concepts should be data-grounded)
   Use the analyze chain's tool sequence if user said "based on what's working,"
   "for our top patterns," "data-backed concepts," etc.
   Otherwise skip — concepts can run on brand foundation alone.

3. Strategic skill: creative-strategy-engine
   Pick the pain × persona intersection from strategy.md (don't invent one).
   Choose the messaging angle for that intersection.
   Pick the awareness stage and messaging lens (from messaging-lenses.md).

4. Execution skills (compose them, don't call sequentially)
   ├── creative-mechanics  — the cognitive/emotional move the ad makes
   ├── visual-formats      — the production vessel
   ├── hook-tactics        — the structural frame of the opening line
   └── hook-writing        — the actual verbatim opening line

5. Synthesis
   Render concepts as structured markdown blocks. All 5 fields required per concept.
```

## Required reads — non-negotiable

The persona conditioning rule is binding. No concept ships without:

- A named persona from `strategy.md`
- A specific pain or desire that persona experiences (in their language, not the brand's)
- A messaging lens from `messaging-lenses.md` appropriate for the awareness stage
- A verbatim hook or headline that expresses the lens
- A "why it can work" grounded in either a pattern from performance data or a clear behavioral hypothesis

If `brand-audit` hasn't been run for this workspace, generation pauses and the orchestrator asks one short question to identify the persona and pain before proceeding.

## Plan mode contract

```
Here's the plan:
- Persona: <name from strategy.md>
- Pain or desire: <specific tension from strategy.md>
- Awareness stage: <Unaware | Problem-Aware | Solution-Aware | Product-Aware | Most-Aware>
- Messaging lens: <one of the 11 lenses>
- Format-purpose category: <educate/reveal | compare/demonstrate | prove/trust | drive action>
- Concepts requested: <N>
- Differentiation: shift at least <N-1> of (audience, angle, format, hook tactic) across the set

Sound right, or change anything before I write?
```

## Concept output schema (5 required fields)

Per concept, all five:

1. **Title** — 2–5 words. Captures the strategic essence, not the execution.
2. **Description** — Asset type + visual format + messaging angle + intended audience as one cohesive sentence.
3. **Tags** — One tag per category, from the workspace's AI Glossary (Hook Tactic, Messaging Angle, Asset Type, Visual Format, etc.).
4. **Verbatim hook (video) or headline (static)** — The actual opening line. Persuasive Attribute Standard from `hook-writing` applies.
5. **Why it can work** — 1–2 sentences. Grounded in behavioral insight or performance pattern.

Render in structured markdown:

```
**Concept 1: [Title]**
- Description: ...
- Tags: Hook Tactic = X, Messaging Angle = Y, Asset Type = Z, Visual Format = W
- Verbatim hook: "..."
- Why it works: ...
```

## Differentiation rule

When generating multiple concepts: shift at least two of audience, angle, format, hook tactic across the set. Don't ship three variations of the same concept with different hooks.

## Defaults

- 2 concepts if the direction is narrow
- 3 concepts if the direction is open-ended
- Match user count exactly when specified

## Constraint application

If LEGAL_GUIDELINES or BRAND_CONTEXT was uploaded during setup, apply silently:
- Don't generate concepts with prohibited claims
- Match brand voice in verbatim hooks
- Note if constraints significantly shaped the output, one line only

## Always end with

Single yes/no Next steps question. E.g., "Want me to brief out concept 1?"
