---
name: setup-creator-intelligence
description: Activate Creator Intel for one exact Motion workspace and create empty customer-owned state outside package ownership. Use when someone asks to set up their creator roster, organize their creators, build a creator roster, or activate Creator Intel for a workspace.
triggers:
  phrases:
    - set up creator intelligence for
    - activate creator intelligence for
    - set up my creator roster
    - help me organize our creators
    - build our creator roster
  intent: Activate one exact workspace and seed empty customer-owned creator-intel state.
---

# Setup Creator Intel

This skill activates Creator Intel for **one exact Motion workspace**. It is the only skill that creates customer-owned mutable state, and it creates **empty state only**.

## Hard rules

- Resolve one exact Motion workspace and store its real `workspaceId`.
- Create state only at `/agent/brain/creator-intel/workspaces/<workspaceId>/`.
- Never write customer state inside `/agent/brain/creator-intel-reference/`.
- Setup is idempotent. Reruns update the same workspace record and must not create duplicate state or routines.
- Treat `workspace.json.status: active` as the completion marker. Write or update `workspace.json` last, only after every required ledger, refresh-state file, audit file, and the empty `performance/` directory exist.
- Setup does not create a refresh routine by default.
- Setup never pulls creator data and never creates performance snapshots.
- `refresh-creator-corpus` exclusively owns data pulls and snapshot creation.
- Ask one setup question at a time.
- Use the current requester as `setupOwner` unless they explicitly name someone else.
- Standing eligibility rules are optional during setup. If they are not given here, defer them until the first real brief or casting ask.

## What setup creates

Seed these customer-owned records when missing, preserving existing files and
collection contents when present. Use the exact `schemaVersion: 1` envelopes and
initial JSON values in `creator-data-contract.md`; never choose a different envelope
or replace a collection with a bare array:

- `workspace.json`: seed the required contract fields exactly as defined in `creator-data-contract.md`: `schemaVersion`, `workspaceId`, `workspaceName`, `status`, `defaultConversationLanguage`, `performancePolicies`, `manualRefreshOnly`, `createdAt`, `updatedAt`, and `setupOwner`
- `workspace.json` initial values must use exact contract field names, including `status: active`, `manualRefreshOnly: true`, `defaultConversationLanguage` from the explicit setup choice or current conversation language, `performancePolicies` from the explicit source policy chosen during setup, and `setupOwner` from the person who owns future refresh decisions for that workspace
- `identities.json.identities[]`: stable creator identities and merge history
- `relationships.json.relationships[]`: workspace relationship state, disqualifications, and hard eligibility rules
- `rights.json.rights[]`: rights records by workspace, advertiser, platform, usage type, asset, territory, start, and expiry
- `evidence-map.json.evidence[]`: ad, ad-name, creative asset, and creator mapping ledger
- `performance/`: an empty directory only, with no `meta-30d.json`, `meta-90d.json`, `meta-365d.json`, `northbeam-30d.json`, `northbeam-90d.json`, or `northbeam-365d.json` files created during setup
- `recommendations.json.recommendations[]`: stable recommendation records
- `pending-review.json.items[]`: human review queue
- `refresh-state.json`: per-source freshness and partial-failure state
- `audit.jsonl`: after every required state file exists and `workspace.json.status` is `active`, append one canonical `workspace_setup` event if it is missing; a resumed setup repairs missing state first and never appends a duplicate completed-setup event

## Question order

Ask these in order, one at a time:

1. Which exact Motion workspace should I set up?
2. Where does your current creator roster live first, for example a tracker, handle list, or another source?
3. How should I judge creator performance for this workspace, for example Meta only, Northbeam only, or separate views for both?

Optional only if useful during setup:

4. Are there any standing must-have creator rules I should remember for later, such as lived experience, required props, credentials, comedy, authority, vulnerability, or documentation?

## Output after setup

Start the visible completion with:

> Creator Intel is ready for [workspace]. Nothing has been imported or approved yet, and I have not pulled performance data. Next, send me your current roster or point me to where it lives.

Then confirm the selected performance view and that the current requester owns future roster decisions unless they named someone else.
