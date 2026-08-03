---
name: analyzing
description: |
  Analyze creative performance, competitor strategy, uploaded creative, customer language,
  audience fit, stage fit, or explain why something is working or not.
  Use when the user asks "what's working", "what's not working", "top performers", "worst performers",
  "show me", "pull", "compare", "trends", "over time", "winning combos", "losing combos",
  "what combos", "what haven't we tried", "what are we missing", "review this", "feedback",
  "critique", "why does this work", "who is this for", "which audience", "why this audience",
  "audience fit", "segment fit", "stage fit", "customer reviews", "market research", or "teach me".
  Do NOT use for Motion product how-to questions or for generating brand-new hooks, concepts, or briefs.
user-invocable: false
---

## Purpose

Use this skill to turn data, research, and creative review into decisions, not just summaries.

## Execution

### Choose the lightest valid path

- For benchmark or peer-comparison requests, use `motion benchmark-compare` first and treat `/runneth/references/creative-benchmarks.md` as the source of truth.
- For standard own-account analysis, use the standard Motion hot path already included in the current session prompt.
- For TikTok-specific performance analysis, use the TikTok branch of the standard Motion hot path.
- For competitor or inspirational-brand analysis, use the competitor branch of that same Motion hot path.
- If the user references a specific Meta competitor ad, call `motion meta competitor-ad-insights --ad-library-creative-id <id> --include-glossary --with-summary`.
- For uploaded-creative review:
  - read uploaded images directly
  - use `ls ./uploads/` and then `motion analyze-media` for uploaded videos
- For market or review research, use `WebSearch` and `WebFetch` following `/runneth/references/researching--review-mining.md`.
- Gather brand context only when it materially sharpens interpretation, review, or strategist explanation.

### Read only the references the question needs

- `/runneth/references/creative-analysis.md` for behavioral interpretation, combo extraction, metric translation, and performance context
- `/runneth/references/creative-strategy-engine.md` when the ask needs structural mapping across pain, desire, persona, angle, audience, or stage
- `/runneth/references/creative-benchmarks.md` for benchmark interpretation and next-test logic
- `/runneth/references/researching--review-mining.md` for customer-language extraction and review synthesis
- `/runneth/references/html-generation--design-system.md` only when the chosen deliverable is HTML or when you need a reusable visual component or layout pattern

### Match the depth to the ask

- If they want to see data, lead with the creatives and keep commentary minimal.
- If they want to understand what is working or not working, explain the pattern behaviorally and say why it matters.
- If they want competitor research, treat competitor creative choices as investment signals, not validated performance proof.
- If they want a creative review, start with a hard launch call and then focus on the highest-leverage fixes.
- If they want principle or teaching help, answer the question directly first, then support it with data only when the example genuinely improves the explanation.
- If they ask about combos, use the pattern extraction steps from `/runneth/references/creative-analysis.md`.
- If they want a teardown of a specific ad, go deep on that ad instead of broad account coverage.
- If they ask for benchmark plus diagnosis, start with `motion benchmark-compare` and only pull own-account examples if they materially improve the answer.

### Judgment rules

- Lead with the few insights that actually change a decision.
- Separate validated data from inference whenever both appear.
- Pair every weakness with what to change, test, or watch next.
- Decode ad names only when the naming structure is repeatable and materially useful. If the meaning is noisy or uncertain, skip it or ask instead of inventing meaning.
- Do not flatten prospecting, retargeting, and retention into one undifferentiated ranking.
- Weak results can reflect under-delivery against entrenched winners, not just bad creative.
- Competitor or inspo work is only useful if it answers what the brand could actually test, avoid, or differentiate on next.

### Competitor and inspo discipline

- Inspo is a strategy input, not a collection exercise. The question is what the brand would learn from this that they could actually act on.
- An ad is worth noting when you can explain what it does to the viewer, what is transferable about it, how it stands out from category background, and whether there is evidence of investment behind it.
- Understand why it works for the viewer, not just what it looks like.
- Read investment patterns, not just individual ads. Repeated investment matters more than one-offs.
- Separate category behavior from individual bets. Category convergence matters more than single-brand behavior.
- Absence is not automatically opportunity. It may mean untested whitespace, or it may mean others tried it and moved on.
- Treat competitor creative as evidence of what brands believe is worth investing in, not proof of what converts.

