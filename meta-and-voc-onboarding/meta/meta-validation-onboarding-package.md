# Meta Validation: Onboarding Experience (Onboarding Package)

### Version 1.13 — account-specific question generation, batch pre-answer, answer format contract (July 2026)

**How Runneth proves it understood the account, by answering the customer's real questions and
building their weekly deck. This is the "catch" in Connect → Train → Validate.**

This is the third part of the Meta onboarding package. It runs after the
**Account Context Brain** (`/agent/brain/<workspace>/data-sources/meta/account-context.md`) and the
**creative content layer** (Cacheth, summaries surfaced through Knoweth) are in place.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **creative
> content layer** gives Runneth **the attributes** to do it. **Validation** proves the two
> actually work together by answering the customer's questions and building the artifact they'll
> live in.

Onboarding is not done when data is connected and trained. It is done when Runneth has
demonstrably understood the account, can answer from it, the customer has seen proof, and the
whole thing is locked into a routine that keeps running. A pass is not complete until the other
person catches the ball. This part is the catch.

## The training loop (the operating principle)

The question loop and the deck build are **one training loop over one brain**. Every piece of
feedback the customer gives during either is a training signal for
`/agent/brain/<workspace>/data-sources/meta/account-context.md` (and its satellites: the naming decoder, Field 10) —
never a fix to apply to the output directly. The deck is a rendering of the context: the only
way to fix the deck is to fix the context and regenerate. The loop converges when the brain
produces answers and a deck the team recognizes as their own on the first try — corrections
trending to zero, not zero forever.

**Route every piece of feedback through the durability test before writing anything:**

- **A rule about how the team judges** ("we judge on CPA," "exclude agency campaigns") — the
  Account Context Brain field behind it. The test: would this still be true in three months,
  regardless of what's running? If the feedback names specific campaigns or this month's
  test, extract the rule behind it and store the rule — fields hold the lens, never the scene.
- **A current-state fact** ("we're testing statics right now") — use it in the answer now; it
  never enters an interpretation field. Live state belongs to live pulls.
- **A standing preference** — about answers ("numbers first, always") → the answer-register
  note; about the deck's structure ("never show ROAS in the deck") → Field 10; about the
  deck's look and feel ("always dark cards") → the deck record in `validation.md`, where the
  refresh routine reads it. An unqualified ask defaults to standing.
- **A one-off** ("bigger chart this week") — apply it to the current render and move on;
  nothing is written, and it reverts on the next refresh — say so.

When durable and ephemeral are hard to tell apart, ask — "is that just for now, or always?" —
and file it where the answer says.

