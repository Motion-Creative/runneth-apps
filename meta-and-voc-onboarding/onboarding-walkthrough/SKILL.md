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

1. Read `/agent/brain/<workspace>/data-sources/meta/account-context.md`. Post-install writes it as a scaffold: every
   field header, autofilled facts, blockers recorded next to the fields they block.
2. If the scaffold does not exist or the autofill never ran, run the ACB package's Step 0
   (brand context pull) and Step 1 (the field pulls) first — silently, then present.
3. If the file shows all fields already confirmed, say so and offer the context health check
   instead of re-running the walkthrough.

## Required output schema (the shape of the presentation)

The presentation follows one structural shape — three parts, always in this order. The
content within each part is entirely contextual and account-specific; only the structure is
fixed. This schema governs the one full fill-in presentation. Follow-up turns, corrections,
and refresh runs are ordinary conversation and do not re-run the three parts.

**Part 1 — Opening frame.** Two beats in order: brand story (from `motion brand-context`,
never inferred from ad names), then account findings (from the field pulls). 2–3 sentences of
prose, no heading, never a list, never longer. Write it like a sharp analyst briefing a new
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

Two exceptions to the bullets. A table replaces them when the field contains structured data
the customer needs to scan and confirm — never force bullets onto a table. And the
naming-conventions section is **always a table** per Field 4's presentation rule in the ACB
package — the full breakdown as rows (one table per schema when there are several), never
bullets, never prose, and never compressed to a settled one-liner, even when the decoder is
confirmed.

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
<Opening frame: 2–3 sentences of prose — brand story (what they sell, who they sell to, what
makes them distinct), then account findings (spend scale, creative volume, naming system
quality, attribution status). Include total spend and creative count.>

**<Plain-language topic heading>**
- <The read this section leads with.>
- <Supporting finding, with this account's real names and numbers.>
- <Another finding, if the field has one.>

**<The one question this leaves open — alone on its own line, never tacked onto a bullet?>**

**<Next topic heading>**
- <Findings, 2–4 bullets. This field is settled by the pull — the bullets say how it will be
  read, no question.>

**<Naming-conventions heading>**
<One-line lead-in: what the names encode and how reliable the pattern is.>

| <Field / Tag> | <Known values / Meaning> |
| --- | --- |
| <one row per tag or position — the full breakdown, one table per schema if several> | <...> |

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
- Part 1 is 2–3 sentences of prose — not a list, no heading (Part 1 only).
- Part 2 sections are in field order; consolidated sections count as one.
- Every Part 2 section is 2–4 bullets under its bold heading — no prose paragraphs — except
  where a table carries structured data the customer needs to scan and confirm, and except
  the Field 10 section, which follows its fixed two-beat shape (calendar table, then
  numbered report sections).
- The naming-conventions section carries the full breakdown as a table — one table per
  schema when there are several (Field 4's presentation rule) — never bullets or a prose
  summary of the decoder.
- No field numbers, status badges, or worksheet labels anywhere.
- At most one bold question per section (two only for the sanctioned Field 4 and Field 10
  sections); settled fields have none.
- Every question stands alone on its own line — no question is appended to a finding bullet
  or shares a line with an observation.
- The TLDR lists every open question from Part 2, in appearance order, and ends with the
  verbatim closing line.

## After the presentation

- Handle answers and corrections per the ACB package's field rules, and persist them to
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` as they confirm.
- **The weekly report build is never offered in the walkthrough.** Field 10 (reporting
  structure and marketing calendar) already presented in Part 2 with everything else — that
  is its only appearance. The report itself does not exist for the customer until
  validation's question loop has run and confirmed: the Meta Validation package owns the
  report offer, at report time (its form — deck, dashboard, or document — is the customer's
  choice there). If the person explicitly asks for a report, deck, or dashboard, the
  validation package's rules apply (the question loop still completes validation).
- **Then, with the Meta beats done, present the Voice of Customer summary — proactively, not
  on request.** This is the walkthrough's closing beat, separate from the fixed three-part
  presentation, and it never cuts the Meta onboarding short: it runs only after the
  account-context questions are handled.
  Inspect this workspace's platform folders under
  `/agent/brain/<workspace>/data-sources/voc/` and the routines whose prompts name this exact
  workspace id and a VoC platform source,
  then tell the person what customer voice the brain actually holds: one line per
  integration — the platform, what kind of voice it carries, how many items are synced, how
  many products they span, and the date coverage. For example: "Judge.me: 1,240 reviews
  across 6 products, May 2025 – July 2026." If a backfill is still running, present the
  counts so far and say the sync is still filling in. If no VoC integration is connected
  for this workspace, say that in one line and move on — no audit offer.
- **Then offer the Voice of Customer Audit by previewing the plan, in Runneth's own words —
  never a script.** The offer walks through what the audit will actually do with this
  workspace's data: now that the reviews and comments are in, Runneth would like to run an
  audit — it will separate every entry by product, score each 1–5 for usefulness, and break
  the strong ones into five buckets, named plainly (pain points — what was wrong before
  they bought; trigger moments — what actually made them pull the trigger; objections —
  what nearly stopped them; transformations — what changed after; standout language — the
  best verbatim lines kept in one swipe file), plus evidence-backed personas for each
  product with 200 or more entries, saved as one compiled page the brain reads for
  customer-side WHY questions and validation. Close the preview by handing the plan to the
  person: would they like anything added, and do they have existing docs to use as
  reference (existing personas especially)? Then the trigger is theirs:
  - **Data ready, no audit yet:** check whether
    `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` exists; if not,
    make the offer above. If `/agent/brain/<workspace>/_changelog.md` has no
    `voc-audit-offer` entry, append a dated one. A yes invokes the `voc-audit` skill,
    carrying any additions and reference docs the person named.
  - **An audit already exists:** say when it last ran and roughly how much new customer
    voice has synced since, and offer a rerun instead.
  - **Backfill incomplete or under 200 entries:** still present the summary and the
    preview, then say the audit will be ready when coverage completes — never start it
    against a partial backfill.

  The audit runs only on a person's yes here or an explicit later request — never because
  the walkthrough completed. The audit is a detour, never an exit: if any Meta onboarding
  business is still open in this conversation when the yes lands, say the audit is queued,
  finish the Meta thread, then run it — the validation gate still fires on its own once the
  fields confirm, whether or not the audit ran.
- An interrupted walkthrough resumes on the next invocation: pre-flight reads the file and
  presents only what is still open.
