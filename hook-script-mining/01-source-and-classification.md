# 01: Source and Classification

## Stage goal

Take one asset (video or image), sent on demand with a note on why someone likes it,
and turn it into exactly one classified library entry, not three, by identifying which
single axis the person's note is actually about.

## Step 0: Build the library first, before any submissions come in

This is the first thing that happens for a new account, before anyone submits a
single asset. It runs once, as its own sequence, and ends with a clear handoff to
ongoing submissions, it is not a rule applied quietly in the background.

The actual procedure, self-contained to this package, lives in
`04-bank-building-process.md`: what already exists per axis gets reused directly,
what doesn't gets built from this account's own real ad library (the exact Motion
pull, the glossary vocabulary, and the per-tag entry-writing steps), and creative
mechanics, which has no Motion tag to pull directly, gets built by checking a
universal-mechanics checklist against real evidence and reading creative breakdowns
for anything account-specific.

Nothing that procedure builds is treated as live until it clears
`05-library-confirmation.md`. Only after that confirmation does the library become
the target every new submission (Step 1 onward) checks against, before anything is
treated as a brand-new bucket.

This is not a bulk pull of outside creators and does not reopen the "no bulk sourcing"
scope rule for submissions, it's building this account's own seed evidence once, at
the start, from its own real ads.

## Step 1: Capture the asset and the note (required)

Every submission needs both:

1. **The asset**: a video or image link, sent ideally in Slack.
2. **The note**: what the person actually said they liked about it, in their own
   words. This is the required input, not optional context, everything downstream
   depends on reading this note correctly.

Also capture, when available: the source (creator/brand handle, platform), and any
visible popularity or performance signal (views/likes for organic content).

## Step 1a: If the asset is a link, this needs Apify to actually watch it

Step 0's library build pulls straight from Motion, no Apify involved. This step is
different: it applies whenever someone submits an outside link, a competitor ad, a
creator's post, an organic TikTok video, anything that isn't already in Motion's own
data. Nothing in Motion can fetch an arbitrary external video or its transcript, that
requires Apify.

1. **Check for a stored Apify credential first.** Follow the standard rule: if this
   workspace already has an Apify API token saved, use it without asking again. Never
   request a new one just because this is the first time this specific skill has
   needed it. (Connecting Apify is offered as step one of this package's setup at
   install, so most workspaces reach this point with a token already stored; this
   step is the catch for the ones that deferred it.)
2. **If nothing is stored yet, walk the person through getting one, then request it
   securely:**
   - Tell them plainly: create a free Apify account at
     `https://console.apify.com/sign-up` if they don't already have one.
   - Once signed in, go to Settings, then Integrations, then API tokens (or go
     directly to `https://console.apify.com/account/integrations`), and copy their
     personal API token.
   - Request it through the secure credential flow, never ask them to paste it into
     chat. One field, labeled "Apify API token," scoped to the `api.apify.com` host.
   - Once it's saved, use it going forward without asking again.
3. **This is a per-workspace credential.** Every account this package installs on
   needs its own Apify token, tokens are never shared or reused across different
   customers' installs.
4. **Use the token to pull the submitted link's real content** (caption, transcript,
   visible engagement) through the appropriate Apify actor for that platform before
   moving to Step 2. Classification always runs against the asset's actual content,
   never against the link or the note alone.

**Standing rule, once a token exists: Apify is not optional or best-effort.** Every
Instagram or TikTok link submitted to this skill goes through Apify to actually watch
it, every time, no exceptions. Never classify from the caption, the note, or a guess
at what the video probably shows instead of the real pulled content, and never skip
the Apify call because the note already seems descriptive enough. If the Apify call
fails for a specific link, say that plainly and stop, don't fall back to guessing from
metadata as if that were an acceptable substitute.

## Step 2: Identify the one axis

The note always drives this step, but it resolves one of two ways, checked in this
order:

**Path A: the note names the axis directly.** "Add as hook," "this is a visual
format," "file this as a mechanic." When the person states the axis outright, use it.
No inference needed, skip straight to Step 3 for that named axis. If what they named
isn't actually one of the three tracked axes (someone says "add this as a CTA
style"), treat it the same as an unmapped note below, don't force their direct
instruction into the nearest existing bucket just because it was stated confidently.

**Path B: the note describes why they like it, without naming an axis.** Read the
note and decide which single element it's actually reacting to, against this table:

| If the note is about... | The axis is... |
|---|---|
| The opening line or moment that stopped the scroll | **Hook tactic** (video) or **headline tactic** (static image), matching this account's existing spoken-vs-written split |
| The shape or production style of the piece itself | **Visual format** |
| What happens after the opener, the device or structure that delivers the rest of the idea | **Creative mechanic** |
| Something else entirely (a CTA style, a color choice, a sound, a caption device) | **None of the three.** Log it as a standalone candidate, do not force it into an existing bucket. |

