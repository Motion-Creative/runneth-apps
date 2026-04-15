# Video QA Judge

One judge per workspace. Represents this workspace's QA taste, built from
accept/reject signals on Runneth's video review comments.

## Status

- Rubric: starter template, not customer-initialized
- Signals: 0
- Agreement score: not computed

## Initialize the rubric

### Customer examples first

Before QA-ing videos, feed Runneth whatever the customer already has. It can be
a rubric, slide screenshot, creative brief, QA framework, bullet list, notes,
approved/rejected examples, or a short blurb about what the reviewer looks for.

Tell Runneth:

> "Use these examples to initialize `rubric.md` for the Video QA judge. Synthesize what this customer checks for, start from the generic Analyze Media evidence prompt in this README, adapt it to this customer's rubric, and keep uncertain assumptions explicit."

Runneth should rewrite `rubric.md` from the starter template into a
customer-specific rubric. The rubric should include the Analyze Media prompt
that Runneth will use before posting timestamped comments.

If no examples exist, ask for a few before starting. Only use the generic
starter rubric when the user explicitly wants a cold-start calibration.

### Updating an existing workspace rubric

When pulling improvements from the repo into an existing Runneth workspace, do
not overwrite `/agent/brain/video-qa-judge/rubric.md`.

Instead, merge the reusable pieces:

- keep the existing customer-specific review criteria
- keep accepted/rejected learning notes and reviewer preferences
- replace or improve only the `Analysis Prompt` section using the generic
  evidence prompt below
- add customer-specific checks after the generic evidence sections

The generic prompt is meant to improve what Runneth can see in the video. The
workspace rubric remains the judge.

### Generic Analyze Media evidence prompt

Use this as the default first-pass prompt for `motion analyze-media`. After
customer examples exist, paste this into the workspace rubric's `Analysis
Prompt` section and add customer-specific checks below it. This follows the
same "supercharged transcript" pattern as Motion's AdFacts summarizer, adapted
for Video QA.

```md
You are creating a factual video record for a human QA review.

Your task is to analyze the entire video and summarize all key components in
enough detail that a reviewer could understand the full ad without watching it.
This should function as a factual record, or "supercharged transcript", not a
final judgment.

Do not decide whether the video passes or fails. Do not write QA comments yet.
Your job is to capture timestamped evidence that can later be checked against
the active rubric.

Important:
- Base every observation only on what is explicitly visible, audible, stated, or
  clearly implied in the video.
- If something is unclear, say unclear instead of guessing.
- Avoid empty sections whenever possible by carefully observing visual, audio,
  text, product, and story details.
- If something is not present, explicitly write: None used.
- Use exact ad language wherever possible.

Return the following sections in order.

## 1. Product Description

In one concise paragraph, describe the featured product or service in full
detail. Focus only on what the video itself shows, states, or clearly implies.

Include:
- what the product is and how it works, if shown or stated
- who the product appears to be for
- all explicitly stated product details
- clearly conveyed benefits, USPs, and use cases
- purchase barriers addressed by the video
- product variants, flavors, plans, bundles, or options shown
- exact product language from the ad where possible

If more than one product is shown, identify and distinguish each one clearly.

## 2. Spoken Transcript

Create a timestamped transcript of all audible speech.

Format:
- 0:00 - "Exact spoken words..."
- 0:04 - "Exact spoken words..."

Rules:
- Transcribe all audible speech exactly as spoken.
- Include slang, informal phrasing, false starts, or unusual delivery when
  audible.
- Add a speaker label if distinguishable.
- Mark unclear audio as [unclear] or [inaudible].
- Break lines naturally. Do not group unrelated thoughts into one block.
- Do not mix visual text into the spoken transcript.
- If there is no speech, write: None used.

## 3. Text Inventory

List every meaningful piece of visible text.

Use this table:

| timecode | exact text | source_type | location | confidence | notes |
|---|---|---|---|---|---|

Use only these source_type values:

- overlay_text: editorial text added on top of the video
- caption_subtitle: subtitles or captions matching spoken words
- product_packaging_text: text physically printed on a product, label, package, or bag
- environmental_text: signs, posters, books, papers, walls, or other real-world text
- interface_text: text inside a phone, website, app, social platform, or screen recording
- unknown_text: visible text where the source is unclear

Rules:
- Include all meaningful text regardless of size or placement.
- Preserve exact capitalization, spelling, punctuation, line breaks, and emojis
  when readable.
- Note distinctive containers or UI formats, such as comment bubbles, review
  cards, app screens, captions, or lower thirds.
- Do not call product packaging text an overlay.
- Do not critique product_packaging_text as if it were editable video overlay
  text.
- If text appears both as speech captions and product packaging, list them
  separately.
- If text is partially blocked or uncertain, note that in confidence/notes.

## 4. Scene-by-Scene Ad Record

Go through the full video in strict chronological order.

Start a new scene when any of these changes:
- camera framing, angle, movement, or POV
- primary subject or focal action
- location, setting, or background
- visible text state
- speaker, audio delivery style, music, or sound state
- product visibility or product interaction
- narrative role, such as hook, setup, proof, product explanation, offer, CTA,
  or risk reversal

If none of these change, treat the footage as the same scene.

Target roughly one scene per 5 seconds of runtime unless the video changes more
quickly. Merge only visually identical footage. Do not summarize away meaningful
beats.

For each scene, use this format:

### Scene #: 0:00-0:04 - Short scene label

Visuals used:
Describe every distinct visual beat in this scene in concrete detail.

Include:
- foreground and background
- setting and environmental context
- primary people, animals, objects, products, and props
- visible people: approximate age range if clear, clothing, expression, body
  language, position in frame, and gestures; do not infer protected identity
  categories unless the workspace rubric explicitly requires casting or
  representation review
