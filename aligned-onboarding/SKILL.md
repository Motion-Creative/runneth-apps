---
name: aligned-onboarding
description: >
  Teaches Runneth how a customer reads their Meta ad account, captures customer-specific report and
  dashboard setup, then builds and maintains saved creative context. Three parts run in order: the
  Account Context Brain (how to analyze the account), Report Dashboard Setup (how to package
  account analysis for this team), and the Creative Corpus (durable creative attributes when useful).
  Meta only, one workspace at a time. Trigger on "run aligned onboarding", "set up my Meta account
  context", "set up report dashboard context", "teach Runneth how we read the account",
  "teach Runneth how we build dashboards", "build the creative corpus", or when a Meta performance
  or reporting question is asked before an account-context file is established for the workspace.
triggers:
  phrases:
    - "run aligned onboarding"
    - "aligned onboarding"
    - "set up my meta account context"
    - "build my account context"
    - "set up report dashboard context"
    - "set up dashboard reporting"
    - "teach runneth how we read the account"
    - "teach runneth how we build dashboards"
    - "build report dashboard context"
    - "build the creative corpus"
    - "onboard my meta account"
  intent: "User wants Runneth to learn how their Meta account should be interpreted, how report/dashboard surfaces should be packaged, and how to build saved creative context."
---

# Aligned Onboarding

Teaches Runneth how this customer reads their Meta ad account, captures how the team wants reports
and dashboards packaged, then builds saved creative context off that lens. It ships as three parts
that do different jobs and persist to customer-owned locations.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. **Report Dashboard
> Setup** tells Runneth **how to package that analysis for this team**. The **Creative Corpus**
> gives Runneth **durable creative context it should reuse when useful**.

Read the package overview at `/agent/brain/aligned-onboarding/README.md` before running. The full
procedures live in the staged docs and define the contract for each step:

- Account Context Brain: `/agent/brain/aligned-onboarding/account-context-brain.md`
- Report Dashboard Setup: `/agent/brain/aligned-onboarding/report-dashboard-setup.md`
- Creative Corpus playbook: `/agent/brain/aligned-onboarding/creative-corpus-playbook.md`
- Motion CLI data-query guide: `/agent/brain/aligned-onboarding/motion-cli-data-query-guide.md`

## Scope rules (apply throughout)

- **Meta only.** Never pull or reason about other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta data, the
  worksheet, and customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <workspaceId>`.
- **Brain files are customer-facing.** Save account interpretation, report/dashboard preferences,
  taxonomy, cadence, and creative attributes in plain business language. Never write tool-calling
  nuances, CLI commands or flags, or debugging notes into the saved files.
- **Customer setup stays visible and editable.** Report/dashboard preferences belong in the
  established indexed reporting/app setup file for the workspace. Use this package's default only
  when that file does not exist yet. Do not hide those rules in runtime config or app code.
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
   validate, and flag what cannot be captured. Update the established indexed account-context file
   for this workspace, or create this package's default if none exists yet, and index it in
   `/agent/INDEX.md`. `[AUTO]` values stay proposals until a person signs off.
4. **Run Report Dashboard Setup.** Follow `report-dashboard-setup.md`: merge the report-dashboard
   guard block into `/agent/user.md`, read this workspace's account-context file, inspect saved
   Motion report metadata and existing app or routine registry entries when available, confirm the
   team's reporting preferences with a person, then update the established indexed reporting/app
   setup file for this workspace, or create this package's default if none exists yet, and index it
   in `/agent/INDEX.md`.
5. **Reuse corpus-search when deliberate filterable search is needed.** If
   `/agent/tools/corpus-search/` is not already present, fetch corpus-search from the public library
   and install it per its own install-config; never clobber a customized copy. It supplements default
   Brain retrieval for deliberate, filterable search. Register the resolved creative-context folder
   as a source with `kind: creative`.
6. **Build the Creative Corpus.** Follow `creative-corpus-playbook.md`: read what the Account
   Context Brain already knows, pull source-backed creative data from Motion only when it is needed
   for durable saved context, and write or update creative-context Markdown files in the established
   creative-context folder, or create this package's default if none exists yet.
   Motion or the creative store remains authoritative for exact creative content and media. Refresh
   the corpus-search source too if installed.
7. **Keep all three current.** Account Context Brain on a monthly-plus-drift cadence, Report
   Dashboard Setup when reporting preferences or saved reports change, and Creative Corpus on daily
   and event-triggered maintenance. Log every refresh in `/agent/brain/meta/_changelog.md`.

## Precedence

The established indexed account-context file for this workspace owns account interpretation (how
"best," "winner," and cost-per are judged). It defers only to a metric the user names explicitly in
the current turn.

The established indexed reporting/app setup file for this workspace owns report and dashboard
packaging: standard views, saved-report trust, metric order, thresholds, date windows, taxonomy,
creative evidence requirements, visual expectations, and delivery cadence. It defers to explicit
current-turn instructions and to a named saved Motion report unless the report-dashboard context says
that report is not trusted or should be adapted.

The Creative Corpus reads the Account Context Brain for interpretation and the Report Dashboard
Setup for report-surface evidence requirements. It never re-derives either one. When the corpus and
the Account Context Brain disagree about account interpretation, the Account Context Brain wins.
