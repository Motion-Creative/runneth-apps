---
name: onboarding-walkthrough
description: Runs the account-context onboarding walkthrough — the guided fill-in conversation where Runneth presents what it learned about the Meta account and asks the questions only a human can answer. The invitation is "Are you ready to begin your onboarding?" — invoke on any affirmative reply to it, or when someone asks to begin, run, or resume their onboarding. Typically invoked by a CSM leading an onboarding call.
---

# Onboarding Walkthrough

This skill owns the **presentation** of the Account Context Brain fill-in: one guided
conversation, in a fixed three-part shape, that turns the silent post-install autofill into
confirmed account context. It does not define the fields — their meanings, pulls, confirm
loops, and saved outputs live in
`/agent/brain/meta-and-voc-onboarding/meta-account-context-brain-onboarding-package.md` (the ACB
package). Read that document before presenting; this skill is the how-to-say-it, that
document is the what-it-means.

## Pre-flight

1. Read `/agent/brain/<workspace>/account-context.md`. Post-install writes it as a scaffold: every
   field header, autofilled facts, blockers recorded next to the fields they block.
2. If the scaffold does not exist or the autofill never ran, run the ACB package's Step 0
   (brand context pull) and Step 1 (the nine field pulls) first — silently, then present.
3. If the file shows all fields already confirmed, say so and offer the context health check
   instead of re-running the walkthrough.

## Required output schema (the shape of the presentation)

The presentation follows one structural shape — three parts, always in this order. The
content within each part is entirely contextual and account-specific; only the structure is
fixed. This schema governs the one full fill-in presentation. Follow-up turns, corrections,
and refresh runs are ordinary conversation and do not re-run the three parts.

**Part 1 — Opening frame.** Two beats in order: brand story (from `motion brand-context`,
never inferred from ad names), then account findings (from the field pulls). 4–6 sentences of
prose, no heading, never a list, never longer. Write it like a sharp analyst briefing a new
teammate on the account — never like a system log or a status report. The "no list, no
heading" rule applies to Part 1 only.

**Part 2 — Field sections.** One section per field, in field order. Sanctioned consolidations
(Fields 1–3 under a confirmed attribution tool) count as one section. Each section is: a bold
plain-language heading (never "Field N," never a status badge), the pulled findings grounded
in this account's real data, then at most one question as the section's last line — bold, so
it can't be missed. A field the pull fully settles gets no question: say what you know and
move on. Two questions are allowed only when one section genuinely covers two distinct
confirmations (Field 4's two decoder confirmations; Field 10's two beats, when they run in
this conversation); more than two means the section is too broad — split it or cut a question. Lead with what you know: the ratio
should feel like mostly settled reads with a few specific things still open.

Within a section, use the format the data deserves: prose for a settled one-sentence read, a
table or bullet list when the field contains structured data the customer needs to scan and
confirm. Never force prose onto a table. The naming-conventions section always includes the
full breakdown per Field 4's presentation rule in the ACB package — it is never compressed to
a settled one-liner, even when the decoder is confirmed.

**Part 3 — Closing TLDR.** Under the bold heading **Questions for you:**, a numbered list of
every open question from Part 2, one line each, in the order they appeared. Close with this
line verbatim: "Just answer what you know — I'll write the context file from your responses."
If nothing is open, replace the list and the closing line with: "Nothing open — I'll write
the context file now." This is the most important UX moment: the customer answers everything
from this block without scrolling back.

**Skeleton (structure is literal; every `<...>` is account-specific):**

```
<Brand story: 2–3 sentences — what they sell, who they sell to, what makes them distinct.>
<Account findings: 1–3 sentences — spend scale, creative volume, naming system quality,
attribution status. Include total spend and creative count.>

**<Plain-language topic heading>**
<What the pull found here, with this account's real names and numbers.>
**<The one question this leaves open?>**

**<Next topic heading>**
<Findings. This field is settled by the pull — one line on how it will be read, no question.>

<...one section per remaining field, in field order...>

**Questions for you:**
1. <Open question, one line, same order as above>
2. <Open question>
Just answer what you know — I'll write the context file from your responses.
```

**Before sending, verify:**
- Three parts, in order, nothing before the opening frame or after the closing line.
- Part 1 is 4–6 sentences of prose — not a list, no heading (Part 1 only; Part 2 sections
  use tables and bullets where the data calls for them).
- Part 2 sections are in field order; consolidated sections count as one.
- The naming-conventions section carries the full breakdown (Field 4's presentation rule),
  never a prose summary of the decoder.
- No field numbers, status badges, or worksheet labels anywhere.
- At most one bold question per section (two only for a sanctioned two-beat section); settled
  fields have none.
- The TLDR lists every open question from Part 2, in appearance order, and ends with the
  verbatim closing line.

## After the presentation

- Handle answers and corrections per the ACB package's field rules, and persist them to
  `/agent/brain/<workspace>/account-context.md` as they confirm.
- Once Fields 4, 7, and 9 are confirmed, offer Field 10's two beats (marketing calendar, then
  reporting structure) while the context is fresh — per the ACB package's Field 10 section.
  If the person is done for now, stop; the beats run at deck time instead (the Meta Validation
  package handles that). No deck is built until Field 10 is confirmed.
- An interrupted walkthrough resumes on the next invocation: pre-flight reads the file and
  presents only what is still open.
