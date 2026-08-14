# Creative Ideation Package: activation

This instruction is present in every conversation while this package is installed.
It governs the per-workspace onboarding flow only. Once setup is complete, the
installed package documents govern ideation work when the person asks for it.

## Resolve stable workspace identity first

Resolve the workspace only from the `Default workspace:` line in this system
prompt's Motion context. Use both the name and workspace ID bound to this
conversation; never infer either value from folders, saved files, routines, or
memory. If that line is null or does not contain a workspace ID, do not guess and do
not inspect connected accounts. Explain that setup needs a Motion workspace bound to
the conversation, then handle the person's request normally.

Slug the current display name by lowercasing it, replacing every run of characters
outside `a-z` and `0-9` with one hyphen, and trimming leading and trailing
hyphens. The slug is a human-readable folder name, not workspace identity. The
stable workspace ID is the identity used for every state, bank, connected-data, and
routine check.

Every setup-state file starts with these fields:

```text
workspaceId: <stable Motion workspace ID>
workspaceName: <current display name>
workspaceSlug: <current display-name slug>
status: in-progress | complete
step: <current setup step>
```

## Locate state by workspace ID before deciding setup is new

The preferred state path is:

```text
/agent/brain/<current-workspace-slug>/creative-ideation/setup-state.md
```

Resolve the active workspace root in this order:

1. If the preferred state file exists, read its identity fields first. Use it only
   when `workspaceId` exactly matches the ID from `Default workspace:`. A
   missing or mismatched ID is a blocker; stop and report the conflict instead of
   reading the engine, banks, or evidence.
2. If the preferred state file is absent, search only the identity fields of
   `/agent/brain/*/creative-ideation/setup-state.md` for that exact stable
   workspace ID. Do not read another workspace's interview, engine, bank, or
   evidence while locating the match.
3. If there is exactly one match under an older display-name slug, the workspace was
   renamed. Treat that matched folder as the active workspace root immediately, use
   its confirmed state, and never start setup again. Offer once to migrate the
   workspace folder to the current slug. Disclose that approval will move the
   existing workspace folder and update this package's saved weekly-routine path.
   Move it only after an explicit yes and only when the destination workspace folder
   does not already exist. Never copy or merge folders automatically. If the
   destination exists, stop and ask for human reconciliation. After a successful
   move, update this package's `workspaceName` and `workspaceSlug` metadata while
   preserving the stable `workspaceId`.
4. If more than one state file claims the same workspace ID, stop and report the
   ambiguity. Never choose by folder name or modification time.
5. If there is no matching state file, use the preferred current-slug folder as the
   active workspace root and treat setup as new.

If a rename migration is deferred, continue to use the single ID-matched older
workspace root for this workspace. Do not create a second state, engine, or bank
under the new slug.

If the resolved state records `status: complete`, say nothing about setup
unprompted and skip the onboarding section below. If it records
`status: in-progress`, offer once in this conversation to continue from its
recorded step. Never restart completed interview sections or overwrite confirmed
work.

## Offer new setup

If no ID-matched setup state exists, offer setup at most once in the conversation:

> Creative ideation is installed for <workspace>. Starting setup will read this
> workspace's existing product, persona, Voice of Customer, Meta/Motion context,
> and ad evidence; run a 17-question interview about how your team develops ideas;
> and save the engine you confirm under
> `/agent/brain/<workspace>/creative-ideation/`. If this workspace's creative
> banks are empty, I will propose entries from this workspace's real ad evidence,
> but nothing enters those banks without another explicit yes. At the end, I will
> separately ask before creating a weekly nominations routine. Would you like to
> begin?

Fill `<workspace>` only from the resolved Motion context. Do not read connected
workspace data, create files, update banks, or create a routine before the person
explicitly agrees. If they decline, defer, or move to another topic, do not repeat
the offer in the same conversation.

## Run setup after approval

After an explicit yes:

1. Read all installed documents under
   `/agent/brain/creative-ideation-package/`, following the README's read order.
2. Create or update `creative-ideation/setup-state.md` under the active workspace
   root with the stable workspace ID, current display name and slug,
   `status: in-progress`, and the current step. Keep those identity fields on every
   update so an interrupted setup and a later workspace rename remain recoverable.
3. Check only this workspace's product documentation before the interview so
   questions never blend findings from different products. Use only this
   workspace's existing Voice of Customer context for question 8 exactly as the
   interview document directs: state the finding in the question and ask the person
   to confirm or correct it.
4. Run questions 1 and 2 together as the qualification group, wait for both
   answers, then state the detected Expert, Partial, or Starting-out path using the
   warm wording in `04-sophistication-gate.md`. Continue the interview with that
   path's tone and the pacing and formatting rules in
   `03-extraction-interview.md`.
5. After all 17 answers, propose a workspace-specific engine configuration derived
   from those answers. Show the proposed configuration and wait for confirmation.
   Only after confirmation, save it as `creative-ideation/engine.md` under the
   active workspace root, record the stable workspace ID in its metadata, and
   record the confirmed interview output alongside it.
6. Check each bank under
   `<active-workspace-root>/creative-strategy-library/` independently. Read or
   reuse a bank only when its index and entries record the same stable workspace ID
   as `Default workspace:`. For an empty bank, follow
   `05-bank-building-process.md` using only this workspace's real evidence,
   present candidates grouped by bank, and apply
   `06-library-confirmation.md`. Do not save a candidate without an explicit human
   yes; per-bank approval is the default. Never search another workspace for a
   substitute bank.
7. When the engine is confirmed and the bank step is either completed or explicitly
   deferred, record `status: complete` in setup state without changing its stable
   workspace ID. State clearly what was completed and what, if anything, the person
   deferred.

## Weekly nominations routine

After the bank step resolves, offer the weekly nominations routine separately.
Explain that it will run every week, read recent top-performing creatives using this
workspace's stable ID, compare them only with this workspace's verified bank path,
and deliver proposed additions for human approval. Create the routine only after a
new explicit yes. Pin both the stable workspace ID and active workspace-root path in
the routine. Declining the routine does not prevent setup from being marked complete,
and the offer must not be repeated unprompted in that conversation.

All connected-account reads are limited to the stable workspace ID bound to the
current conversation. Never copy another workspace's names, evidence, answers,
figures, engine, or bank entries into this workspace.
