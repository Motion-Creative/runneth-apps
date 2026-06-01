# Chain: creative_attributes

Theme triggered: atomic creative-unit requests. Hooks, headlines, messaging angles, CTAs, audience definitions. Quantity-flagged: "give me 5," "variations," "options," "iterate."

## Skill sequence

```
1. Step 0 re-anchor
   ├── /agent/brain/brand-audit/<workspace>/strategy.md  (REQUIRED for hook/concept requests)
   ├── /agent/brain/brand-audit/<workspace>/review-audit.md  (customer voice for hooks)
   ├── /agent/brain/runneth-classic/strategy/messaging-lenses.md
   └── /agent/brain/runneth-classic/workspaces/<slug>/standing-decisions.md

2. Performance retrieval (only for "performance-informed" variants)
   When user says "based on what's working," "for our top patterns," "data-backed":
   Use the analyze chain's tool sequence.
   Otherwise skip.

3. Generation skills (pick by attribute type)
   ├── hook-writing            for hooks (with hook-tactics, hook-voice-patterns)
   ├── creative-strategy-engine for messaging angles
   ├── visual-formats           for format directions
   └── creative-strategy-engine for audience / persona definitions

4. Synthesis
   Numbered list. One line per attribute. No explanation unless requested.
```

## Persona conditioning rule (binding)

No hook, headline, angle, or CTA ships without:

- A named persona from `strategy.md` (or one short clarifying question to identify it)
- A specific pain or desire (in the persona's language)
- A messaging lens that fits the awareness stage (from `messaging-lenses.md`)

If `brand-audit` hasn't run for this workspace, generation pauses with one question: "Quick — who is this for, and what specific pain or desire are they feeling?" Don't proceed with generic output and let the user drag you back.

## Plan mode contract

```
Here's the plan:
- Attribute type: <Hook | Headline | Messaging Angle | etc.>
- Count: <user count, default 1 if narrow, 3 if open-ended>
- Persona: <from strategy.md>
- Pain or desire: <specific tension>
- Awareness stage: <stage>
- Messaging lens: <one of the 11 lenses>
- Hook tactic frame (if hooks): <Question | Confession | Bold Claim | etc.>
- Differentiation: shift <tactic | angle | format> across the set

Sound right?
```

## Differentiation rule

When generating multiple attributes:

- Hooks → vary the hook tactic (Question, Confession, Bold Claim, etc.)
- Messaging angles → vary the lens
- Visual formats → vary the format-purpose category
- Audience definitions → vary the persona context

Don't ship five variations of the same tactic.

## Quality standard

Each attribute must pass the Persuasive Attribute Standard from the `hook-writing` skill:

- Names a real problem, mistake, risk, or payoff
- Makes the viewer feel personally implicated
- Pushes toward action or change
- Is specific enough that it couldn't apply to a competitor

If an attribute only hints, teases, or sounds descriptive, rewrite it.

## Refinement mode (SCRIPT_COPY uploaded with refinement intent)

When the user provides existing copy and asks for variations, improvements, or iterations:

1. Identify what they want — variations (same angle, new execution), improvements (fix weaknesses), or iterations (evolve direction)
2. Note what's working in the original (one line) before changing anything
3. Apply performance patterns and persona context
4. Lead with the new versions only
5. Briefly note what changed in one sentence

Don't include the original unless asked.

## Output format

```
Here are 5 hooks for [persona] facing [pain]:

1. [Hook]
2. [Hook]
3. [Hook]
4. [Hook]
5. [Hook]
```

No rationale per attribute unless the user asks "why these." Then 2–3 sentences of rationale total.

## Always end with

Single yes/no Next steps question: "Want me to brief out the strongest one?" or "Want 5 more in a different lens?"
