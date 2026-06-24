---
name: briefing
description: |
  Produce execution-ready creative briefs for ad production.
  Use when the user asks for a "brief", "creative brief", "production brief", "script",
  "write a brief for this", "brief this", "turn this concept into a brief",
  "adapt this concept into a brief", or "brief this for [audience/season/context]".
  Do NOT use for account-level analysis, product how-to questions, or standalone creative ideation that does not yet need a deliverable.
user-invocable: false
---

## Purpose

Use this skill to turn an approved or newly formed concept into a production-ready brief without forcing extra helper-skill hops.

## Execution

### Start with the strongest available source material

- If the user already supplied a concept, hook, audience, or format direction, use it.
- If the user asks you to take the strongest concept from the current or prior turn and brief it, use that concept as the source material instead of rebuilding creative direction from scratch.
- Gather brand context per system rules only when it materially improves the brief.
- If the brief needs competitive differentiation, call `motion inspo-context --brand-id <brand-id>`.
- If the brief is anchored to a specific Meta competitor ad, call `motion meta competitor-ad-insights --ad-library-creative-id <id> --include-glossary --with-summary`.

### Pull performance only when it changes the brief

- If the user asks for a data-grounded brief or the concept still needs to be built, use the standard Motion hot path already included in the current session prompt.
- If the user already gave an approved concept and does not need fresh performance grounding, skip unnecessary retrieval.

### Read only the references the question needs

- `/runneth/references/hook-generation--standards.md` for hook quality and pressure checks
- `/runneth/references/creative-strategy-engine.md` only when the brief needs audience, stage, or context adaptation or clearer strategic mapping
- `/runneth/references/html-generation--design-system.md` only when the output is HTML or the user needs a visual example layout or reusable visual component pattern

### Build missing concept elements inline

- If the user did not provide a concept, build the minimum viable concept inline from the gathered context and performance patterns.
- If the user did not provide a hook, generate it inline using `/runneth/references/hook-generation--standards.md`.
- If briefing has to build a missing concept inline, apply the same concept quality bar as `creative-generation`: specific tension, clear audience, differentiated bet, concrete format, and a believable reason this should work.
- Do not dispatch to helper skills just to create subcomponents for the brief.

### Choose the brief path

Use the path that matches the source material:

- **Strategic brief** when working from strategy, performance data, concepts, or direction with no uploaded raw assets
- **Assembly brief** when uploaded creative assets are being cut, stitched, recut, or assembled into an ad
- **Script brief** when the user already has a script and wants it packaged into a production-ready brief without uploaded creative assets

### Write the brief directly

For every path, keep the brief production-ready and complete enough that a team can execute without follow-up questions.

**Strategic brief sections**

- `CONCEPT OVERVIEW` — 1 to 2 sentences on what is being made and why it should work
- `COPY` — exact spoken or on-screen copy with timestamps and text overlays for video, or headline/subhead/body/CTA for static
- `VISUAL APPROACH` — specific shot, layout, pacing, production-style, and tone direction. Be concrete enough that two designers would make similar work.
- `DELIVERABLES` — number of assets, format, dimensions, duration
- `VISUAL EXAMPLE` — only when a strong own-account match exists

**Assembly brief sections**

- `OVERVIEW` — what is being made and what strategic job it needs to do
- `IDENTIFIED ASSETS` — source file, timestamp range, and strategic value of each usable moment
- `STRATEGIC FRAMING` — 3 to 5 bullets on what to emphasize, avoid, and prove
- `SHOT-BY-SHOT STRUCTURE` — a timestamped sequence with source clip, purpose, and pacing notes
- `AUDIO DIRECTION` — music, original audio, voiceover, and energy notes
- `COPY & TEXT OVERLAYS` — exact overlay text with timing
- `ASSETS TO PULL` — editor checklist in sequence order
- `WHY IT CAN WORK` — 2 to 3 sentences tying the assembly to account patterns or behavior

**Script brief sections**

- `CONCEPT OVERVIEW` — what the script is trying to do and why it should work
- `COPY` using the user's script as provided unless they explicitly asked for rewriting. If a compliance issue exists, flag it instead of silently fixing it.
- `VISUAL APPROACH` — concrete visual interpretation of the script
- `DELIVERABLES`
- `VISUAL EXAMPLE` when a strong own-account match exists

### Brief rules

- Carry hard constraints and legal guardrails through exactly
- Do not include performance metrics inside the brief itself
- Do not surface tags, IDs, categoryIds, or JSON-like objects
- Do not generate a separate concept deck inside the brief
- Keep each section tight and executable
- If the user supplied a script and did not ask for rewriting, package it. Do not silently rewrite it.

## Response Principles

Open with one sentence on what the brief is for and what informed it. If the concept was newly constructed on this turn, say so. If performance data materially shaped the brief, note the key pattern rather than narrating every retrieval step.

When performance or competitor data materially shaped the brief, add a short "What mattered" block before the brief body. Keep it to 2 to 4 bullets and separate validated data from inference when both are present.

Render the brief directly in the chosen schema for the active path. Do not add parallel strategy sections after the brief.

## Artifacts

If they only want a quick inline outline or talking points, stay inline.

For execution-ready file outputs:

- default to Markdown for single readable briefs and scripts
- use HTML only when the user explicitly asks for HTML, or when the deliverable should be a page the user opens in the browser or be visually rich enough that Markdown is the wrong fit
- use PDF only when the user explicitly asks for it, or when fixed-layout output is clearly the point

When HTML is the chosen format, briefing owns the workflow and then hands off to `html-generation` as the rendering layer. Do not skip straight to bare `html-generation`.

Do not duplicate artifact content inline. Write a brief preamble, then reference the artifact.

## Constraints

- The brief must be complete enough for production without follow-up questions
- Do not force a performance retrieval step when the user already supplied the needed creative direction
- Do not render concept cards alongside the brief
