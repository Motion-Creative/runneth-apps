---
name: setup-creator-intelligence
description: Activate creator intelligence for one exact Motion workspace and create empty customer-owned state outside package ownership. Use only when someone explicitly says “set up creator intelligence for <workspace>” or clearly asks to activate one named workspace.
triggers:
  phrases:
    - set up creator intelligence for
    - activate creator intelligence for
  intent: Activate one exact workspace and seed empty customer-owned creator-intel state.
---

# Setup creator intelligence

This skill activates creator intelligence for **one exact Motion workspace**. It is the only skill that creates customer-owned mutable state, and it creates **empty state only**.

## Hard rules

- Resolve one exact Motion workspace and store its real `workspaceId`.
- Create state only at `/agent/brain/creator-intel/workspaces/<workspaceId>/`.
- Never write customer state inside `/agent/brain/creator-intel-reference/`.
- Setup is idempotent. Reruns update the same workspace record and must not create duplicate state or routines.
- Setup does not create a refresh routine by default.
- Setup never pulls creator data and never creates performance snapshots.
- `refresh-creator-corpus` exclusively owns data pulls and snapshot creation.

## What setup creates

Seed these customer-owned records when missing, preserving existing files when present:

- `workspace.json`: seed the required contract fields exactly as defined in `creator-data-contract.md`: `workspaceId`, `workspaceName`, `status`, `defaultConversationLanguage`, `performancePolicies`, `manualRefreshOnly`, `createdAt`, `updatedAt`, and `setupOwner`
- `workspace.json` initial values must use exact contract field names, including `status: active`, `manualRefreshOnly: true`, `defaultConversationLanguage` from the explicit setup choice or current conversation language, `performancePolicies` from the explicit source policy chosen during setup, and `setupOwner` from the person who owns future refresh decisions for that workspace
- `identities.json`: stable creator identities and merge history
- `relationships.json`: workspace relationship state, disqualifications, and hard eligibility rules
- `rights.json`: rights records by workspace, advertiser, platform, usage type, asset, territory, start, and expiry
- `evidence-map.json`: ad, ad-name, creative asset, and creator mapping ledger
- `performance/`: an empty directory only, with no `meta-30d.json`, `meta-90d.json`, `meta-365d.json`, `northbeam-30d.json`, `northbeam-90d.json`, or `northbeam-365d.json` files created during setup
- `recommendations.json`: stable recommendation records
- `pending-review.json`: human review queue
- `refresh-state.json`: per-source freshness and partial-failure state
- `audit.jsonl`: append-only setup, review, refresh, and merge history

## Questions setup must resolve

1. Which exact Motion workspace should be activated?
2. What explicit source should creator recognition start from first, for example tracker, handle list, or ad-name evidence?
3. Which explicit comparison policy should populate `performancePolicies`, for example Meta only, Northbeam only, or source-specific policies for both?
4. What hard eligibility rules should filter recommendations, for example genuine lived experience, required props, credentials, comedy, authority, vulnerability, or documentation?
5. Who owns future refresh decisions for this workspace and should be stored as `setupOwner`?

## Output after setup

- Confirm the workspace is now active.
- State where mutable records live.
- Say that trusted roster is still empty until review decisions are applied.
- Say that setup created empty state only and did not pull creator data or performance snapshots.
- Offer the next explicit step, usually recognition from a named source.
