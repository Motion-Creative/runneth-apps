# Video QA Rubric

This is a starter template. Before the first real QA pass, replace the generic
sections below with customer-specific criteria synthesized from whatever the
customer can provide: a checklist, slide screenshot, brief, bullet list,
examples, notes, or a short description of what they look for.

## Initialization Instructions

When initializing this workspace:

1. Ask the user for examples of how they review videos.
2. Synthesize those examples into review criteria.
3. Write a workspace-specific Analyze Media prompt in this file.
4. Keep uncertain assumptions explicit.
5. Use the first batch of videos to calibrate the rubric.

Do not preserve this starter text if customer-specific guidance exists. Rewrite
it into a practical rubric Runneth can apply.

## Review Intent

To be initialized from customer examples.

Capture:

- what the reviewer cares about most
- what makes a video pass or fail
- what details are customer-specific
- which issues should be ignored or deprioritized
- what the reviewer considers a high-value QA comment

## Analyze Media Prompt

Use Motion Analyze Media before posting QA comments.

Starter prompt:

```
Analyze this video for QA review. Return timestamped observations that will help
evaluate the video against the active rubric.

Capture:
- exact timestamps for each meaningful observation
- scene and shot changes
- visible on-screen text
- spoken words, voiceover, or a concise speech summary
- audio, music, and delivery notes
- product, offer, CTA, or claim mentions
- pacing, clarity, and attention issues
- moments where a viewer may be confused, unconvinced, or distracted

Do not make final QA recommendations yet. Produce evidence that can be used to
write specific timestamped comments.
```

After customer examples are provided, replace this starter prompt with one that
looks for the evidence this reviewer actually cares about.

## QA Comment Rules

When Runneth reviews a video:

- post 3-6 comments unless the video has fewer meaningful issues
- use exact timestamps from the media analysis
- make each comment about one concrete issue or opportunity
- explain why the issue matters to the viewer or conversion goal
- avoid generic taste unless the rubric supports it
- avoid repeating the same issue in different words
- prefer specific, actionable notes over broad summaries

Each Runneth comment should be posted as:

```json
{
  "source": "runneth",
  "user_name": "Runneth",
  "text": "Specific QA comment...",
  "timestamp_seconds": 12.3
}
```

## Learning Loop

Human feedback trains the judge.

- Accepted comments mean the reviewer agrees the issue matters.
- Rejected comments mean the rubric over-weighted, misread, or invented an issue.
- Annotations explain why a decision was made and should be used heavily.
- Human comments show what Runneth missed.

After batch one, update both:

- the review criteria
- the Analyze Media prompt

The Analyze Media prompt should evolve so it captures the evidence needed to
match this reviewer's taste.

## Open Questions

Fill these in during initialization:

- Who is the primary reviewer?
- What kind of videos are being reviewed?
- What does a pass look like?
- What are common failure modes?
- Which product, brand, offer, or compliance details must be checked?
- What should Runneth avoid commenting on?