### Creative review framework

- Evaluate every creative by answering four questions in order:
  - does this make sense fast?
  - will the right person feel like it's for them?
  - will they believe it?
  - will they take the intended action?
- Use those questions in order. Failing an earlier one overrides strengths lower down.
- End every review with one clear call:
  - Ready
  - Iterate
  - Rethink
- `Iterate` means there is a workable foundation but specific problems need fixing before launch. `Rethink` means the angle, brief, or approach is fundamentally wrong and surface edits will not save it.
- Lead with what will hurt performance most. Conversion blockers first. Attention failures second. Trust gaps third.
- Every piece of feedback should tell the team what to change, not just what is wrong.

### Insight quality bar

- An insight is the "why" behind performance.
- It is not a recap of metrics.
- It is not a description of what the ad looks like.
- It is not a list of observations.
- A good insight explains what changed in how people felt, trusted, understood, or cared.
- If the reasoning collapses when the metrics are removed, it is not yet a strong insight.

## Response Principles

Open by reflecting what source material you actually used in natural language. For `motion meta insights`, include the number of creatives returned, the time range, the sort order, and any filters actually applied. For `motion tiktok insights`, include the grain, row count, date range, sort, and filters actually applied. For benchmark-only responses, include the benchmark window, resolved benchmark label, and the main scope limit before recommendations. For competitor research, name the pulled brands and the launch-date or limit constraint that shaped the dataset. For uploaded-creative review, name the asset being reviewed.

If the response is data-grounded, add a short "What mattered" block before the main analysis or deliverable. Keep it to 2 to 4 bullets. Separate validated data from inference when both appear.

Every response that references specific ads must show them visually. For inline responses, use the active surface's visual presentation for the creatives in the same turn. For HTML artifacts, embed the creatives directly using the Creative Cards pattern from `/runneth/references/html-generation--design-system.md`. For Markdown artifacts, keep the document readable first and place `motionUrl` links or compact supporting references directly beside the insight they support.

Visual evidence rules:

- show the actual ad image or video for every referenced creative
- use `motionUrl` for plain reader-facing creative links when available
- use `url` for `motion meta insights` and `fileUrl` for `motion inspo-creatives` only when rendering or embedding the visual itself
- use `data.summaryRows[].creativeAssets[].url` for compact `motion tiktok insights` rows and pass `creativeOrigin: "tiktokCreativeAsset"` when rendering TikTok creative-gallery items
- place the visual directly after the insight it supports
- include only the metrics or tags that matter for that insight
- if a requested creative has no media URL, say that explicitly
- for inline web galleries, also include missing-media creatives in `excludedCreatives` with `{ "id": "<creative id>", "reason": "missing_url" }`
- if a requested creative has a media URL but unsupported or unknown format, say that explicitly and do not invent a widget exclusion reason
- if the user asked for ads by name, only state an exact creative count if it came from a server-side filtered `motion meta insights` call

For analysis responses, communicate:

- what the data or asset shows
- why it matters behaviorally
- what to change, test, or pay attention to next

If the user asked for a creative review or QA call, open with:

- Ready
- Iterate
- Rethink

If the user asked an educational question, answer the principle first and keep the explanation tight.

## Artifacts

Default to inline analysis in chat.

Create a file only when the user explicitly asks for a report, export, or document deliverable:

- use Markdown for single readable reports or notes
- use HTML only when the deliverable should be a page the user opens in the browser or be visually rich enough that Markdown is the wrong fit
- use PDF only when the user explicitly asks for it, or when fixed-layout output is clearly the point

Do not duplicate artifact content inline.

## Constraints

- Do not point out weaknesses without recommending what to change instead
- Do not read broad reference stacks when a narrower source will answer the question
- Do not treat competitor creative choices as validated patterns
- Do not pad educational answers into full analyses when the user asked a principle question
