---
name: onboarding-walkthrough
description: Runs the account-context onboarding walkthrough — the guided fill-in conversation where Runneth presents what it learned about the Meta account and asks the questions only a human can answer. The invitation is "Are you ready to begin your onboarding?" — invoke on any affirmative reply to it, or when someone asks to begin, run, or resume their onboarding. Typically invoked by a CSM leading an onboarding call.
---

# Onboarding Walkthrough

This skill owns the **presentation** of the Account Context Brain fill-in: one guided
conversation, in a fixed three-part shape, that turns the silent post-install autofill into
confirmed account context. It does not define the fields — their meanings, pulls, confirm
loops, and saved outputs live in
`/agent/brain/meta-onboarding/meta-account-context-brain-onboarding-package.md` (the ACB
package). Read that document before presenting; this skill is the how-to-say-it, that
document is the what-it-means.

## Pre-flight

1. Read `/agent/brain/<workspace>/data-sources/meta/account-context.md`. Post-install writes it as a scaffold: every
   field header, autofilled facts, blockers recorded next to the fields they block.
2. If the scaffold does not exist or the autofill never ran, run the ACB package's Step 0
   (brand context pull) and Step 1 (the field pulls) first — silently, then present.
3. If the file shows all fields already confirmed, say so and offer the context health check
   instead of re-running the walkthrough.
4. Mine conversation history for prior human answers, per the ACB package's
   "Conversation evidence" rules: one bounded query pass per open question,
   human-authored messages only, this workspace's context only. A match pre-fills its
   field as a cited provisional read for the presentation; finding nothing changes
   nothing — the question is asked cold.
5. Name this conversation predictably so the person can always find their way back:
   if the runtime's conversation tooling supports setting the title, set it to
   "Runneth Onboarding - <Brand>" now; if it does not, the on-ramp beat below asks the
   person to rename it instead. Either way the on-ramp's star tip still goes out.

## Required output schema (the shape of the presentation)

The presentation follows one structural shape — three parts, always in this order. The
content within each part is entirely contextual and account-specific; only the structure is
fixed. This schema governs the one full fill-in presentation. Follow-up turns, corrections,
and refresh runs are ordinary conversation and do not re-run the three parts.

