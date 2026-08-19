---
name: setup-creator-intelligence
description: Set up Creator Intel for one Motion workspace after the person accepts the first-fresh-session offer, or when they explicitly ask to set up, organize, or activate their creator roster.
triggers:
  phrases:
    - set up creator intel
    - set up my creator roster
    - help me organize our creators
    - activate creator intel
  intent: After an explicit yes, select the workspace, learn how the team works, and create resumable customer-owned state.
---

# Set up Creator Intel

This skill never runs as an install hook. It runs in a fresh session after the person accepts the package instruction's offer, or when they invoke setup directly. It creates the customer-owned state tree for one Motion workspace and captures how the team works so later stages are grounded. It creates empty state plus setup answers only. It never pulls creator performance or confirms a creator.

## Stage 0: Consent and workspace

- If the person invoked setup directly, open with a one-line overview and treat their request as authorization to present the effects disclosure. If this skill resumed from an accepted first-session offer, do not offer setup again; continue with the disclosure.
- Before reading Motion or connected accounts, checking connection state, or writing customer state, say that setup will inspect the selected Motion workspace and any roster source the person chooses, then create workspace-scoped Creator Intel records. Wait for an explicit yes. One yes covers the setup reads and state writes described here, not later roster pulls, app builds, routines, or destructive actions.
- If the account has exactly one workspace, use it and say so. Do not ask.
- If there is more than one workspace, ask once which workspace to set up, and store its real `workspaceId`.
- Never write customer state inside `/agent/brain/creator-intel-reference/`.
- Setup is idempotent and resumable. Reruns update the same workspace record, read `setupPhase` and `pendingAction`, and never duplicate state or connection work.

## Stage 1: Understand how you work

Ask these one at a time. Everything already known from context is confirmed, not re-asked.

### 1a. How performance is measured

- First check whether the Meta onboarding package is installed and an Account Context doc exists for this workspace.
- If Account Context exists, do not ask an open question. Confirm: "I found your Account Context from the Meta onboarding, so I'll judge creators the way your account is set up, by [the goal it names]. Want me to use that, or measure them differently?"
- If Account Context does not exist, say: "You don't have Account Context set up yet, so by default I'll measure creators by spend. Is that okay, or would you rather judge them another way, like ROAS, CPA, or a specific conversion?"
- Never ask about Northbeam. Record the chosen measure in `workspace.json.performanceMeasure`.

### 1b. Connect what you have

- Ask: "Where does your creator roster live: a Notion database, a spreadsheet, or just your ad naming conventions?"
- Then use the core connection owner for that source:
  - Notion: use the available native or connected-integration flow and its authoritative connection state. Never ask for a Notion API key in chat or create a parallel credential path.
  - Spreadsheet: use the native Google connection and read the selected Sheet. Sharing or exporting is a fallback, not the default.
  - Asana, Airtable, Monday, or another supported tool: use `integrations` to inspect setup metadata and active accounts, reuse the one clearly selected account, or offer the returned connection flow. If several accounts match, ask which one. Fall back to export only if no connection path exists.
  - Only naming conventions: no source to connect. Say plainly the roster will come from Meta ad names alone, so cost and rights fields will be missing and the ROI page will not appear.
- Before a connection handoff, persist `setupPhase` and a bounded `pendingAction` so the same setup skill resumes after OAuth or connection completion. Store only a stable connection reference: connection kind, provider/app, account id and label, selected resource id, and status. Never store tokens, API keys, cookies, or provider response bodies.
- If a roster source exists, ask: "Does that same source hold what you pay each creator, or is that somewhere else?" Store a separate cost-source reference. This decides whether the ROI page can be built. If no cost data exists anywhere, say the ROI page will be left out.
- Rights: ask "How do you handle usage rights: roughly the same for everyone, say all whitelisted, or does it vary by creator?" If the roster source already has a rights column, skip the open ask, say you will read rights from there, and just confirm the default.
- Determine how creators are identified in the ad account without asking cold. First check whether the account context or any documented naming breakdown already defines it; if so, use that. Otherwise make one bounded naming sample with `motion meta ads --grain ads --date-range last_365d --workspace-id <workspaceId> --limit 100`, inspect the returned file, infer the creator tag or token, and surface oddballs: editor or owner tokens that are not the on-camera creator, employee or EGC ads, non-creator statics, and name variants to reconcile. Do not request metrics for this setup-only sample. Confirm the inferred convention with the person rather than asking an open question. Store it as `rosterSource.adCreatorNamingConvention`. Only ask directly if the ad names genuinely do not reveal a pattern.
- Record the roster source reference, cost source reference, rights default, and ad-account creator naming convention in `workspace.json`. Connection references identify accounts and resources but never contain credential values.

### 1c. How you hire creators, then ground it

- Ask: "When you bring on a new creator, are you usually casting for a specific brief, filling a theme or messaging angle, or matching a product? And how do you decide who to push for?"
- If a brand-audit already exists for the workspace, make this lighter: say you already see their angles and personas and just confirm the hiring lens.
- Then immediately try to ground the answer in existing signals before asking for anything more. For each dimension they name, check whether it is already visible:
  - products, from ad naming conventions or Account Context
  - personas, from Account Context, brand context, or a review audit
  - campaigns and themes, from ad naming conventions
- Fill in what you can from those sources. Only ask the person for the dimensions you genuinely cannot derive. If a dimension exists nowhere in their data, say so plainly and ask them to provide it.
- The goal is to map how they hire onto signals already living in their ads and account, so Stage 4 recommendations are grounded, not abstract. Store the hiring lens, what was grounded, and any gaps in `workspace.json.hiringLens`.

## What setup creates

After the person approves setup, seed these customer-owned records when missing, preserving existing contents on rerun. Use the exact `schemaVersion: 1` envelopes in `creator-data-contract.md`; never choose a different envelope or replace a collection with a bare array:

- `workspace.json`: `schemaVersion`, `workspaceId`, `workspaceName`, `status`, `setupPhase`, `pendingAction`, `defaultConversationLanguage`, `performanceMeasure`, `rosterSource`, `costSource`, `recommendationSources`, `hiringLens`, `manualRefreshOnly`, `createdAt`, `updatedAt`, `setupOwner`
- `identities.json.identities[]`
- `relationships.json.relationships[]` (carries the simple per-creator rights object)
- `evidence-map.json.evidence[]`
- `recommendations.json.recommendations[]`
- `pending-review.json.items[]`
- `refresh-state.json`: one Meta source record
- `performance/`: empty directory, no snapshot files
- `audit.jsonl`: after the complete state tree exists and `workspace.json.status` is `active`, append one `workspace_setup` event if missing. A resumed setup repairs missing state first and never appends a duplicate completed-setup event.

For a new setup, create the collection files and empty `performance/` directory first, then write `workspace.json` with `status: setup-in-progress`. Update `setupPhase` and `pendingAction` after every answer or connection handoff so a fresh session can resume. Write the final `workspace.json` update last. `status: active` and `setupPhase: complete` are valid only after every required file and the empty `performance/` directory exist. Use the current requester as `setupOwner` unless they name someone else.

## Output after setup

Confirm setup is ready for the workspace, state the chosen performance measure, name the roster source and whether the ROI page will be available, and say the next move is to build and confirm the roster.
