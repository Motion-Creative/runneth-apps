# Creative QA Judge

One judge per workspace. Represents this workspace's QA taste for both video and static ad creatives.
Built through accept/reject signals on Runneth's review comments.

## Status

- Rubric: starter template, not customer-initialized
- Signals: 0
- Agreement score: not computed

---

## Initialize the rubric

### Customer examples first

Before QA-ing creatives, feed Runneth whatever the customer already has: a QA checklist, creative brief, bullet list of what reviewers look for, approved/rejected examples, or a short description of common failure modes.

Tell Runneth:

> "Use these examples to initialize rubric.md for the Creative QA judge. Synthesize what this customer checks for, start from the generic analysis prompts in this README, adapt them to this customer's criteria, and keep uncertain assumptions explicit."

Runneth should rewrite `rubric.md` from the starter template into a customer-specific rubric. The rubric should include:
- Image and video review criteria
- The two analysis prompts (image and video) adapted to this customer
- Routing rules (Objective vs Subjective)
- Comment rules

If no examples exist, ask for a few before starting. Only use the generic starter when the user explicitly wants a cold-start calibration.

---

## How Runneth runs a QA review

### Image (static) assets

1. Read `/agent/brain/creative-qa-judge/rubric.md` — note the Image Analysis Prompt and image review criteria.
2. Resolve the file path: `/agent/apps/creative-qa/uploads/<asset.file_path>`.
3. Use the `read` tool on that path. The image is sent as a visual attachment.
4. Evaluate against the image criteria in the rubric.
5. Produce 3–6 observations. Determine routing (O or S) and whether the finding is pin-worthy.
6. POST each comment to `/api/assets/:id/comments` with:
   - `source: "runneth"`
   - `routing: "objective"` or `"subjective"`
   - `timestamp_seconds: 0`
   - `pin_x` and `pin_y` as 0–1 fractions of image width/height when the finding is location-specific
   - ASCII-only comment text, 1–2 lines max

### Video assets

1. Read `/agent/brain/creative-qa-judge/rubric.md` — note the Video Analysis Prompt.
2. Copy the video to `./uploads/` → run `motion analyze-media` with the Video Analysis Prompt.
3. Evaluate the analysis output against the video criteria in the rubric.
4. Produce 3–6 timestamped observations. Determine routing (O or S) for each.
5. POST each comment to `/api/assets/:id/comments` with:
   - `source: "runneth"`
   - `routing: "objective"` or `"subjective"`
   - `timestamp_seconds: N` (exact value from the analysis)
   - ASCII-only comment text, 1–2 lines max

### Generic Image Analysis Prompt

When reviewing a static image creative, evaluate it against the image and copy criteria in the rubric.

Evidence to capture:
- Visual hierarchy: what draws the eye first, second, third
- All readable copy: exact text, character counts for headlines and CTAs
- Text coverage percentage estimate
- Contrast: flag text that looks low-contrast against its background
- CTA presence, placement, and legibility
- Logo presence, sizing, and placement
- Safe zone compliance on vertical formats
- Platform nativeness vs stock appearance
- Whether variations test distinct angles or just surface-level changes

### Generic Video Analysis Prompt

Capture for each video:
- Exact timestamps: hook delivery, first cut, problem statement, solution reveal, CTA appearance
- All visible on-screen text with timestamps
- Whether hardcoded captions are present and readable
- Audio quality: hiss, music presence, VO-to-music balance
- Cut cadence: are cuts landing on spec?
- Total duration
- Creator delivery: authentic vs scripted feel
- Pacing changes and dead air
- Any moment that could confuse, distract, or fail to persuade

Then apply the video and copy criteria in the rubric to produce 3–6 timestamped comments.

### ASCII-only comment text rule

When posting from the agent shell, all comment text must be ASCII-only:
- Use `-` instead of em dashes
- Use straight quotes or no quotes
- No emoji, smart quotes, accented characters, or any character above U+007F

---

## Routing

Every comment must be classified before posting.

- **O (Objective):** Measurable pass/fail. Auto-assign directly to designer, copywriter, or editor.
- **S (Subjective):** Requires taste or strategic judgment. Flag for Creative Strategist review.

---

## Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/assets | List all assets |
| POST | /api/assets | Create asset record |
| PUT | /api/assets/:id/upload | Upload raw binary (agent shell) |
| POST | /api/assets/:id/upload/chunk | Upload one base64 chunk (browser) |
| POST | /api/assets/:id/upload/complete | Finalize chunked upload |
| GET | /api/assets/:id/stream | Stream video (range-request supported) |
| GET | /api/assets/:id/data | Fetch image as base64 JSON |
| GET | /api/assets/:id/comments | Get all comments |
| POST | /api/assets/:id/comments | Post comment |
| PATCH | /api/comments/:id | Update resolved / rejected / annotation / routing |
| GET | /api/pending-qa | Assets with no Runneth comments yet |
| GET | /api/training-data | All training signals and stats |

---

## Syncing training data

The app captures signals in SQLite automatically. To sync to the brain before rubric synthesis:

```
GET /api/training-data
```

Write the response to `/agent/brain/creative-qa-judge/training-log.json`.

Training signals include `routing` (O or S), `resolved`, `rejected`, `annotation`, `pin_x`, `pin_y`.
Human comments (`source: "human"`) capture what Runneth missed — equally valuable training data.

---

## Rubric refinement cadence

Refine when 20+ new signals since last version, or agreement score drops >5%.

1. Sync training data to `training-log.json`
2. Archive `rubric.md` to `rubric-history/vN-YYYY-MM-DD.md`
3. Write updated `rubric.md`, including both analysis prompts
4. Re-score on held-out assets, append to `score-history.json`
