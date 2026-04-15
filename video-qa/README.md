# Video QA

A video review app with an AI QA judge training loop.
Runneth reviews uploaded videos, humans accept or reject the feedback,
and those signals train a personal QA judge stored in the agent brain.

---

## Setup in a new workspace

Run these steps exactly, in order.

### 1. Create the app

```bash
app create video-qa
```

### 2. Copy source files

```bash
cp -r server/* /agent/apps/video-qa/server/
cp -r frontend/* /agent/apps/video-qa/frontend/
```

### 3. Build and verify

```bash
app build video-qa
app verify video-qa
```

### 4. Create the judge brain folder

```bash
cp -r brain-template /agent/brain/video-qa-judge
```

This creates `/agent/brain/video-qa-judge/` with empty training log,
score history, the judge README, and a starter rubric template. The starter
rubric is not customer-specific yet.

### 5. Get the app URL

```bash
app list
```

Return a `link` widget with kind=app using the route shown.

### 6. Feed customer examples and initialize the rubric

Before Runneth QA's videos, give it customer-specific review material. It can
be rough: a bullet list, slide screenshot, creative brief, QA checklist,
example notes, rejected/approved examples, or a short blurb describing what the
reviewer looks for.

Tell Runneth:

> "Use these examples to initialize `/agent/brain/video-qa-judge/rubric.md` for Video QA. Synthesize what this customer checks for, start from the generic Analyze Media evidence prompt in the repo README, adapt it to this customer's rubric, and keep uncertain assumptions explicit."

Runneth should update the workspace copy of `rubric.md`, not the repo template.
The initial rubric should include:

- review criteria
- the Analyze Media prompt
- timestamped comment rules
- open questions or assumptions

If no examples exist, ask for a few before starting. Only use the generic
starter rubric when the user explicitly wants a cold-start calibration.

### 7. Run batch one calibration

Use the first batch of videos to test the initial rubric.

1. Upload the first batch of videos.
2. For each video, Runneth runs Analyze Media using the prompt in `rubric.md`.
3. Runneth posts 3-6 timestamped QA comments.
4. The human accepts, rejects, or annotates each Runneth comment.
5. Sync `/api/training-data` into `training-log.json`.
6. Review the agreement score and update `rubric.md` before the next batch.

---

## What this creates

```
/agent/apps/video-qa/          ← the running app
/agent/brain/video-qa-judge/   ← the judge (workspace-specific)
  README.md
  rubric.md                    ← starter template, then customer-initialized
  rubric-history/              ← archived versions
  training-log.json            ← signal snapshot (live source is app SQLite)
  score-history.json           ← agreement score over time
```

---

## How Runneth runs a QA review

```
1. Read /agent/brain/video-qa-judge/rubric.md, especially the Analyze Media prompt
2. Copy video to ./uploads/ → run motion analyze-media with that prompt
3. POST /api/videos — create video record
4. PUT /api/videos/:id/upload — upload raw binary (Content-Type: application/octet-stream)
5. POST /api/videos/:id/comments — one comment per observation:
   { source: "runneth", user_name: "Runneth", text: "...", timestamp_seconds: N }
```

The media analysis should capture exact timestamps, scene changes, visible
text, spoken words or voiceover summary, audio cues, product/offer/CTA
mentions, pacing changes, and any moment that could confuse, distract, or fail
to persuade the target viewer. The final QA comments should be based on the
rubric, not generic taste.

Use exact timestamps from the media analysis. Post 3-6 comments per video unless
the rubric says otherwise.

### Updating an existing workspace rubric

When pulling improvements from this repo into an existing Runneth workspace, do
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

### Agent shell comment posting

When Runneth posts comments from the agent shell, keep the JSON body ASCII-only.
Do this even though the browser UI can handle Unicode.

Comment text posted through shell automation should:

- use `-` instead of em dashes
- use straight quotes or no quotes
- avoid emoji, smart quotes, accented characters, and any character above U+007F
- be JSON-escaped before interpolation into `curl -d`

Reason: the app may sit behind a proxy that rewrites escaped Unicode before the
request reaches Fastify, which can cause a `Content-Length` mismatch and reject
the request. ASCII-only comment text avoids this failure mode.

Reliable shell pattern:

```bash
curl -s -X POST "http://localhost/<app-route>/api/videos/$VID/comments" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"$COMMENT_TEXT\",\"timestamp_seconds\":$TS,\"user_name\":\"Runneth\",\"source\":\"runneth\"}"
```

If comment text is generated in Python before posting, strip non-ASCII before
building the `curl` body:

```python
comment_text = comment_text.encode("ascii", "ignore").decode()
```

---

## Syncing training data to brain

The app captures signals in SQLite automatically. To sync to brain:

```
GET /api/training-data
```

Read the response and write it to `/agent/brain/video-qa-judge/training-log.json`.
Do this before rubric synthesis or scoring.

---

## Key API endpoints

| method | path | description |
|--------|------|-------------|
| GET | `/api/videos` | List all videos |
| POST | `/api/videos` | Create video record |
| PUT | `/api/videos/:id/upload` | Upload raw binary |
| GET | `/api/videos/:id/stream` | Stream video (range-request supported) |
| GET | `/api/videos/:id/comments` | Get all comments |
| POST | `/api/videos/:id/comments` | Post comment |
| PATCH | `/api/comments/:id` | Update resolved / rejected / annotation |
| GET | `/api/training-data` | All training signals + stats |

---

## Training signals

| field | meaning |
|-------|---------|
| `source: "runneth"` | Posted by Runneth |
| `source: "human"` | Posted by a human reviewer |
| `resolved: 1` | Human accepted this Runneth comment |
| `rejected: 1` | Human rejected this Runneth comment |
| `annotation` | Optional human note on a Runneth comment |

Human comments are "what Runneth missed" — equally valuable training data.

---

## Rubric refinement cadence

Refine when 20+ new signals since last version, or score drops >5%.

1. Sync training data → `training-log.json`
2. Archive `rubric.md` → `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md`, including the Analyze Media prompt
4. Re-score on held-out videos → append to `score-history.json`

---

## Identity

No auth. Commenters type their name inline when leaving feedback.
Name persists for the browser session. One primary reviewer recommended
for clean training signal — the judge learns to match one person's taste.
