# Meta Validation: Onboarding Experience (Onboarding Package)

### Version 1.1 — draft for review (July 2026)

**How Runneth proves it understood the account, by answering the customer's real questions and
building their weekly deck. This is the "catch" in Connect → Train → Validate.**

This is the third part of the Meta onboarding package. It runs after the
**Account Context Brain** (`/agent/brain/meta/account-context.md`) and the
**Creative Corpus** (`/agent/brain/meta/creatives/`) are in place.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Corpus** gives Runneth **the attributes** to do it. **Validation** proves the two actually
> work together by answering the customer's questions and building the artifact they'll live in.

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
edit anything outside the sentinels.

```
<!-- BEGIN runneth:meta-validation-gate v1 -->
Meta validation gate (workspace <workspaceId>):

- When the Account Context Brain (/agent/brain/meta/account-context.md) has all required fields
  [CONFIRMED] and the Creative Corpus (/agent/brain/meta/creatives/) is built, and validation has
  not yet been completed (/agent/brain/meta/validation.md missing or MVCE state = off), open the
  validation experience described in the Meta Validation onboarding package. Do not wait to be
  asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers to their starter questions, the weekly deck is
  built, live, and approved by the customer, a refresh routine keeps the deck updated on an agreed
  cadence, and Slack is connected so the team can ask questions. Record that state in
  /agent/brain/meta/validation.md.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
<!-- END runneth:meta-validation-gate v1 -->
```

## 2. Prerequisites (hard gate)

Do not start validation until both are true:

1. **Account Context Brain is `[CONFIRMED]`.** All nine required interpretation fields signed off
   by a person. If any field is still `[AUTO]` or `[FLAGGED]`, finish that first. Validating
   against a guessed lens teaches the customer the wrong thing.
2. **Creative Corpus is built.** Per-creative files exist under `/agent/brain/meta/creatives/`
   for the active set.

If either is missing, say so plainly and route back to that step. Do not fake a validation on an
incomplete foundation. Routing back means telling the person what is missing — it never means
auto-running the Creative Attribution build and storing summary files in the brain; in staging,
creative summaries live in Cacheth and are surfaced through Knoweth.

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

---

# The validation experience

This runs as a warm, guided conversation, not a form. Runneth leads; the customer steers.

## Step 1 — Open the validation

Once the gate fires, Runneth opens in plain language. The intent, in Runneth's own words:

> "Your account context and creative library are locked in. Now I'd love for us to validate that
> I actually have everything I need to answer the questions you'll ask me about Meta. Two ways we
> can start, your pick."

Then offer the two doors, back to back:

- **Deck-first:** "Do you already have a weekly deck you share with your team? Send it over and
  I'll recreate it inside Runneth, then we'll pressure-test the numbers together."
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
4. What are we testing right now, and what's scaling or ready to graduate?

Invite the customer to add any question that matters to them that's missing. Capture the final
set.

Then, one question at a time:

1. **Answer it** from the Account Context Brain + Creative Corpus, using the account's own
   interpretation (their metrics, their naming, their targets).
2. **Ask the confirm:** "Is that right? Am I missing anything?"
3. **On a yes:** note the confirmed answer and move to the next question.
4. **On a correction:** find the specific Account Context Brain field behind the miss, update it,
   say plainly what you changed, then re-answer and re-confirm before moving on.

Rules for the loop:

- Never move past a wrong answer. A correction is the point of the exercise, not a detour.
- Talk about the account, never the worksheet or the fields by number. "I had your north-star
  event as purchases, but it sounds like it's booked calls, I've updated that" not "Field 2
  corrected."
- Keep it moving. When an answer lands, confirm and go. Don't over-explain a correct read.
- Every correction is logged to `/agent/brain/meta/validation.md` and applied to
  `/agent/brain/meta/account-context.md` so the fix is durable.

## Step 3 — Build the weekly deck (the artifact)

Once the questions are confirmed, move to the deck:

> "Now the fun part. I'd love to build the weekly deck your team will actually look at. Do you
> have a reference I can match? Or just describe what you want, which snapshots, how it should
> look, and I'll build it."

Gather:

- **Reference or description.** An existing deck to recreate, or a written description.
- **Snapshots.** The data views they want (e.g. top creatives by spend with CPA / thumbstop /
  hold rate / outbound CTR, per-product slices, a testing/graduated section, a winners + graduated
  summary with iteration ideas).
- **Controls.** Date behavior (custom range plus Last 7 / 14 / 30 days is the common ask).
- **Look and feel.** MotionUI by default, playable videos, equal-size creative cards.

Build it on the report component library so the layout is proven, not hand-rolled. The deck reads
the Creative Corpus for the creative snapshots (winners, themes, spend state, graduation) and the
Account Context Brain for how "best," "winner," and "graduated" are judged.

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

1. Must-have Meta context sources are connected and set to refresh (the Account Context Brain and
   Creative Corpus on their cadences).
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
- **Re-validate** when the account changes in a way that could break an answer: a new north-star
  metric, a naming-system change, a new product line, or a materially different funnel. Re-running
  the affected questions in the loop is enough; a full re-onboard is not.
- Log re-validations in `/agent/brain/meta/_changelog.md`, the same convention the other parts use.

---

# Dependency on the other parts (one open item)

- **Graduation is a required input this part leans on.** The deck's "scaling / graduated / ready
  to graduate" snapshot needs a defined graduation rule. Today the Creative Corpus only carries
  Spend State (scaling / holding / declining). The graduation rule must be captured as an Account
  Context Brain field (fits field 6 test batching or field 9 scale rule) so the deck produces that
  snapshot consistently. Until it is captured, treat the graduated snapshot as `[FLAGGED]` and say
  the rule is still needed rather than guessing it.
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

## v1.1 (July 2026) — added lock-in step

- New Step 4 "Lock it in": deck approval, refresh routine, Slack connection. Onboarding is not
  complete until all three are done.
- MVCE gate expanded from 3 conditions to 5: added deck approval, refresh routine, Slack
  connection.
- Validation record now captures `weekly_deck_approved`, `refresh_routine_id`,
  `refresh_cadence`, and `slack_connected`.
- Guard block updated to reflect the five-condition completion gate.

## v1.0 (July 2026) — initial draft

- New third part of the Meta onboarding package: turns "connected + trained" into "validated."
- Meta-only, no competitors. Runneth proposes the starter questions; the customer confirms or adds.
- Two entry doors (deck-first or questions-first) that converge on the same answer-and-confirm loop.
- The loop heals the Account Context Brain on every correction.
- The weekly deck is the MVCE proof artifact, built on the report component library.
- Flags graduation as a required Account Context Brain field the deck depends on.
