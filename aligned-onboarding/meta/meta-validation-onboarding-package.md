# Meta Validation: Onboarding Experience (Onboarding Package)

### Version 1.9 — patch: "north-star" renamed to creative-strategist language (July 2026)

**How Runneth proves it understood the account, by answering the customer's real questions and
building their weekly deck. This is the "catch" in Connect → Train → Validate.**

This is the third part of the Meta onboarding package. It runs after the
**Account Context Brain** (`/agent/brain/meta/account-context.md`) and the
**creative content layer** (Cacheth, surfaced through Knoweth) are in place.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **creative
> content layer** gives Runneth **the attributes** to do it. **Validation** proves the two
> actually work together by answering the customer's questions and building the artifact they'll
> live in.

Onboarding is not done when data is connected and trained. It is done when Runneth has
demonstrably understood the account, can answer from it, the customer has seen proof, and the
whole thing is locked into a routine that keeps running. A pass is not complete until the other
person catches the ball. This part is the catch.

This package is **Meta-only**. It never asks about, pulls, or reasons over other ad platforms or
competitors. Meta is the platform for this account by definition.

---

# How this part operates

## 1. Activation (what triggers it, and when)

Installing only stages this file. It does not self-run. To activate it, merge the guard block
below into `/agent/user.md`, then let the trigger below fire.

Merge the block using the standard behavior-snippet convention. It is sentinel-wrapped so it is
idempotent.