**The loop does not end at MVCE.** A correction in any later conversation — week one or month
six — gets the same routing: notice it, classify it, persist it when durable. No scheduled
check-ins; be judicious about what a remark means and whether it needs remembering.

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
`/agent/brain/meta-and-voc-onboarding/guards/meta-validation-gate.md` - merge from that file,
copying the block byte-for-byte; never paraphrase, condense, or restate any part of it (the
package's post-install run does this in its single scripted guard merge). The block below is
shown for context and must stay identical to the staged file.

```
<!-- BEGIN runneth:meta-validation-gate v4 -->
Meta validation gate:

- Workspace folder: `/agent/brain/<workspace>/`, where `<workspace>` is this conversation's
  workspace name slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). Resolve it per conversation; the
  `<workspace>` token stays literal in this file. Every path below is inside this
  conversation's workspace folder, and each workspace validates independently.
- When the Account Context Brain (/agent/brain/<workspace>/data-sources/meta/account-context.md) has all required
  fields [CONFIRMED] and the creative content layer resolves (the workspace's creatives in
  Cacheth, surfaced through Knoweth - or, where the sandbox cache feature is disabled, live
  content pulls per the Cacheth Command Reference's ladder), and validation has not yet been
  completed (/agent/brain/<workspace>/data-sources/meta/validation.md missing or MVCE state = off), open the validation
  experience described in the Meta Validation onboarding package. Do not wait to be asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers to their starter questions, the weekly deck is
  built, live, and approved by the customer, a refresh routine keeps the deck updated on an agreed
  cadence, and Slack is connected so the team can ask questions. Record that state in
  /agent/brain/<workspace>/data-sources/meta/validation.md.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
- A deck change request is a context correction too: route it to the field behind it
  (structure, cadence, or slicing -> the deck spec, Field 10; winner or metric complaints ->
  the interpretation fields; labels -> naming), update the field, and regenerate the deck from
  context - never hand-edit the deck output. Durable corrections in any later conversation get
  the same routing; one-off or current-state remarks shape the answer or the current render,
  never the file.
<!-- END runneth:meta-validation-gate v4 -->
```

## 2. Prerequisites (hard gate)

Do not start validation until both are true:

1. **Account Context Brain is `[CONFIRMED]`** - check the fields-confirmed count in the "File
   metadata" block at the end of `/agent/brain/<workspace>/data-sources/meta/account-context.md`. All nine required interpretation fields signed off
   by a person. If any field is still `[AUTO]` or `[FLAGGED]`, finish that first. Validating
   against a guessed lens teaches the customer the wrong thing.
2. **The creative content layer resolves.** In the normal case the workspace's creatives are
   in Cacheth: Knoweth injects matching summaries into the turn, and
   `motion cache search-summaries` finds them. In a sandbox where the cache feature is not
   enabled (the `motion cache` commands fail with the explicit "Motion cache is disabled for
   this sandbox" message), the layer's live rung stands in (per the Cacheth Command
   Reference's ladder) — validation proceeds on live content reads; they are just slower. A
   cache that exists but has not synced yet is neither: the fix is the sync.

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

Save the validation record to `/agent/brain/<workspace>/data-sources/meta/validation.md`. It captures:

- The question set the customer validated — the generated baseline and account-specific
  questions plus any they added — and their confirmed answers.
- Every context correction made during the loop (which Account Context Brain field changed, and
  what it changed to).
- The weekly deck: its route, its structure, the reference it was built from, and the
  standing look-and-feel preferences the customer has confirmed — the refresh routine
  rebuilds from these, so a visual preference not recorded here is lost on the next refresh.
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

### Question generation — before the loop starts

Generate the question set from this account's confirmed context. This happens silently; the
customer sees a numbered list, never the generation step. **Runneth proposes; the customer
confirms or adds.** These are the foundational questions, not frequent queries.

**The baseline set always runs** — it tests the foundation:

1. What are our top winning ads this week?
2. How is performance by [the confirmed reporting dimensions from Field 10 — real names,
   never "campaign / product"]?
3. What themes show up in our winning ads? (creative summaries and AI tags — the one
   question that reads the creative content layer)
4. What are we testing right now in [the confirmed testing bucket from Field 7], and what's
   ready to scale?
5. Show me all our [product] ads — using a real product or concept name from the confirmed
   naming decoder.
6. When `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` exists: What are
   customers telling us they love, object to, or misunderstand — and which of our current
   ads speak to those signals?

Question 6 is conditional, not a validation prerequisite. A completed Voice of Customer
Audit makes it part of the starter set; cite the compiled themes and inspect their cited raw
evidence before repeating a claim or quote. If synced VoC exists but the manual audit has not
run, do not silently run it and do not block Meta validation. Say that the customer-voice
question becomes available after the person chooses to run the `voc-audit` skill.

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

**Field 10 anchors the baseline.** Questions 2 and 4 read the confirmed context directly:
the real reporting dimensions and product lines by name ("How is [product line A] performing
vs [product line B]?"), and active or approaching campaigns from the Field 10 marketing
calendar ("[seasonal campaign] is active and [next one] is coming up — how are those
tracking against your expectations?"). When Field 10 is not yet confirmed (the
questions-only path never requires it), fall back to the dimensions confirmed in Fields 4
and 7 — still this account's real names, never a generic "campaign / product."

**Then derive account-specific questions from the confirmed naming decoder and funnel map.**
For each `segment_filter` dimension in `naming-decoder.json` with at least 3 creatives and
meaningful spend in the current 7-day window (both computed from the primary pull below — no
extra calls), generate one performance question using the dimension's real `known_values`:
"How is [value A] performing against [value B] and [value C] on [the primary KPI]?" Skip a
dimension with only one known value or too small a spend spread to compare. Add the
winner/cut question anchored on Field 9's confirmed floor ("Is [top ad] a winner yet —
against the $[floor] / [N]-day rule?") and the testing-pipeline question from Field 7
("What's running in [testing bucket], when did each ad launch, and how is the last 7
days?").

The result is typically 7–12 questions. Present the numbered set and invite the customer to
add any question that matters to them that's missing. Capture the final set.

### Pre-answer the set in batch

Once the final set is captured, pull everything before presenting any answer:

- **Primary pull:** one `motion meta insights` call — `--filter` to Field 7's primary
  campaigns, `--include-metrics`, `--table-kpi` on the account's confirmed primary KPI key,
  attribution windows from Field 5 when they differ from the default, **no `--limit`**.
  Before any totals or all-ads claim, check the returned file's `totalCount` against the
  rows received; if they differ, say the read is partial. This one file answers the
  top-ads, dimension, and reporting-dimension questions — dimension slices are computed
  from returned rows through the naming decoder (`--group-by` supports nothing but
  `creative`; grouping is always client-side).
- **Testing pull:** the same shape filtered to Field 7's testing bucket. Covers the
  testing-pipeline question.
- **Lifetime pull (conditional):** only when Field 9's spend floor is lifetime, one
  wider-range pull for the winner/cut question — a 7-day window cannot prove a lifetime
  floor.
- **Creative content (the themes question only):** through the creative content layer's
  ladder as written in the Cacheth Command Reference — Knoweth-injected context first,
  `motion cache search-summaries` by theme text next, `motion cache get-creative` per
  confirmed winner for AI tags and transcripts (one `--creative-id` per call; tags live
  only on the full record), the live rung only when the cache cannot serve.

Answer every question from these files, using the account's own interpretation (their
metrics, their naming, their targets). For Question 6 and any customer-side WHY question
the customer adds, also read the saved Voice of Customer Audit and verify against its cited
raw VoC evidence. Then present the full Q&A together — not one question at a time.

### Answer format contract

Every answer in the set, in this order:

1. **The exact question** — bold, verbatim as presented in the set.
2. **2–4 bullets** — lead with the call, support with specifics. No prose paragraphs.
3. **A table** when comparing 3 or more items (dimension values, formats, campaigns).
4. **A creative gallery** per the Data-Query Guide's presenting-creatives contract whenever
   the answer names specific ads — cards carry the decoded name, the primary KPI value, and
   spend. Winner / Watch / Cut labels appear only on the winner/cut question's gallery:
   Field 9's criteria apply when a winner/cut question is asked, never as a stamp on every
   card.

One line of synthesis after the data is allowed when something is genuinely worth calling
out — an outlier, an unexpected gap, a pattern worth acting on. Skip it when the data
speaks for itself.

### Running the loop

Present the full pre-answered Q&A, then confirm per question, in order — "Is that right?
Am I missing anything?":

1. **On a yes:** record the confirmed answer in `validation.md` and move to the next.
2. **On a correction:** route it through the durability test (the training-loop principle
   above). A current-state remark shapes this answer only; a durable rule heals the specific
   Account Context Brain field behind the miss. Update the field, say plainly what you
   changed, then re-answer and re-confirm before moving on. Re-answer from the
   already-pulled files when the correction changes interpretation (a different winner
   metric re-ranks existing rows); re-pull only when the correction changes the pull itself
   (a corrected attribution window or campaign filter invalidates the file).

Rules for the loop:

- Never move past a wrong answer. A correction is the point of the exercise, not a detour.
- Talk about the account, never the worksheet or the fields by number. "I had your primary
  conversion event as purchases, but it sounds like it's booked calls, I've updated that" not
  "Field 2 corrected."
- Keep it moving. When an answer lands, confirm and go. Don't over-explain a correct read.
- Show the work. Each answer states which filter and signal it used (naming decode, which name
  level it filtered — campaign, ad set, or ad — Cacheth tags, live metrics, compiled VoC
  themes, or cited raw customer language) and what it couldn't confirm. The customer can't
  correct a read they can't see.
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
- Every correction is logged to `/agent/brain/<workspace>/data-sources/meta/validation.md` and applied to
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` so the fix is durable.

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
"best," "winner," and "ready to scale" are judged. When the deck includes customer insight,
messaging recommendations, or what-to-make-next guidance and a Voice of Customer Audit exists,
read it and cite its evidence; never substitute it for live performance or creative content.

The deck is not just output. It is the proof that Runneth connected the pieces and understood them
well enough to produce something the team will use every week.

## Step 4 — Lock it in (approval, refresh routine, Slack)

Building the deck is not the finish line. Onboarding is complete only when the deck is something
the team will actually live in, it keeps itself current, and the team has a place to ask Runneth
questions. Three things, all required:

1. **The customer approves the deck — at the spec level.** Not "it exists," but "this is the
   right structure, the right metrics, the right winners — this is how we see our
   performance." Every change request routes through the training loop before anything is
   rebuilt: deck structure, sections, cadence, or slicing → Field 10; what counts as a winner
   or which metric leads → the interpretation field behind it (Fields 1, 2, 9); names and
   labels → Field 4; standing look-and-feel → the deck record in `validation.md` (the refresh
   routine rebuilds from it); one-offs → this render only, reverting on refresh — say so.
   Update the home first, then regenerate the deck from it — never hand-edit the deck output
   directly; a hand-fixed deck reverts on its next scheduled refresh. Rebuild at the
   customer's pace: piecemeal feedback can rebuild as it lands, a burst of feedback routes
   fully first and rebuilds once. A correction that changes an interpretation field re-runs
   the affected loop questions (Step 2) — only those, never the full set — before the next
   build, and does not reset approval of untouched spec sections. Aesthetics do not gate
   approval; the spec does. Their yes is the gate, not the build.
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
2. Every question in the final set is **clean** — its latest answer was confirmed without
   correction. Corrections along the way are the loop working, not a failure; a correction
   (in the loop or during deck review) re-opens only the questions it touched, which are
   re-answered and re-confirmed. Never re-ask the full set to prove cleanliness — a
   question stays clean until a correction touches it.
3. The weekly deck is built, live, and approved at the spec level — as regenerated from
   context, never as hand-tweaked output.
4. A refresh routine keeps the deck updated on an agreed cadence.
5. Slack is connected so the team can ask Runneth questions.

Record the state in `/agent/brain/<workspace>/data-sources/meta/validation.md`:

```yaml
mvce_state: on            # on | off
validated_on: <date>
signed_off_by: <person>
starter_questions_confirmed: <count>
account_specific_questions_generated: <count>
account_specific_questions_confirmed: <count>
questions_clean: <n of m — latest answer confirmed without correction>
context_corrections: <total>
deck_rebuilds: <count>
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
- Log re-validations in
  `/agent/brain/<workspace>/data-sources/meta/_changelog.md`, the same convention the other
  Meta parts use.

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
  In the question loop, the testing-pipeline question reports what is running and its
  last-7-day performance and makes no scale recommendations until the rule is captured.
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

Maintained in the package repo at `meta-and-voc-onboarding/CHANGELOG.md` — not staged to
customer brains.
