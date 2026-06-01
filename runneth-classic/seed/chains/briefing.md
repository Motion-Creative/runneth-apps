# Chain: briefing

Theme triggered: "script," "brief," "production-ready," "create an ad from these files," "stitch together," "for the editor."

## Three paths

Detect the path by what's present in uploads and intent:

- **Path A — Strategic Brief.** No uploaded files. Working from a concept, strategy direction, or new brief request.
- **Path B — Assembly Brief.** CREATIVE_ASSET files in uploads + ad creation intent ("make a mashup," "cut together," "create an ad from these").
- **Path C — Script Brief.** SCRIPT_COPY file + production intent ("package this," "production-ready brief for this"). No CREATIVE_ASSET present.

If both CREATIVE_ASSET and SCRIPT_COPY are present, use Path B with the script driving the audio direction.

## Skill sequence (shared across paths)

```
1. Step 0 re-anchor (same as concepting)
   ├── /agent/brain/brand-audit/<workspace>/strategy.md
   ├── /agent/brain/brand-audit/<workspace>/brand-context.md
   ├── /agent/brain/runneth-classic/workspaces/<slug>/standing-decisions.md
   └── /agent/brain/runneth-classic/workspaces/<slug>/compliance-notes.md  (if exists)

2. Performance retrieval (only when brief should be data-grounded)
   Pull patterns from the analyze chain when "based on what's working" applies.

3. Concept layer (only for Path A or when no concept exists)
   ├── creative-strategy-engine  — messaging angle for the brief
   └── creative-mechanics + visual-formats + hook-writing + hook-tactics

4. Briefing skill (/runneth/skills/briefing/SKILL.md)
   Pick the path. Write the brief per that path's structure.

5. Visual Example (Paths A and C only)
   Call motion meta insights with the brief's visual format and asset type filters,
   sorted by topSpend, returning 1 creative as the reference.

6. Synthesis
   Render the brief as written. No restructuring. No commentary above or below.
   Visual Example renders as a single-creative gallery card.
```

## Plan mode contract per path

### Path A (Strategic Brief)

```
Here's the plan:
- Concept: <named concept or "to be built inline">
- Persona: <from strategy.md>
- Format: <Visual Format value>
- Asset type: <UGC | High Production | Hybrid | etc.>
- Output: brief with Concept Overview, Copy, Visual Approach, Deliverables, Visual Example

Sound right?
```

### Path B (Assembly Brief)

```
Here's the plan:
- Uploaded assets: <N files identified>
- Format we're building: <mashup | recut | compilation | etc.>
- Strategic frame: <which winning pattern from the account this maps to>
- Output: editing brief with Overview, Identified Assets, Strategic Framing,
  Shot-by-Shot Structure, Audio Direction, Copy & Text Overlays, Assets to Pull, Why It Can Work

Sound right?
```

### Path C (Script Brief)

```
Here's the plan:
- Source script: <uploaded SCRIPT_COPY filename>
- Visual interpretation: <how I'll visualize this>
- Output: brief with Concept Overview, Copy (your script, unedited),
  Visual Approach, Deliverables, Visual Example

Note: I will not rewrite your script. If anything in it conflicts with compliance,
I'll flag it inline but not silently change it. Sound right?
```

## Critical rules

### Path B (Assembly Brief) specifics

- Do not invent content not in the uploaded files. Work only from the summaries provided.
- Identify usable moments by source file + timestamp.
- Connect the assembly logic to a winning pattern from the account when patterns are known.
- An editor should be able to make the first cut from the brief without asking questions.

### Path C (Script Brief) specifics

- Do not rewrite the script. Package it.
- If the script contains prohibited claims (from `compliance-notes.md`), flag inline: "Note: [X] may need legal review." Do not silently fix.
- Visual Approach is your interpretation. The script is the user's — preserve it.

### Visual Example (Paths A and C)

- Render as a single-creative `creative-gallery` widget after the brief text.
- Label: "Visual Example" or the creative's `adName`.
- No metrics required — this is a reference, not a performance comparison.
- If no strong match exists in the account, say so and ship the brief without the example.

## Constraint application

- LEGAL_GUIDELINES uploaded → apply silently in Copy section. Flag conflicts, don't fix silently.
- BRAND_CONTEXT uploaded → match brand voice in Copy section.

## Synthesis behavior

- Render the brief from the `briefing` skill exactly as written. Do not restructure.
- Do not add strategy sections, audience insights, or brand snapshots above or below the brief.
- Do not include "Next steps" after a brief output. The brief is the deliverable.

(This is the one place the always-Next-steps rule has a documented exception. Per Beta's Skill 08 contract: "If you output a brief, do not add any content after the brief, including Next steps.")
