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

**Part 2 — Field sections.** One section per field, in field order. Sanctioned consolidations
(Fields 1–3 under a confirmed attribution tool) count as one section. Each section is: a bold
plain-language heading (never "Field N," never a status badge), then 2–4 bullets — lead with
the read, support with this account's real names and numbers, no prose paragraphs — then at
most one question, bold, standing alone as the section's last line. The question is never
appended to the end of a finding bullet and never shares a line with an observation — it
gets its own line, so it can't be missed. A field the pull
fully settles gets no question: say what you know in the bullets and move on. Two questions
are allowed only when one section genuinely covers two distinct confirmations (Field 4's two
decoder confirmations; Field 10's two beats); more than
two means the section is too broad — split it or cut a question. Lead with what you know: the ratio
should feel like mostly settled reads with a few specific things still open.

**Conversation evidence converts open questions into cited confirms.** When pre-flight
step 4 found a person's own prior statement answering a section's open question, the
section leads with that read and cites it inline — the date plus a short verbatim quote
("back on May 3 you said 'we read product names at the campaign level'") — and the
section's bold question becomes a one-word confirm of the cited read ("Still right?")
instead of an open-ended ask. The cited confirm still lands in the closing TLDR with its
citation, because the person's answer here is still what confirms the field — the
citation just makes answering nearly free. Never cite Runneth's own words as the
person's, and never stretch an ambiguous quote to fit; a question asked cold beats a
wrong citation.

Two exceptions to the bullets. A table replaces them when the field contains structured data
the customer needs to scan and confirm — never force bullets onto a table. And the
naming-conventions section is **always a table** per Field 4's presentation rule in the ACB
package — the full breakdown as rows (one table per schema when there are several), never
bullets, never prose, and never compressed to a settled one-liner, even when the decoder is
confirmed. Campaign names get the same treatment as ad names: when campaigns carry their
own pattern, the campaign breakdown is its own table in this section with a lead-in naming
the level — never a one-line summary under the ad-name table.

**Field 10 is a Part 2 section like the rest — the last one, in field order.** Its
section carries the two beats in the fixed output shape the ACB package's Field 10 rules
define: the marketing calendar as a bold label plus a Period | What's running table (or a
plain no-seasonal-pattern statement when the data shows none), then the reporting structure
as a bold label, a one-line lead-in, and the proposed report sections as a numbered list
grounded in this account's confirmed reads — each beat ending in its one bold question on
its own line, both landing in the closing TLDR with the rest. That shape replaces the 2–4
bullet contract for this section. The synthesis reads the provisional naming
decode, so it requires decoded ad names: when the decode carries nothing to synthesize from
(no ad names, no dimension or campaign-type reads), skip the section entirely — no question,
no mention — and Field 10's beats run at report time inside validation instead. Corrections
the customer makes to Fields 4, 7, or 9 in this conversation update the Field 10 read
before it saves.

**Part 3 — Closing TLDR.** Under the bold heading **Questions for you:**, a numbered list of
every open question from Part 2, one line each, in the order they appeared. Close with this
line verbatim: "Just answer what you know — I'll write the context file from your responses."
If nothing is open, replace the list and the closing line with: "Nothing open — I'll write
the context file now." This is the most important UX moment: the customer answers everything
from this block without scrolling back.

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

**<The one question this leaves open — alone on its own line, never tacked onto a bullet?>**

**<Next topic heading>**
- <Findings, 2–4 bullets. This field is settled by the pull — the bullets say how it will be
  read, no question.>

**<Naming-conventions heading>**
<One-line lead-in: what the ad names encode and how reliable the pattern is.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per tag or position — the full breakdown, one table per schema if several> | <...> |

<One-line lead-in for the campaign-name breakdown, when campaigns carry a pattern.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per campaign-name tag or position — same full-breakdown rule as ad names> | <...> |

**<Field 4's confirmation questions, bold, as the last line?>**

<...one section per remaining field, in field order...>

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

**<Beat 2's question — does this match, and what cadence should the report run on?>**

**Questions for you:**
1. <Open question, one line, same order as above>
2. <Open question>
Just answer what you know — I'll write the context file from your responses.
```

**Before sending, verify:**
- Three parts, in order, nothing before the opening frame or after the closing line.
- Part 1 is 4–6 sentences of prose — not a list, no heading (Part 1 only) — and carries
  all three beats: brand story, account findings, on-ramp (value line, voice-note tip,
  skip line, star tip). The skip line appears in the on-ramp only — never restated under
  individual questions.
- Part 2 sections are in field order; consolidated sections count as one.
- Every Part 2 section is 2–4 bullets under its bold heading — no prose paragraphs — except
  where a table carries structured data the customer needs to scan and confirm, and except
  the Field 10 section, which follows its fixed two-beat shape (calendar table, then
  numbered report sections).
- The naming-conventions section carries the full breakdown as a table — one table per
  schema when there are several (Field 4's presentation rule) — never bullets or a prose
  summary of the decoder. When campaigns carry their own pattern, the campaign-name
  breakdown appears as its own table, not a one-liner.
- No field numbers, status badges, or worksheet labels anywhere.
- At most one bold question per section (two only for the sanctioned Field 4 and Field 10
  sections); settled fields have none.
- Every question stands alone on its own line — no question is appended to a finding bullet
  or shares a line with an observation.
- Every conversation citation carries a date and a short verbatim quote from a
  human-authored message; no quote is paraphrased or stretched into a claim the person
  did not make.
- The TLDR lists every open question from Part 2, in appearance order, and ends with the
  verbatim closing line.

## After the presentation

- Handle answers and corrections per the ACB package's field rules, and persist them to
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` as they confirm.
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
  of every still-open question, restated in full one per line — never question numbers,
  field numbers, or a bare count ("questions 3 and 7 are left" means nothing without
  scrolling back). Confirmed items get at most a one-line summary; the open questions are
  the body of the answer.
- An interrupted walkthrough resumes on the next invocation: pre-flight reads the file and
  presents only what is still open — restating each open question in full, per the
  progress-recall rule, never by number.
