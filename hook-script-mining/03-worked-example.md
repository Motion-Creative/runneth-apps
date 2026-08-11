# 03: Worked Example

**Note:** everything below is an illustrative, made-up walkthrough to show the shape
of the pipeline end to end. It is not a real pull, not a real creator, and not real
engagement data. It also deliberately uses a generic, unnamed account rather than any
specific brand, this package installs across different accounts and its examples
should never carry another account's real names, quotes, or spend figures into a new
install. Treat it as a template to fill in once real submissions come in, not as
evidence of anything.

## Example A: a video where the note is about the hook (Path B, inferred)

**Submission (Slack):**

> Link: [video]
> Note: "Stopped scrolling immediately because of how she admits she Googled
> something embarrassing at 2am, it just feels so real."

**Stage 1, Step 2 (identify the axis):** The note is specifically about the opening
admission, the thing that stopped the scroll. That's a **hook tactic** call, not
visual format or mechanic, even though the video obviously has both of those too.

**Stage 1, Step 3 (classify against existing taxonomy):** Reads closest to
**Relatability**, a shared, specific experience stated plainly, matching this
account's existing Relatability hook entry pattern rather than needing a new bucket.

**Stage 1, Step 4 (entry):**
- Verbatim: "Okay so nobody warned me about this... I was googling 'is it normal to
  pee when you sneeze' at 2am like a crazy person."
- Visual: direct to camera, seated, casual, phone-selfie framing.
- Evidence trail: @example_creator, hypothetical video link, 4.2M views / 610K likes.
- Taste note (carried forward): "Stopped scrolling immediately because of the 2am
  Googling admission."

**Stage 2:** Since this is a video, the fuller beats get captured for context even
though hook was the only formally identified axis: tension ("thought I was fine after
the six-week check up, I was not"), proof (the 2am Googling), turn ("turns out it's
SO common"), payoff ("I wish someone had told me sooner"). If a second, independent
submission later shows this same shared-confession-then-normalization structure, it's
worth flagging as a candidate creative mechanic too, but that's a separate future
submission's job to trigger, not this one's.

## Example B: a static image where the note is about the format (Path B, inferred)

**Submission (Slack):**

> Link: [image]
> Note: "Love how this is just the quote at huge scale on a plain background, no
> product shot at all, it's basically a testimonial-quote-card."

**Stage 1, Step 2 (identify the axis):** The note is entirely about the *shape* of the
piece, not the words themselves. That's a **visual format** call.

**Stage 1, Step 3 (classify):** Matches this account's existing testimonial-quote-card
format directly, no new bucket needed.

**Stage 1, Step 4 (entry):**
- Verbatim: the on-screen quote text, transcribed exactly as shown.
- Visual: full-bleed quote at large scale, plain color-block background, no product
  imagery, attribution line at small scale.
- Evidence trail: source handle, image link.
- Taste note: "No product shot at all, that restraint is the whole appeal."

Note this one never gets classified as a hook or headline tactic entry, the note
wasn't about the words, it was about the shape. That distinction is the point of
identifying the axis first instead of tagging everything three ways by default.

## Example C: a note that doesn't map to any of the three

**Submission (Slack):**

> Link: [video]
> Note: "I like the sound they used here, it's stuck in my head."

**Stage 1, Step 2 (identify the axis):** This isn't about the hook, the format, or a
structural mechanic, it's about audio choice. **None of the three.**

**Handling:** Log it in `unclassified/` with the asset, the note, and the reason it
didn't fit. It does not get forced into hook, format, or mechanic just because those
are the only buckets that exist today. If sound choice keeps coming up across future
submissions, that's a real signal worth raising as a possible fourth axis later, not
something to solve by mis-filing this one entry now.

## Example D: explicit axis naming (Path A), on an account with no existing library yet

**Submission (Slack):**

> "@runneth add this as a mechanic" — [video link]

**Stage 1, Step 2 (Path A):** The person named the axis directly, mechanic. No
inference needed.

**Stage 1, Step 0 fallback in action:** This account doesn't have a creative-
mechanics library built yet, and Motion has no AI tag for mechanics to fall back to
either. So this classification happens against whatever mechanics candidates already
exist from this account's own prior submissions, not another account's presets. If
this is the very first mechanic submission for this account, it starts the library
rather than matching into one, and that's expected, not a gap to apologize for.

**Stage 1, Step 4 (entry):** Written up the same as any other entry, verbatim, visual,
evidence trail, taste note, just filed as the first candidate in what will become
this account's own mechanics library over time.

## What this hands off

Once Example A's Relatability entry and Example B's testimonial-quote-card entry are
each confirmed (with a second supporting example, per the confirmation gate in stage
2), the next real action is a direct prompt into the existing ideation engine:

> "Based on my library, give me a new hook using the 'nobody warned me' pattern for
> [this account's product], grounded in a real customer moment from our reviews."

That's the loop closing: individually submitted, intent-tagged assets, confirmed and
banked one axis at a time, now feeding a concept the same way this account's own
tested banks already do.
