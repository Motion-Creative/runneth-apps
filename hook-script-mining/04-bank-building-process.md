# 04: Bank Building Process (Seeding This Library From Real Evidence)

This is the self-contained procedure Step 0 of `01-source-and-classification.md`
points to. It builds this package's swipe-file library from this account's own real
ad evidence, once, before any outside submissions arrive. It does not depend on any
other package being installed, everything needed to run it is written here.

## What gets built

Three tracked axes carry Motion's own AI glossary tags and can be seeded from live
data: hook tactic, headline tactic, visual format. A fourth, creative mechanic, has no
Motion tag at all and is handled separately below.

## Step 0: Read account context first, if it exists

Before Step 1, check whether `/agent/brain/<workspace>/data-sources/meta/account-context.md`
already exists for this workspace (it does when the Meta and Voice of Customer
onboarding package has run here). If it exists, read it and use its confirmed naming
decoder, reporting dimensions, and testing-bucket definitions while building this
library, instead of guessing those from raw ad names. If it doesn't exist, skip this
step, nothing here depends on it, this package still builds fully self-contained on
Motion's glossary tags and creative content alone.

Top-spend sorting in Steps 2-5 below is a sampling method for finding one
representative example of each tag or mechanic, not a performance judgment. It picks
which creative to read for the seed entry's verbatim and visual; it does not mean the
tag or mechanic itself is proven to perform well, and this package never makes a
scale/cut call from it.

## Step 1: Check for an existing saved library first

Before pulling anything live, check whether this account already has a saved hook
tactic, headline tactic, or visual format library. If one exists for an axis, seed
directly from those entries, they're already the confirmed write-up of real account
evidence, and skip Steps 2-4 for that axis.

## Step 2: Pull the account's real ad library (for axes with nothing saved yet)

```
motion meta insights --workspace-id <id> --date-range last_365d --include-metrics \
  --glossary-category visual-format --glossary-category hook-tactic \
  --glossary-category headline-tactic --sort topSpend
```

Record `totalCount` and `providerTotalCount` to confirm the pull is complete before
treating it as this account's full tagged history.

## Step 3: Get the classification vocabulary

```
motion ai-glossary
```

Returns every category and value, with definitions. Use this as the vocabulary for
formats, hook tactics, and headline tactics, the same seed vocabulary Step 4 of `01`
classifies new submissions against.

## Step 4: Build each axis, tag by tag

For each tag value returned in Step 2's pull, on each of the three axes:

1. Take the creative count and spend for that tag from the pull's top-level
   `glossaryRollups`, using the `exclusive_value_only` allocation policy - it assigns
   a creative's spend to a tag only when that category has one value, and reports
   multi-tagged spend separately under `ambiguous`, so totals are never
   double-counted. Never sum row-level spend per tag: a creative carrying two tags
   would be counted twice, and these numbers go in front of the customer in the
   confirmation tables. Rows stay the evidence for which creatives carry the tag;
   the rollup is the source for the numbers.
2. Find the top-spend creative carrying that tag.
3. Pull its transcript and summary. Check the cache first: `motion cache
   search-summaries` or `motion cache get-creative` for that creative ID. Fall
   through to a live pull only on a clear cache miss or error, or when the sandbox
   cache feature is disabled - and scope it to that one creative, never a fresh
   account-wide pull: `motion meta insights --scope creative-asset-id
   --creative-asset-id <id> --include-transcript --summary-sections hookOrHeadline`
   for hook/headline tactics, `--summary-sections adDescription` for visual formats.
4. Extract the verbatim line (spoken hook, written headline, or the format's defining
   shape) and the visual description (what's actually on screen).
5. Write one seed entry per tag with: what it is, the verbatim, the visual, and the
   evidence (creative ID, creative count, spend). Saving spend here is an intentional,
   explicit exception to the usual "never save spend numbers into brain content" rule:
   this library uses spend as its own ranking signal for the swipe file, never as a
   read on ad performance or a scale/cut call.
6. Add one row to that axis's index.

**Standing rule:** every hook or headline seed entry needs both the verbatim line and
a visual description. A verbatim line alone is not a complete entry, same rule `01`
Step 5 applies to entries submitted later.

**Standing rule:** if a format's medium could be either video or static, state which
one the actual seed evidence used. Never leave it as "both."

## Step 5: Creative mechanics, the axis with no AI tag (but not unbuildable)

Motion has no AI tag for mechanics, so it's never a glossary pull like the other three
axes. That does not mean this axis starts empty, it means it's built by reading actual
creative content instead of reading tags. If this account already has a saved
mechanics library, seed from it (Step 1) and skip the rest of this step. If not, build
it live, in two tiers:

**Tier 1: check against a starting checklist of universal mechanics.** These eight
recur across accounts and niches, so check this account's real ad library for a
genuine example of each before assuming none exists:

1. The Implied Answer, the hook poses a question, the visuals silently answer it
2. The Social Witness, someone else notices the change
3. The Overheard Conversation, framed as a text thread or DM
4. The Reframe, validates a belief the viewer holds, then flips it
5. The Borrowed Enemy, describes a competitor or the status quo without naming it
6. The Trojan Horse, looks like ordinary content until the final stretch
7. The Contrast Without Comment, two realities shown side by side, no voiceover
8. This-and-a, the product placed next to something aspirational

For each, mark it tested (with the real example) or not confirmed (no genuine match
found yet), don't force a weak match just to check the box.

**Tier 2: find what this account does that isn't on that list.** Pull creative
breakdowns for a bounded sample of this account's ads: the top-spend creatives
spread across the account's visual formats (take the top 2-3 per format rather than
the top 15 overall, so one dominant format doesn't crowd out the others), capped at
roughly 15 creatives total via `--limit`. Only read beyond that cap if the sample
surfaced nothing new. Check the cache first for
each candidate creative ID (`motion cache get-creative` / `motion cache
search-summaries`); fall through to a live pull only on a clear cache miss or error,
or when the sandbox cache feature is disabled:
```
motion meta insights --workspace-id <id> --date-range last_365d \
  --summary-sections creativeBreakdown --sort topSpend --limit 15
```
Read the actual storyline in each breakdown to identify the structural device, not the
hook and not the visual format, the move that makes the concept land. For each new
mechanic found this way: describe what's actually happening (the hook, the visual, the
structure), name the cognitive move (what did the viewer have to do to get the point?),
note why it bypasses ad resistance, tag which awareness stage it fits, and attach the
evidence (creative ID, spend).

Write one seed entry per mechanic, Tier 1 or Tier 2, with the same verbatim-plus-visual
depth the other three axes get, plus the cognitive-move explanation this axis
specifically needs.

## Step 6: Hand off to confirmation

Everything built in Steps 1-5 is a candidate set, not yet live. Nothing from this
procedure enters the library until it clears the gate in
`05-library-confirmation.md`.

## Step 7: Log it

Once `05-library-confirmation.md` gets its yes and the seeded entries are written,
add one line to `/agent/brain/<workspace>/_changelog.md` noting that the
hook-script-mining library was built (or updated) and roughly what landed per axis.
This is the same workspace changelog the Meta and Voice of Customer onboarding
package's brain-organization convention uses, so a maintenance sweep of that
workspace's brain sees this new folder as accounted for, not stray.