- camera framing, movement, POV, angle, zooms, cuts, transitions, and pacing
- lighting, textures, shadows, reflections, and production style when visible
- product visibility, product handling, demonstrations, use moments, before/after
  moments, unboxing, preparation, or consumption
- any text embedded in the environment, product, packaging, UI, or screen,
  clearly separated from overlays and captions

On-screen text overlays and captions:
List all overlay_text and caption_subtitle visible in this scene.

Rules:
- One item per line.
- Quote exact text as shown when readable.
- Include timestamp and placement.
- Exclude product packaging, background signage, interface chrome, and other
  non-overlay text from this subsection.
- If no overlays or captions appear, write: None used.

Product, packaging, environmental, and interface text:
List all product_packaging_text, environmental_text, interface_text, or
unknown_text visible in this scene.

Rules:
- One item per line.
- Quote exact text as shown when readable.
- Include timestamp, source_type, and location.
- If no such text appears, write: None used.

Spoken words:
Transcribe or quote the spoken words that occur in this scene.

Rules:
- Use the full transcript above as source of truth.
- Mark unclear audio as [unclear] or [inaudible].
- If no speech occurs, write: None used.

Audio, music, and sound effects:
Describe every audible layer present in this scene.

Include:
- music genre or style, tempo, instrumentation, emotional tone, and narrative
  role when clear
- sound effects, whether they sync with on-screen action, and whether they seem
  intentional
- voiceover, direct-to-camera speech, dialogue, silence, or ambient audio
- whether music or sound appears to compete with speech

Do not infer sounds from visuals alone. If no audio is present, write: None used.

Narrative, POV, and messaging cues:
Using only what is observable in this scene, document:
- what is happening at this moment
- what message or idea is being conveyed
- whose perspective the audience appears to be experiencing, such as customer,
  creator, brand, expert, external source, or reviewer
- how that POV is communicated
- whether the scene functions as hook, setup, problem, continuation, reply,
  proof point, product explanation, offer, CTA, objection handling, risk
  reversal, or transition
- how the scene progresses or shifts the overall narrative

Do not add interpretation beyond what is shown, stated, or clearly implied.

## 5. Product, Offer, CTA, and Claims

List timestamped evidence for:
- product names and variants
- brand names
- offer, discount, guarantee, free trial, refund, bundle, price, or promo code
- CTA
- performance, health, quality, durability, convenience, taste, ingredient,
  comparison, social proof, testimonial, authority, or other claims
- proof points, demonstrations, results, before/after moments, or examples
- purchase barriers addressed

Do not judge whether claims are strong or compliant yet. Just record them.

## 6. Sound-Off Record

Describe what a viewer would understand from visuals, overlay_text,
caption_subtitle, product shots, packaging, and interface text with no audio.

Include:
- what the viewer would know about the product
- what problem or desire is communicated
- what proof, offer, or CTA is visible
- what remains unclear without sound

## 7. Ad Description

Provide a concise summary of the ad using the full scene-by-scene record as the
source of truth.

Include:
- overall narrative arc
- tone and style
- who or what appears in the video
- setting or settings
- core product message
- CTA or offer
- notable structural choices, such as hook mechanic, problem-solution sequence,
  proof before mechanism, risk reversal, creator testimonial, or demo

## 8. QA-Relevant Evidence Index

Index moments that may be relevant to the active rubric. Do not decide whether
these are issues. Do not turn them into final comments yet.

For each item include:
- timestamp
- evidence
- why it may matter to the rubric
- evidence category: hook, pacing, overlay_text, caption_subtitle,
  product_packaging_text, audio, CTA, offer, claim clarity, product visibility,
  product understanding, sound-off clarity, or narrative clarity
- confidence
- uncertainty, if any

Do not label a moment as an issue unless the active rubric supports it. Do not
post or recommend a spelling, capitalization, or overlay-formatting comment
unless the relevant text source is overlay_text or caption_subtitle.

## 9. Uncertainties

List anything important that was hard to determine:
- unclear speech
- unreadable text
- ambiguous text source
- uncertain product detail
- unclear scene boundary
- unclear sequence or timestamp
- uncertainty about whether text is overlay, caption, packaging, environment, UI,
  or unknown
```

### Batch one calibration

Use the first batch of videos to test the initialized rubric.

1. Runneth runs Analyze Media using the prompt in `rubric.md`.
2. Runneth posts 3-6 timestamped comments per video.
3. The human accepts, rejects, or annotates Runneth comments.
4. Runneth calls `/api/training-data` and writes the snapshot to `training-log.json`.
5. Runneth updates `rubric.md` based on the batch one signal.

## Files

| file | purpose |
|------|---------|
| `rubric.md` | Starter template, then current active rubric |
| `rubric-history/` | Archived versions with dates |
| `training-log.json` | Snapshot of signals from the app's SQLite |
| `score-history.json` | Agreement score over time |

## Sync training data

To refresh `training-log.json` from the live app:

```
GET /<app-route>/api/training-data
```

Read the response and write it to `training-log.json`.

## Rubric refinement

Refine when: 20+ new signals since last rubric version, or score drops >5%.

1. Read new signals from `/api/training-data`
2. Compare against current `rubric.md`
3. Archive current → `rubric-history/vN-YYYY-MM-DD.md`
4. Write updated `rubric.md`, including the Analyze Media prompt
5. Re-score against held-out videos → append to `score-history.json`

## One primary reviewer

All signals from all users feed the judge. For reliable training, one person
should do the majority of the reviewing. The judge learns to match their taste.
