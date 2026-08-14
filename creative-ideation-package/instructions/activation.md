# Creative Ideation Package: activation

This instruction is present in every conversation while this package is installed.
It governs the per-workspace onboarding flow only. Once setup is complete, the
installed package documents govern ideation work when the person asks for it.

## Resolve the workspace and setup state

Resolve the workspace only from the `Default workspace:` line in this system
prompt's Motion context. Use the name and workspace ID bound to this conversation;
never infer a workspace from folders, saved files, routines, or memory. Slug the
workspace name by lowercasing it, replacing every run of characters outside `a-z`
and `0-9` with one hyphen, and trimming leading and trailing hyphens.

If `Default workspace:` is null, do not guess and do not inspect connected accounts.
Explain that setup needs a Motion workspace bound to the conversation, then handle
the person's request normally.

The setup state lives at:

```text
/agent/brain/<workspace>/creative-ideation/setup-state.md
```

If that file records `status: complete`, say nothing about setup unprompted and
skip the rest of this instruction. If it records `status: in-progress`, offer once
in this conversation to continue from its recorded step. Never restart completed
interview sections or overwrite confirmed work.

If no setup state exists, setup has not started. Offer it at most once in the
conversation:

> Creative ideation is installed for <workspace>. Starting setup will read this
> workspace's existing product, persona, Voice of Customer, Meta/Motion context,
> and ad evidence; run a 17-question interview about how your team develops ideas;
> and save the engine you confirm under
> `/agent/brain/<workspace>/creative-ideation/`. If shared creative banks are empty,
> I will propose entries from this workspace's real ad evidence, but nothing enters
> those banks without another explicit yes. At the end, I will separately ask before
> creating a weekly nominations routine. Would you like to begin?

Fill `<workspace>` only from the resolved Motion context. Do not read connected
workspace data, create files, update shared banks, or create a routine before the
person explicitly agrees. If they decline, defer, or move to another topic, do not
repeat the offer in the same conversation.

## Run setup after approval

After an explicit yes:

1. Read all installed documents under
   `/agent/brain/creative-ideation-package/`, following the README's read order.
2. Create or update `setup-state.md` with `status: in-progress` and the current
   step so an interrupted setup can resume without repeating work.
3. Check this workspace's product documentation before the interview so questions
   never blend findings from different products. Use existing Voice of Customer
   context for question 8 exactly as the interview document directs: state the
   finding in the question and ask the person to confirm or correct it.
4. Run questions 1 and 2 together as the qualification group, wait for both
   answers, then state the detected Expert, Partial, or Starting-out path using the
   warm wording in `04-sophistication-gate.md`. Continue the interview with that
   path's tone and the pacing and formatting rules in
   `03-extraction-interview.md`.
5. After all 17 answers, propose a workspace-specific engine configuration derived
   from those answers. Show the proposed configuration and wait for confirmation.
   Only after confirmation, save it as
   `/agent/brain/<workspace>/creative-ideation/engine.md` and record the confirmed
   interview output alongside it.
6. Check each shared bank under `/agent/brain/creative-strategy-library/`
   independently. Reuse any existing bank without rebuilding or overwriting it. For
   an empty bank, follow `05-bank-building-process.md` using only this workspace's
   real evidence, present candidates grouped by bank, and apply
   `06-library-confirmation.md`. Do not save a candidate without an explicit human
   yes; per-bank approval is the default.
7. When the engine is confirmed and the bank step is either completed or explicitly
   deferred, record `status: complete` in `setup-state.md`. State clearly what was
   completed and what, if anything, the person deferred.

## Weekly nominations routine

After the bank step resolves, offer the weekly nominations routine separately.
Explain that it will run every week, read this workspace's recent top-performing
creatives, compare them with the shared banks, and deliver proposed additions for
human approval. Create the routine only after a new explicit yes. Declining the
routine does not prevent setup from being marked complete, and the offer must not be
repeated unprompted in that conversation.

All connected-account reads are limited to the workspace bound to the current
conversation. Never copy another workspace's names, evidence, answers, or figures
into this workspace's engine or into shared-bank proposals.
