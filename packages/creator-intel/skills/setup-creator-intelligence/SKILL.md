---
name: setup-creator-intelligence
description: Set up Creator Intel for one Motion workspace at install time and learn how the team works. Use right after install, or when someone asks to set up their creator roster, organize their creators, or activate Creator Intel for a workspace.
triggers:
  phrases:
    - set up creator intel
    - set up my creator roster
    - help me organize our creators
    - build our creator roster
    - activate creator intel
  intent: Run Stage 0 (install and workspace) and Stage 1 (understand how the team works), then seed customer-owned state.
---

# Set up Creator Intel

This skill runs at install. It creates the customer-owned state tree for one Motion workspace and captures how the team works so later stages are grounded. It creates empty state plus the setup answers only. It never pulls creator performance or confirms a creator.

## Stage 0: Install and workspace

- Open with a one-line overview: this builds a trusted dashboard of your creators and their performance from your naming conventions and creator database, and recommends new creators worth working with. Then offer to set it up now.
- If the account has exactly one workspace, use it and say so. Do not ask.
- If there is more than one workspace, ask once which workspace to set up, and store its real `workspaceId`.
- Never write customer state inside `/agent/brain/creator-intel-reference/`.
- Setup is idempotent. Reruns update the same workspace record and never duplicate state.

## Stage 1: Understand how you work

Ask these one at a time. Everything already known from context is confirmed, not re-asked.

### 1a. How performance is measured

- First check whether the Meta onboarding package is installed and an Account Context doc exists for this workspace.
- If Account Context exists, do not ask an open question. Confirm: "I found your Account Context from the Meta onboarding, so I'll judge creators the way your account is set up, by [the goal it names]. Want me to use that, or measure them differently?"
- If Account Context does not exist, say: "You don't have Account Context set up yet, so by default I'll measure creators by spend. Is that okay, or would you rather judge them another way, like ROAS, CPA, or a specific conversion?"
- Never ask about Northbeam. Record the chosen measure in `workspace.json.performanceMeasure`.

### 1b. Connect what you have

- Ask: "Where does your creator roster live: a Notion database, a spreadsheet, or just your ad naming conventions?"
- Then get that source connected so it can be read live, branching on the answer:
  - Notion: read it through the working API-key path. If not reachable, offer to connect Notion.
  - Spreadsheet: check whether Google is connected. Offer to connect it if not, then read the sheet. Sharing or exporting is a fallback, not the default.
  - Asana, Airtable, Monday, or another tool: check for an existing connection and reuse it if present, otherwise offer to connect it. Fall back to export only if no connection path exists.
  - Only naming conventions: no source to connect. Say plainly the roster will come from Meta ad names alone, so cost and rights fields will be missing and the ROI page will not appear.
- If a roster source exists, ask: "Does that same source hold what you pay each creator, or is that somewhere else?" This decides whether the ROI page can be built. If no cost data exists anywhere, say the ROI page will be left out.
- Rights: ask "How do you handle usage rights: roughly the same for everyone, say all whitelisted, or does it vary by creator?" If the roster source already has a rights column, skip the open ask, say you will read rights from there, and just confirm the default.
- Record source type, connection state, whether cost data exists, and the rights default in `workspace.json.rosterSource`.

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

Seed these customer-owned records when missing, preserving existing contents on rerun. Use the exact `schemaVersion: 1` envelopes in `creator-data-contract.md`; never choose a different envelope or replace a collection with a bare array:

- `workspace.json`: `schemaVersion`, `workspaceId`, `workspaceName`, `status`, `defaultConversationLanguage`, `performanceMeasure`, `rosterSource`, `hiringLens`, `manualRefreshOnly`, `createdAt`, `updatedAt`, `setupOwner`
- `identities.json.identities[]`
- `relationships.json.relationships[]` (carries the simple per-creator rights object)
- `evidence-map.json.evidence[]`
- `recommendations.json.recommendations[]`
- `pending-review.json.items[]`
- `refresh-state.json`: one Meta source record
- `performance/`: empty directory, no snapshot files
- `audit.jsonl`: after the complete state tree exists and `workspace.json.status` is `active`, append one `workspace_setup` event if missing. A resumed setup repairs missing state first and never appends a duplicate completed-setup event.

Write or update `workspace.json` last. `status: active` is the completion marker, valid only after every other required file and the empty `performance/` directory exist. Use the current requester as `setupOwner` unless they name someone else.

## Output after setup

Confirm setup is ready for the workspace, state the chosen performance measure, name the roster source and whether the ROI page will be available, and say the next move is to build and confirm the roster.