**Part 1 — Opening frame.** Three beats in order: brand story (from `motion brand-context`,
never inferred from ad names), then account findings (from the field pulls), then the
**on-ramp** — two or three sentences that lead with value and lower the effort bar: why
the questions coming up are worth a few minutes ("your answers here make every read I give
on this account sharper"), that voice notes are a fine way to answer ("feel free to
voice-note your answers"), the skip line — said here, once, and never repeated per
question ("and if a question doesn't apply to how you run things, just say so — I'll note
it and move on"), and the housekeeping line — this chat is named
"Runneth Onboarding - <Brand>" (or, when the title could not be set, a one-line ask to
rename it to that) — star it to find your way back anytime. 4–6 sentences of prose total,
no heading, never a list, never longer. Write it like a sharp analyst briefing a new
teammate on the account — never like a system log or a status report. The "no list, no
heading" rule applies to Part 1 only.

**The two-pile triage (runs before composing Parts 2 and 3).** Every confirmation still
open after pre-flight lands in one of two piles — this is what keeps the walkthrough from
reading like a form:

- **An assumption**, when Runneth can make a high-confidence read: the account's own
  evidence points one way, conversation evidence answered it (cited), or the data
  supports a sensible default. Assumptions are stated as reads ("I'll assume X"), never
  phrased as questions, and get blessed in one reply at the close.
- **A real question**, only when the answer is genuinely un-inferable — no evidence, no
  prior statement, no honest default. Real questions are capped at five and aimed at
  three. Each is one sentence carrying one ask; compound phrasing ("or do you…, and
  also…") is banned — split it or cut it.

Real questions are reserved for the **essential fields** (the ACB package's tiers:
sources of truth, conversion events, metric gotchas, naming conventions, funnel map,
targets/thresholds, reporting structure). A supporting field (attribution, account
structure, creative benchmarks) never spends a real question: it rides as an assumption
on its default, or waits until something actually needs the answer. The one sanctioned
exception is Field 8's benchmark question, which carries its default inline — any answer
settles it and nothing waits on it.

More than five questions surviving triage means the triage was too timid — re-triage
with honest defaults. Only when six or more are genuinely un-inferable do the
highest-stakes five go in this presentation, with the rest following in one short beat
after the first answers arrive — never a second wall. The cap never works the other way:
a shaky read must not become an assumption to duck it. A lazily blessed wrong default
poisons every downstream answer; confidence is the test, not convenience.

**Part 2 — Field sections, but only the ones that earn their place.** A section earns its
place by giving the customer something to **scan or answer**: structured data they need to
check (the naming tables, the calendar, the report outline), findings that ground a real
question, or a read they would be surprised by later. Everything else stays out of the
body. Specifically:

- A field whose confirmation triaged to an **assumption** and has nothing to scan gets
  **no body section at all** — its assumption appears exactly once, in the closing bless
  list. Never state an assumption in both a body section and the bless list; the bless
  list is its only home. When a body section carries the evidence behind an assumption
  (the naming tables), the bless-list line points at it ("the naming decode tables above
  are correct as read") instead of restating it.
- A field the pull fully settles with nothing the customer would be surprised by gets no
  section either — it lives in the saved file, not the readout.
- Sections that do appear run in field order; sanctioned consolidations (Fields 1–3 under
  a confirmed attribution tool) count as one. A typical readout carries three to six body
  sections, and the whole presentation should read in about a minute — when it runs long,
  cut body sections, never the closing block.

Each surviving section is: a bold
plain-language heading (never "Field N," never a status badge), then 2–4 bullets — lead with
the read, support with this account's real names and numbers, no prose paragraphs. Only a
section with a **real question**
ends with one — bold, standing alone as the section's last line, never
appended to the end of a finding bullet and never sharing a line with an observation — it
gets its own line, so it can't be missed. Two real questions
are allowed only when one section genuinely covers two distinct un-inferable confirmations
(Field 4's two decoder confirmations; Field 10's two beats — though triage applies to those
too, and usually settles at least one as an assumption); more than
two means the section is too broad — split it or cut a question.

**Conversation evidence seeds assumptions.** When pre-flight
step 4 found a person's own prior statement answering a section's open confirmation, the
section leads with that read and cites it inline — the date plus a short verbatim quote
("back on May 3 you said 'we read product names at the campaign level'") — and the
confirmation triages to an assumption, carrying its citation into the closing bless list.
The person's blanket approval there is still what confirms the field — the
citation just makes approving nearly free. Never cite Runneth's own words as the
person's, and never stretch an ambiguous quote to fit; a question asked cold beats a
wrong citation.

Two exceptions to the bullets. A table replaces them when the field contains structured data
the customer needs to scan and confirm — never force bullets onto a table. And the
naming-conventions section is **always a table** per Field 4's presentation rule in the ACB
package — the full breakdown as rows (one table per schema when there are several), never
bullets, never prose, and never compressed to a settled one-liner, even when the decoder is
confirmed. Campaign names and ad set names get the same treatment as ad names: when a
level carries its own pattern, its breakdown is its own table in this section with a
lead-in naming the level — never a one-line summary under another level's table (only a
level with no detectable pattern may compress to one line with an example). This section always closes
with the sheet shortcut, one casual line right after its confirmation ask: "And if your
naming conventions already live in a sheet or doc somewhere, just drop it in here — I'll
read it and save you the typing." Warm and offhand, never a formal upload step; a sheet
that arrives is handled per Field 4's sheet rules in the ACB package (agreements become
cited assumptions, mismatches become one plain question).

**Field 10 is a Part 2 section like the rest — the last one, in field order.** Its
section carries the two beats in the fixed output shape the ACB package's Field 10 rules
define: the marketing calendar as a bold label plus a Period | What's running table (or a
plain no-seasonal-pattern statement when the data shows none), then the reporting structure
as a bold label, a one-line lead-in, and the proposed report sections as a numbered list
grounded in this account's confirmed reads. Both beats triage like everything else: the
report structure is usually an assumption (it was synthesized from confirmed reads), while
the calendar ask ("anything coming up not yet in the account?") is usually a real question —
each lands in the closing block in its pile. That shape replaces the 2–4
bullet contract for this section. The synthesis reads the provisional naming
decode, so it requires decoded ad names: when the decode carries nothing to synthesize from
(no ad names, no dimension or campaign-type reads), skip the section entirely — no question,
no mention — and Field 10's beats run at report time inside validation instead. Corrections
the customer makes to Fields 4, 7, or 9 in this conversation update the Field 10 read
before it saves.

**Part 3 — Closing block: "What I need from you."** The whole closing block sits under
one bold header, verbatim: **What I need from you** — so the customer knows exactly where
their work starts. Two clearly labeled lists follow, each under its own bold sub-heading:

- First, **Confirm these assumptions are right:** — every assumption as a one-line
  bullet, in Part 2 order, each stated as a read in plain words (a conversation-evidence
  citation rides along where one seeded it), followed by this line: "One reply covers
  this list — \"all good\" works, or correct just the ones that are wrong."
- Second, **Questions to answer before onboarding is complete:** — the real questions as
  a numbered list, one line each, one ask each, in Part 2 order. Close with this line
  verbatim: "Just answer what you know — I'll write the context file from your responses."

An empty list is dropped along with its sub-heading (no questions means the closing line
follows the assumptions directly; no assumptions means "What I need from you" opens
straight onto the questions). The **What I need from you** header stays as long as either
list has items; if nothing is open at all, replace the whole block with: "Nothing open —
I'll write the context file now." This is the most important UX moment: the customer
settles everything from this block without scrolling back.

**Skeleton (structure is literal; every `<...>` is account-specific):**

```
<Opening frame: 4–6 sentences of prose — brand story (what they sell, who they sell to, what
makes them distinct), then account findings (spend scale, creative volume, naming system
quality, attribution status), then the on-ramp: why the questions are worth a few minutes,
the voice-note tip, the skip line, and the star tip with the chat's name. Include total
spend and creative count.>

**<Plain-language topic heading>**
- <The read this section leads with.>
- <Supporting finding, with this account's real names and numbers.>
- <Another finding, if the field has one.>

**<The one real question this leaves open — alone on its own line, never tacked onto a
bullet? Only when triage kept it a question.>**

<Fields whose assumptions carry nothing to scan have no section here — they appear only in
the closing bless list. Settled fields with nothing surprising are omitted entirely.>

**<Naming-conventions heading>**
<One-line lead-in: what the ad names encode and how reliable the pattern is.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per tag or position — the full breakdown, one table per schema if several> | <...> |

<One-line lead-in for the ad-set-name breakdown, when ad sets carry a pattern; a level
with no pattern compresses to one line with an example instead of a table.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per ad-set-name tag or position — same full-breakdown rule as ad names> | <...> |

<One-line lead-in for the campaign-name breakdown, when campaigns carry a pattern.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per campaign-name tag or position — same full-breakdown rule as ad names> | <...> |

**<Field 4's confirmation questions, bold, as the section's last bold line?>**

<The sheet shortcut, one casual line: "And if your naming conventions already live in a
sheet or doc somewhere, just drop it in here — I'll read it and save you the typing.">


<...only the remaining sections that earn their place, in field order...>

**Marketing calendar** <(source, e.g. "detected from your campaign launch dates"):>

| Period | What's running |
| --- | --- |
| <launch window, chronological> | <what runs in it> |
| Year-round | <standing campaign types that stay open> |

**<Beat 1's question — anything coming up not yet in the account?>**

**Reporting structure** <(source, e.g. "synthesized from your confirmed setup"):>
Here's the report I'd build from what you've confirmed:
1. **<Section name>** — <how it reads on this account's confirmed data>
2. **<Section name>** — <...>

**<Beat 2's ask — usually an assumption ("I'll run this weekly unless you'd rather
another cadence"), a bold question only when triage kept it one.>**

**What I need from you**

**Confirm these assumptions are right:**
- <Assumption, one line, stated as a read — "(you said this on <date>)" when
  conversation evidence seeded it>
- <Assumption>

One reply covers this list — "all good" works, or correct just the ones that are wrong.

**Questions to answer before onboarding is complete:**
1. <Real question — one sentence, one ask, same order as above>
2. <Real question>

Just answer what you know — I'll write the context file from your responses.
```

**Before sending, verify:**
- Three parts, in order, nothing before the opening frame or after the closing line.
- Part 1 is 4–6 sentences of prose — not a list, no heading (Part 1 only) — and carries
  all three beats: brand story, account findings, on-ramp (value line, voice-note tip,
  skip line, star tip). The skip line appears in the on-ramp only — never restated under
  individual questions.
- Part 2 sections are in field order; consolidated sections count as one. Every section
  earns its place (something to scan or answer); assumption-only fields with nothing to
  scan have no section, and no assumption is stated in both a body section and the bless
  list. Three to six body sections is the norm; the whole readout reads in about a minute.
- Every Part 2 section is 2–4 bullets under its bold heading — no prose paragraphs — except
  where a table carries structured data the customer needs to scan and confirm, and except
  the Field 10 section, which follows its fixed two-beat shape (calendar table, then
  numbered report sections).
- The naming-conventions section carries the full breakdown as a table — one table per
  schema when there are several (Field 4's presentation rule) — never bullets or a prose
  summary of the decoder. When ad sets or campaigns carry their own pattern, that level's
  breakdown appears as its own table, not a one-liner; only a level with no detectable
  pattern compresses to one line with an example.
- No field numbers, status badges, or worksheet labels anywhere.
- The triage ran: every open confirmation is either an assumption (high-confidence read
  only — never a shaky guess promoted to duck the cap) or a real question. Real questions
  number five or fewer (aim for three), each one sentence carrying one ask — no compound
  phrasing.
- At most one bold question per section (two only for the sanctioned Field 4 and Field 10
  sections, when triage keeps both open); assumption sections and settled fields have none.
- Every question stands alone on its own line — no question is appended to a finding bullet
  or shares a line with an observation.
- Every conversation citation carries a date and a short verbatim quote from a
  human-authored message; no quote is paraphrased or stretched into a claim the person
  did not make.
- The closing block opens with the bold **What I need from you** header and carries both
  labeled lists in Part 2 order — every assumption under "Confirm these assumptions are
  right:" (with its citation when seeded), every real question under "Questions to answer
  before onboarding is complete:" — and ends with the verbatim closing line. Nothing open
  appears in neither list.

## After the presentation

- Handle answers and corrections per the ACB package's field rules, and persist them to
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` as they confirm.
- **Blessing the assumptions is explicit sign-off** (the ACB package's "Assumptions"
  contract): a clear whole-list approval ("all good", "that's all right") confirms every
  assumption in the bless list at once — a person signed off, so the
  no-silent-confirmation rule holds. A correction to one item replaces that item with
  the corrected read; the rest confirm only if the reply also approves them. Assumptions
  never confirm by silence: an unanswered assumption stays provisional, resurfaces
  through progress recall (restated in full, beside the open questions), and blocks the
  same gates an unconfirmed field always blocks.
- **Skips follow the ACB package's "Skips" contract.** "Not relevant" confirms the field
  with the skip recorded (who, when, their words); the acknowledgment names any narrowed
  capability in one plain line and then drops the topic. "I don't know" is not a skip —
  it stays open, resurfaces in progress recall, and routes to a named teammate when one
  is given; one short clarifying line settles ambiguous answers. Fields 1, 2, and 9
  cannot be skipped: if someone tries — or tries to skip everything — explain in one line
  why those three are the floor and offer to do just those now.
- **The weekly report build is never offered in the walkthrough.** Field 10 (reporting
  structure and marketing calendar) already presented in Part 2 with everything else — that
  is its only appearance. The report itself does not exist for the customer until
  validation's question loop has run and confirmed: the Meta Validation package owns the
  report offer, at report time (its form — deck, dashboard, or document — is the customer's
  choice there). If the person explicitly asks for a report, deck, or dashboard, the
  validation package's rules apply (the question loop still completes validation).
- **Progress recall returns questions, not numbers.** When the person asks where they're
  at, what's left, or how far along they are ("where am I at?"), answer with the full text
  of every still-open item — unblessed assumptions restated as reads, open questions
  restated in full, one per line — never question numbers,
  field numbers, or a bare count ("questions 3 and 7 are left" means nothing without
  scrolling back). Confirmed items get at most a one-line summary; the open items are
  the body of the answer.
- An interrupted walkthrough resumes on the next invocation: pre-flight reads the file and
  presents only what is still open — restating each open question in full, per the
  progress-recall rule, never by number.