**MERGE INSTRUCTIONS:** If a block with the sentinel `runneth:meta-validation-gate` already
exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate it. Do not
edit anything outside the sentinels. The canonical copy of this block is the staged guard file
`/agent/brain/aligned-onboarding/guards/meta-validation-gate.md` - merge from that file,
copying the block byte-for-byte; never paraphrase, condense, or restate any part of it (the
package's post-install run does this in its single scripted guard merge). The block below is
shown for context and must stay identical to the staged file.

```
<!-- BEGIN runneth:meta-validation-gate v2 -->
Meta validation gate (workspace <workspaceId>):

- When the Account Context Brain (/agent/brain/meta/account-context.md) has all required fields
  [CONFIRMED] and the creative content layer has synced (the workspace's creatives are in
  Cacheth, surfaced through Knoweth), and validation has not yet been completed
  (/agent/brain/meta/validation.md missing or MVCE state = off), open the validation experience
  described in the Meta Validation onboarding package. Do not wait to be asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers to their starter questions, the weekly deck is
  built, live, and approved by the customer, a refresh routine keeps the deck updated on an agreed
  cadence, and Slack is connected so the team can ask questions. Record that state in
  /agent/brain/meta/validation.md.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
<!-- END runneth:meta-validation-gate v2 -->
```

## 2. Prerequisites (hard gate)

Do not start validation until both are true:

1. **Account Context Brain is `[CONFIRMED]`** - check the fields-confirmed count in the "File
   metadata" block at the end of `/agent/brain/meta/account-context.md`. All nine required interpretation fields signed off
   by a person. If any field is still `[AUTO]` or `[FLAGGED]`, finish that first. Validating
   against a guessed lens teaches the customer the wrong thing.
2. **The creative content layer is ready.** The workspace's creatives are in Cacheth: Knoweth
   injects matching summaries into the turn, and `motion cache search-summaries` finds them.

If either is missing, say so plainly and route back to that step. Do not fake a validation on an
incomplete foundation. Routing back means telling the person what is missing — it never means
writing per-creative files to the brain to compensate; if the cache has not synced, the fix is
the sync, not files.

## 3. Workspace scope

- Target workspace: `<workspaceId>` (ad account: `<name>`)
- Platform scope: **Meta only.** No other ad platforms. No competitors.
- Settings scope: the Account Context Brain is the sole source of account interpretation. Do not
  read or defer to Motion workspace settings (workspace goal, preferred KPI, spend threshold,
  attribution config).
- Every data pull names the account with `--workspace-id <workspaceId>` and follows the Motion CLI
  Data-Query Guide.

## 4. Where the result lives (persistence)

Save the validation record to `/agent/brain/meta/validation.md`. It captures:

- The starter questions the customer chose to validate, and their confirmed answers.
- Every context correction made during the loop (which Account Context Brain field changed, and
  what it changed to).
- The weekly deck: its route, its structure, and the reference it was built from.
- The lock-in state: deck approval, refresh routine id and cadence, Slack connection status.
- The MVCE state block (on/off, date, who signed off).

Write it as a plain-language reference document, the way a sharp analyst would hand off an account
to a teammate. State conclusions, not statuses. Index it in `/agent/INDEX.md` with aliases
(validation, MVCE, weekly deck, starter questions, onboarding proof) and a one-line note.

**Write it incrementally, not at the end.** Update `validation.md` after every confirmed
answer and every correction — never hold the record for a closing step. An interrupted
validation must leave a readable trail of exactly where it stopped. On re-entry (the gate
re-fires whenever `validation.md` is missing or MVCE is off), read the record first and
resume at the first unconfirmed question — never restart a loop the customer has already
half-finished.

---

# The validation experience

This runs as a warm, guided conversation, not a form. Runneth leads; the customer steers.

## Step 1 — Open the validation

Once the gate fires, Runneth opens in plain language. The intent, in Runneth's own words:

> "Your account context and creative library are locked in. Now I'd love for us to validate that
> I actually have everything I need to answer the questions you'll ask me about Meta. Two ways we
> can start, your pick."

Then offer the two doors, back to back:

- **Deck-first:** read Field 10 (the deck spec in `account-context.md`) before offering this
  door. If Field 10 is confirmed, lead with what's already known: "Based on your account
  context, I have a deck spec ready — [the confirmed sections, cadence, and exclusions from
  Field 10]. I can build it now. If you have an existing deck you'd like me to match for look
  and feel, share it and I'll use that as the visual reference." If Field 10 is not yet
  confirmed, say so and run its two beats first (they synthesize from already-confirmed fields
  — two questions, no new pull), then build.
- **Questions-first:** "Or, here's the list of questions I can already answer for you today. We
  can start there and confirm I'm reading the account the way you do."

Let the customer choose. If they pick deck-first, still run the answer-and-confirm loop (Step 2)
on the questions the deck implies, so the context gets validated either way. The deck is the
artifact; the loop is the proof.

## Step 2 — The answer-and-confirm loop (the catch)

Present the starter questions Runneth can answer today. **Runneth proposes; the customer confirms
or adds.** These are the foundational questions, not frequent queries. The default set:

1. What are our top winning ads this week?
2. How is performance by campaign / product?
3. What themes show up in our winning ads? (from AI tags and creative summaries)
4. What are we testing right now, and what's ready to scale?
5. Show me all our [product] ads — using a real product or concept name from this account.

Question 4 speaks the account's language and reads its structure. "Ready to scale" is the
neutral default — if the team has its own word for the testing-to-scaling transition
(graduate, promote, move to evergreen), it is captured with Fields 6 and 9 and the question
uses their word. Read Field 7 before answering: when campaigns are split by purpose, testing
vs scaling reads from the campaign level. When one shared creative pool serves every
campaign, say so plainly — pull by campaign name, report what each campaign is doing, and
note that a testing-to-scaling rule for creatives is not yet defined if the team wants that
tracked (see the dependency note at the end of this package). Deflecting the question is the
only wrong answer.

Question 5 is the name-level probe: the same product word can live at the campaign, ad set,
and ad level, and this question proves Runneth reads the right one. The answer must state
which name level it filtered and why (per the Data-Query Guide's name-level rules and the
Field 4 confirmed default), and must not silently treat the product as a campaign reference.
If the customer corrects the read, the fix lands in Field 4 (naming conventions) like any
other correction.

**When Field 10 is confirmed, anchor questions 2 and 4 in what's already known:**
- Question 2: replace "by campaign / product" with the confirmed reporting dimensions from
  Field 10. If the account slices by product, ask about the real product lines by name ("How
  is [product line A] performing vs [product line B]?") — never generically.
- Question 4: reference active seasonal campaigns from the Field 10 marketing calendar. If a
  campaign is currently running or approaching, name it ("[seasonal campaign] is active and
  [next one] is coming up — how are those tracking against your expectations?").

Invite the customer to add any question that matters to them that's missing. Capture the final
set.

Then, one question at a time:

1. **Answer it** from the Account Context Brain + the creative content layer, using the
   account's own interpretation (their metrics, their naming, their targets).
2. **Ask the confirm:** "Is that right? Am I missing anything?"
3. **On a yes:** note the confirmed answer and move to the next question.
4. **On a correction:** find the specific Account Context Brain field behind the miss, update it,
   say plainly what you changed, then re-answer and re-confirm before moving on.

Rules for the loop:

- Never move past a wrong answer. A correction is the point of the exercise, not a detour.
- Talk about the account, never the worksheet or the fields by number. "I had your primary
  conversion event as purchases, but it sounds like it's booked calls, I've updated that" not
  "Field 2 corrected."
- Keep it moving. When an answer lands, confirm and go. Don't over-explain a correct read.
- Show the work. Each answer states which filter and signal it used (naming decode, which name
  level it filtered — campaign, ad set, or ad — Cacheth tags, live metrics) and what it
  couldn't confirm. The customer can't correct a read they can't see.
- Show the creatives. When an answer references specific creatives, present them as a gallery
  per the Data-Query Guide's presenting-creatives contract: media rendered from each
  creative's Cacheth `url`, names decoded through the naming decoder — never a raw delimited
  ad name as the label.
- Register is a correctable read too. "I just wanted the table" or "why didn't you explain
  that?" is a correction like any other: adjust, and if it reflects how this team likes their
  answers (numbers first; interpretation always; offer before delivering), write it as a
  one-line answer-register note in account-context.md's "at a glance" section — the guard
  makes every future performance answer load it. See the Data-Query Guide's answering
  posture.
- Every correction is logged to `/agent/brain/meta/validation.md` and applied to
  `/agent/brain/meta/account-context.md` so the fix is durable.

## Step 3 — Build the weekly deck (the artifact)

**The deck is gated on Field 10.** Read Field 10 (the deck spec) before gathering anything. If
it is confirmed, the deck's structure, cadence, and exclusions are already known — pre-fill
from it and do not re-ask. If it is not confirmed, run Field 10's two beats right here (they
synthesize from already-confirmed fields — two questions, no new pull), then build. No deck is
built without a confirmed Field 10. A customer who only wants the question loop can skip the
deck — and Field 10 — entirely.

Then move to the deck:

> "Now the fun part. I have your deck spec ready — [the confirmed sections from Field 10]. I'm
> going to build it now. The one thing I still need: do you have an existing deck you'd like me
> to match for look and feel? If not, I'll use the Motion default."

Gather only what Field 10 does not already answer:

- **Visual reference (if any).** An existing deck to match for look and feel only — not for
  structure. Structure comes from Field 10.
- **Look and feel.** MotionUI by default, playable videos, equal-size creative cards.

Do not re-gather sections, snapshots, or date controls — Field 10 already answered them.

Build it on the report component library so the layout is proven, not hand-rolled. The deck
reads Field 10 for its structure and sections, the creative content layer (Cacheth, via
injection or the cache CLI) for creative facts (themes, hooks, tags, content), live motion CLI
pulls for performance (spend, winners, spend state), and the Account Context Brain for how
"best," "winner," and "ready to scale" are judged.

The deck is not just output. It is the proof that Runneth connected the pieces and understood them
well enough to produce something the team will use every week.

## Step 4 — Lock it in (approval, refresh routine, Slack)

Building the deck is not the finish line. Onboarding is complete only when the deck is something
the team will actually live in, it keeps itself current, and the team has a place to ask Runneth
questions. Three things, all required:

1. **The customer approves the deck.** Not "it exists," but "this is right, this is how we see our
   performance." If they want changes, iterate until they sign off. Their yes is the gate, not the
   build.
2. **A refresh routine is set up.** With the customer, agree how often the deck should update
   (weekly is common; some want daily) and set up a routine that refreshes it on that cadence.
   Confirm who owns it and whose access it runs on, since it depends on the Meta connection and the
   deck's destination.
3. **Slack is connected.** If the org has not connected Slack yet, get it connected so the team
   can ask Runneth questions where they already work. This is a web-app action; point them to it
   and confirm once it is done.

Then update the MVCE gate below.

## Step 5 — Flip MVCE on

Validation is complete, and the Minimum Viable Context Engine is on, when all five are true:

1. Must-have Meta context sources are connected and set to refresh (the Account Context Brain on
   its cadence; the creative cache syncs itself).
2. The customer has confirmed Runneth's answers to their starter questions.
3. The weekly deck is built, live, and approved by the customer.
4. A refresh routine keeps the deck updated on an agreed cadence.
5. Slack is connected so the team can ask Runneth questions.

Record the state in `/agent/brain/meta/validation.md`:

```yaml
mvce_state: on            # on | off
validated_on: <date>
signed_off_by: <person>
starter_questions_confirmed: <count>
context_corrections: <count>
weekly_deck_route: <app route>
weekly_deck_built_from: <reference | description>
weekly_deck_approved: <yes | no>
refresh_routine_id: <routine id>
refresh_cadence: <e.g. weekly Mon 9am | daily>
slack_connected: <yes | no>
```

MVCE is binary. If any of the five is not true, the state is `off` and validation is not done.
A questions-only customer can run the answer-and-confirm loop indefinitely without Field 10 or
a deck — but MVCE stays off until the deck is built and approved, which requires the Field 10
spec first.

**When MVCE flips on, pass the baton.** Validation's last act is pointing at the Knoweth
organize part (`knoweth-organize-onboarding-package.md`, staged beside this doc): its gates
open the organize step once the account questions are answered and content has landed. Check
that its guard blocks (`runneth:knoweth-organize`, `runneth:knoweth-brain`) are merged into
`/agent/user.md` per that doc's MERGE INSTRUCTIONS; if they are not, offer the merge now.
Onboarding is not handed off until the organize layer is active.

---

# Success signal

The hypothesis: once MVCE is on, the customer starts asking many more questions. Question volume
is the key onboarding success signal. Note the pre-MVCE baseline and watch for the lift after the
deck goes live. A flat question count after validation is a sign the deck did not create
confidence, worth a follow-up, not a silent pass.

---

# Refresh and re-validation

- The **weekly deck** regenerates on its cadence via the refresh routine set up in Step 4. After
  onboarding, this is the standing weekly deck, not a one-time artifact.
- **Re-validate** when the account changes in a way that could break an answer: a new primary
  conversion event, a naming-system change, a new product line, or a materially different funnel. Re-running
  the affected questions in the loop is enough; a full re-onboard is not.
- Log re-validations in `/agent/brain/meta/_changelog.md`, the same convention the other parts use.

---

# Dependency on the other parts (one open item)

- **The testing-to-scaling rule is a required input this part leans on.** The deck's
  "testing / scaling / ready to scale" snapshot needs a defined rule for when a creative moves
  from testing to scaling (some teams call this graduating — use the account's own word).
  Today the only related signal is Spend State (scaling / holding / declining), which comes
  from live Motion pulls — the creative content layer holds no performance data. The rule must
  be captured as an Account Context Brain field (fits field 6 test batching or field 9
  winner/cut criteria) so the deck produces that snapshot consistently. Until it is captured,
  treat that snapshot as `[FLAGGED]` and say the rule is still needed rather than guessing it.
- Interpretation precedence is unchanged: when the deck and the Account Context Brain disagree on
  what "best" or "winner" means, the Account Context Brain wins.

---

# How this actually governs Runneth (be honest about it)

This file is findable reference knowledge and its guard makes the trigger fire once merged into a
loaded layer. On its own it does not hard-enforce a schedule or a deck standard; it defines the
experience and the gate. Wiring the guard into `/agent/user.md` is what makes the trigger
always-on for the account, and that merge is admin-gated. This doc is the human-readable contract
the CSM, the customer, and Runneth can all point at.

---

# Changelog

Maintained in the package repo at `aligned-onboarding/CHANGELOG.md` — not staged to
customer brains.
