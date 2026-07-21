---
name: aligned-onboarding
description: >
  Teaches Runneth how a customer reads their Meta ad account, then builds and maintains one
  enriched record per active creative. Two parts run in order: the Account Context Brain (how to
  analyze the account) and the Creative Corpus (the per-creative attributes). Meta only, one
  workspace at a time. Trigger on "run aligned onboarding", "set up my Meta account context",
  "build my account context", "teach Runneth how we read the account", "build the creative corpus",
  or when a Meta performance question is asked and /agent/brain/meta/account-context.md does not
  exist yet.
triggers:
  phrases:
    - "run aligned onboarding"
    - "aligned onboarding"
    - "set up my meta account context"
    - "build my account context"
    - "teach runneth how we read the account"
    - "build the creative corpus"
    - "onboard my meta account"
  intent: "User wants Runneth to learn how their Meta account should be interpreted and build the per-creative corpus."
---

# Aligned Onboarding

Teaches Runneth how this customer reads their Meta ad account, then builds the per-creative corpus
off that lens. It ships as two parts that do different jobs and persist to different places.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Corpus** gives Runneth **the attributes it needs to actually do the job**.

Read the package overview at `/agent/brain/meta/README.md` before running. The full
procedures live in the staged docs and are the source of truth for each step:

- Account Context Brain: `/agent/brain/meta/account-context-brain.md`
- Creative Corpus playbook: `/agent/brain/meta/creative-corpus-playbook.md`
- Motion CLI data-query guide: `/agent/brain/meta/motion-cli-data-query-guide.md`

## Scope rules (apply throughout)

- **Meta only.** Never pull or reason about other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta data, the
  worksheet, and customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <workspaceId>`.
- **Brain files are customer-facing.** Save only account interpretation. Never write tool-calling
  nuances, CLI commands or flags, or debugging notes into the saved files.
- **Onboarding pull window is `last_365d`** for the fill-in only, so onboarding sees enough history.

## Run order

1. **Resolve the workspace.** Confirm the target `<workspaceId>` (the Meta account being onboarded).
   Use `motion workspaces` if it is not already known.
2. **Activate the guard.** Merge the account-context guard block from `account-context-brain.md`
   into /agent/user.md using the sentinel convention (`runneth:account-context-guard`),
   substituting the real `<workspaceId>`. Author it from `building-integrations/behavior-snippet.md`.
   Replace an existing block in place; never duplicate it.
3. **Run the Account Context Brain fill-in.** Follow `account-context-brain.md`: auto-pull all nine
   fields, present them together as one overview, confirm the open questions with a person,
   validate, and flag what cannot be captured. Write the prose result to
   `/agent/brain/meta/account-context.md` and index it in `/agent/INDEX.md`. `[AUTO]` values stay
   proposals until a person signs off.
4. **Reuse corpus-search (optional but recommended).** If `/agent/tools/corpus-search/` is not
   already present, fetch corpus-search from the public library and install it per its own
   install-config; never clobber a customized copy. It supplements Knoweth for deliberate,
   filterable search. Register `/agent/brain/meta/creatives` as a source with `kind: creative`.
5. **Build the Creative Corpus.** Follow `creative-corpus-playbook.md`: read what the Account
   Context Brain already knows, pull only the creative content from Motion, and write one enriched
   Markdown file per active creative under `/agent/brain/meta/creatives/`. Writing the files is the
   index step for Knoweth; index the corpus-search source too if installed.
6. **Keep both current.** Account Context Brain on a monthly-plus-drift cadence; Creative Corpus on
   daily and event-triggered maintenance. Log every refresh in `/agent/brain/meta/_changelog.md`.

## Precedence

`/agent/brain/meta/account-context.md` is the sole source of account interpretation (how "best,"
"winner," and cost-per are judged). It defers only to a metric the user names explicitly in the
current turn. The Creative Corpus reads the Account Context Brain and never re-derives it; when they
disagree, the Account Context Brain wins.