Both paths land in the same place: one identified axis (or a logged "none of the
three"), carried into Step 3. Neither path lets the person pick where in the library
it saves, only which axis it's read against, the actual destination is always
computed from the axis (see "The library's structure" below), not stated by the
person.

If a note genuinely touches more than one axis, under either path, it's fine to
identify more than one, but only when the note actually supports it, never as a
default.

## Step 3: Tell the axes apart when it's ambiguous

Use these tests, not just the category names, when it's not obvious which axis a note
is actually about:

- **Visual format test**: strip out the specific words and the specific persuasion
  technique. What's left is the shape. Would this shape work with completely
  different copy and a completely different argument? Then it's a format.
- **Creative mechanic test**: swap out the specific subject but keep the underlying
  move. Would it still work the same way in a totally different niche? Mechanics are
  about how the persuasion or humor actually functions, not what it looks like
  (format) or what it says (hook/headline).
- **Hook vs. headline test**: would this sound natural if a person spoke it out loud
  at the start of a video? That's a hook. Would it sound stiff spoken aloud but read
  fine as on-screen text? That's a headline.

## Step 4: Classify the identified element

Read the asset against this account's own existing taxonomy for that one identified
axis, used as the seed vocabulary (already loaded per Step 0), not a generic list
built from scratch.

1. Try to fit it into an existing bucket from that axis's library.
2. If nothing fits, propose it as a **new candidate** for that axis rather than
   force-fitting it, and hold it for a human yes before it joins the working
   vocabulary, per `05-library-confirmation.md`.

## Step 5: Write the classification entry

Capture all three of the following for the identified element, never just the tag:

1. **Verbatim**: the exact line or moment, transcribed for video, or the exact
   on-screen text for a static, not paraphrased.
2. **Visual**: how it's delivered, framing, setting, delivery style, on-screen text,
   pacing.
3. **Evidence trail**: source (creator/brand handle), and whatever popularity or
   performance signal is available. **The exact original URL is required here, every
   time, never optional and never dropped even when the platform, creator, and
   verbatim are already captured.** It's what lets anyone go back and actually watch
   the real thing later, a description of it is not a substitute for the link itself.

Always carry the **personal taste note** forward as part of the entry. It's not just
metadata, it's the actual reason this asset is in the library at all, and it's what
distinguishes this library from a generic scrape.

**Also append a row to `new-angles-to-test.md`.** Every entry that reaches this step
came from an outside submission (Step 1a's link path), by definition something this
account hasn't run itself yet. Add one row: axis, tag/name, the verbatim, the source,
and the date. **This is additive, never a substitute.** The entry still gets written
to its normal axis home in `entries/`, same confirmed submission, same moment, the
row here is only a pointer into that entry so "what haven't we tried" has a direct
answer, it never becomes a second place something can live instead of the library.
Step 0's own-history seed never adds rows
here, that content is already tested by definition.

## When the note doesn't map to hook, format, or mechanic

Write it down anyway, as a standalone observation: the asset, the note, and why it
didn't fit an existing axis. If the same kind of "doesn't fit" note keeps showing up,
that's a real signal a fourth axis might be worth adding later, the same way the three
current axes were confirmed rather than assumed for this account.

## The library's structure

- `index.md`: one row per submitted asset, the identified axis (or "none"), its tag,
  source, and the personal note. Pre-loaded per Step 0 before any submissions arrive.
- `entries/`, split by axis (hook-tactics/, headline-tactics/, visual-formats/,
  mechanics/): one file per tactic/format/mechanic, aggregating multiple verbatim +
  visual + evidence examples under that tag.
- An `unclassified/` holding area for notes that didn't map to any of the three.
- `new-angles-to-test.md`: one row per confirmed entry that came from an outside
  submission specifically (Step 1a's link path, not Step 0's own-history seed),
  across every axis, until this account actually runs a real ad using it. This is the
  direct answer to "what have I sent you that we haven't tried yet." See Step 5 for
  how a row gets added, and `02-pattern-library-and-concept-use.md` for how a row
  comes off once it's been used.

Kept in its own folder, separate from this account's own tested paid-ad library,
cross-referenced to it rather than merged into it. Save it at
`/agent/brain/<workspace>/hook-script-mining/`, matching the path the
`hook-script-mining` skill and package manifest already use, never inside the
same folder as the account's own tested hook/headline/format libraries.

## Hand-off to stage 2

Once an asset is classified into its one identified axis, that single entry carries
forward into `02-pattern-library-and-concept-use.md`, where it gets checked against
the rest of the library for a recurring shape, not just filed and forgotten.
