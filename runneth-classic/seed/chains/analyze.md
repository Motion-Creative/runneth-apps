# Chain: analyze

Theme triggered: performance questions, top/bottom performers, "what's working," comparison over time, data retrieval.

## Skill sequence

```
1. Workspace settings (parallel)
   ├── motion workspace-goal
   ├── motion meta custom-conversion-metrics  (or skip for TikTok-only)
   └── motion spend-threshold

2. Custom-conversion clarification gate
   (See /agent/brain/runneth-classic/reference/custom-conversion-clarification.md)
   If ambiguous → STOP and ask. Do not proceed.

3. Performance retrieval (platform branch)
   ├── Meta connected → motion meta insights with the resolved metric, --include-northbeam by default
   ├── TikTok connected → motion tiktok insights with the resolved metric
   └── Both connected → both, with platform tagged on each row

4. Post-query re-rank by the saved winner-definition
   (Read /agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md)

5. Synthesis
   Render as a gallery with metrics in widget fields. No metrics in prose.
```

## Required reads before responding

Step 0 re-anchor (orchestrator always runs first):
- `/agent/brain/brand-audit/<workspace>/strategy.md` (persona context for ad-level commentary)
- `/agent/brain/runneth-classic/workspaces/<slug>/winner-definition.md`
- `/agent/brain/runneth-classic/workspaces/<slug>/standing-decisions.md`
- `/agent/brain/runneth-classic/workspaces/<slug>/conversation-anchors/<this-conversation-id>.md` if present

## Plan mode contract

Before executing, the orchestrator emits the plan to the user:

```
Here's the plan:
- Time range: <resolved range>
- Platform: <Meta | TikTok | Both>
- Spend threshold: $<value> (<auto|saved>)
- Winner definition: <saved value from winner-definition.md>
- Sort: top spend, re-ranked by <metric>
- Return: top <N> creatives with <field set>

Sound right?
```

User says "go" or corrects. Then execute.

## Output rules

- Use `creative-gallery` widget for the creatives. Metrics in widget fields.
- **No metrics in prose.** Verbatim Beta rule. Prose describes behavior and implications, not measurements.
- Lead with the strategic implication. Then the gallery. Then a one-sentence "what's next."
- If the pull may not include every matching ad (returned `totalCount` hit the limit), say so before any "all ads" claim.
- Always end with the single yes/no Next steps question.

## Slice integrity contract

Echo the exact filter and date range before showing results. Example:

> "Pulled 47 ads from your Meta account, May 1 to May 31, spend > $200 (your saved threshold). 47 is below my 150 limit so this is the full set for that filter."

If the user named a filter ("under $10K spend," "in May," "ad name contains 'core'"), apply exactly. Never silently broaden.

## What this chain does NOT do

- It does not generate hooks, concepts, or briefs. If the user wants creative output alongside the analysis, route the relevant sub-theme separately (analyze → creative_attributes is a sequential multi-theme).
- It does not make budget, targeting, or landing-page recommendations. Hard constraint.
