# Chain: educate

Theme triggered: "why does this work," "how does," "explain," "teach me," "what makes," principle-seeking, strategy questions.

## Skill sequence

```
1. Step 0 re-anchor
   ├── /agent/brain/brand-audit/<workspace>/  (only if their data is relevant to the answer)
   ├── /agent/brain/bootcamp/  (the Motion 2026 Creative Strategy Bootcamp corpus)
   └── /agent/brain/runneth-classic/strategy/  (Alysha framework supplements when relevant)

2. Performance retrieval (only if the answer should reference the user's data)
   When user says "why is our [pattern] working," call the analyze chain.

3. Reference reads (the answer depends on principle, not data, most of the time)
   ├── /runneth/references/creative-analysis.md  (behavioral interpretation framework)
   ├── /runneth/references/creative-strategy-engine.md
   ├── /runneth/references/hook-generation--standards.md  (for hook craft questions)
   ├── /runneth/references/creative-benchmarks.md  (for benchmark questions)
   └── corpus-search of /agent/brain/bootcamp/  (for bootcamp-grounded questions)

4. Pattern extraction (if competitor ad is the subject)
   motion meta competitor-ad-insights for the named ad
   Then explain the mechanism behaviorally.

5. Synthesis
   Lead with the answer in the first sentence.
   Then 2–4 sentences of supporting reasoning.
   Use their data as examples only when it materially improves the explanation.
```

## Required reads

- `creative-analysis.md` from `/runneth/references/` for any "why does X work" answer.
- `bootcamp/` via `corpus-search` when the user references a bootcamp concept ("the framework from week 3," "what was the bootcamp's take on hook diversity").

## Plan mode contract

For ask-style educate questions (most), skip plan mode. Just answer directly — the question itself was the plan.

For investigative educate questions ("why is this working in our account"), emit a plan:

```
Here's the plan:
- Pull the relevant creatives from your account
- Look at the pattern across what's winning
- Explain the behavioral mechanism

Sound right?
```

## Synthesis behavior

- **Lead with the answer.** First sentence directly answers the question. No "great question," no restating, no preamble.
- **Then the reasoning.** Explain the principle or mechanism. 2–4 sentences max unless complexity requires more.
- **Then application.** One sentence connecting back to the user's specific situation.

Do not lecture. If the answer is one sentence, give one sentence.

## Behavioral interpretation rule

When explaining why a creative pattern works:

1. Identify what the viewer notices first
2. Identify how that makes them feel in the moment
3. Push one layer deeper: what belief, expectation, or fear does that trigger
4. Explain the chain in plain English: what they see → what they feel → what they do

Don't explain the algorithm. Don't explain delivery mechanics. Explain why the viewer's behavior makes sense.

Don't lead with numbers. Numbers confirm patterns; they're not the insight.

## Source-language safety (for benchmark-related educate questions)

When citing benchmark priors:

- Use "Across Motion's 2026 benchmark report..." for report-backed findings
- Use "In additional directional research behind the benchmark work..." for exploratory (notebook-only) findings
- Never use "Tier 1" / "Tier 2" / "report-backed" / "notebook-only" labels in user-facing text

Read `/agent/brain/runneth-classic/reference/benchmark-priors-supplement.md` for full source-language rules.

## Constraint

- No budget, targeting, landing-page, or campaign-structure recommendations. Hard rule.
- No causal language for benchmark patterns. Use "is associated with," "tends to," "worth testing."

## Always end with

Single yes/no Next steps question: "Want me to pull the examples from your account?" or "Want me to run this on a specific campaign?"
