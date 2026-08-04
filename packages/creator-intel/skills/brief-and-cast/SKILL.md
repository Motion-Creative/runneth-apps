---
name: brief-and-cast
description: Run the explicit combined workflow that writes a brief and recommends creators for one activated workspace. Use only when the user clearly asks for both the brief and the creator recommendation together.
triggers:
  phrases:
    - brief and cast this concept
    - write the brief and recommend creators
    - turn this into a creator brief and cast it
  intent: Own the combined brief-plus-casting workflow when the user explicitly asks for both together.
---

# Brief and cast

This skill owns the combined workflow only when the customer explicitly asks for both the brief and the creator recommendation together.

## Hard rules

- Do not claim this skill intercepts every brief.
- Do not let standalone suggestion mode rewrite the brief.
- Keep one stable recommendation id per suggested creator block.
- Do not claim later ad outcomes were caused by a recommendation unless a launched ad or brief carries that exact recommendation id.

## Flow

1. Confirm the workspace is activated.
2. Build or receive the brief inputs.
3. Resolve the creator job, for example roster reuse, new sourcing, paid whitelisting, organic, or creatorless production.
4. Call the casting logic with the workspace rules, hard eligibility, and evidence limits.
5. Return one brief with a clearly labeled creator recommendation block.
6. Append a recommendation record with a stable id to `recommendations.json` and audit the write.

## Combined output requirements

- Keep the creative brief separate from the casting recommendation.
- Mirror the strategist-led casting structure with these sections in order: **My recommendation**, **Your roster**, **New creators to source**, **Next move**.
- Label each suggested creator as roster reuse or new sourcing.
- For every creator, include concept, persona, and delivery fit, creative proof, performance signal with spend and measurement window, rights status, and the main watchout.
- Include **No creator needed** when the brief is stronger without a creator.
- Flag unresolved rights and any shared or uncertain performance evidence directly on the recommendation.
- Return fewer names when the evidence does not support more.
