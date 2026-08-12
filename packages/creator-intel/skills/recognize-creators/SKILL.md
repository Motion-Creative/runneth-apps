---
name: recognize-creators
description: Turn explicit source material into pending creator identity proposals for one already-activated workspace. Use when someone wants to build the roster from a tracker, handle list, creator roster, ad names, or another explicit source.
triggers:
  phrases:
    - recognize creators from
    - review this creator tracker
    - scan these ad names for creators
    - import this creator roster
    - build the roster from
  intent: Propose creator identities from explicit source material without trusting them automatically.
---

# Recognize creators

This skill helps build the roster from **explicit source material**. It does not activate a workspace and it does not apply trust decisions.

## Hard rules

- Require existing workspace activation at `/agent/brain/creator-intel/workspaces/<workspaceId>/`.
- Require an explicit source, such as a tracker, handle list, creator roster, ad-name evidence, or named workspace artifact.
- New or removed upstream entries never silently mutate confirmed local decisions.
- Every new proposal enters `pending-review.json.items[]` with a stable `candidateId` and evidence trail.
- Every proposal batch appends one canonical `identity_proposals_created` event to `audit.jsonl` with all new `candidateId` values in `entityIds`.
- A valid creator without a Motion profile stays usable as unresolved. Do not drop them for missing Motion enrichment.
- Show 10 people or fewer per visible batch.

## How to build proposals

1. Read the explicit source and normalize candidate names, current handles, previous handles, and provenance.
2. When workspace ad evidence is needed, use `motion meta ads --grain ads --include-associated-objects` with the stored workspace id. Treat ad rows, ad names, associated creative assets, and ads without synced Motion creative assets as evidence only.
3. When resolving a creator profile, use `motion inspo creators` for exact name or handle resolution.
4. If a broad creator search hits the known schema issue, say the search failed and fall back to supported category, follower, or exact name or handle pulls. Do not treat a tool error as an empty result.
5. Keep identity, relationship, rights, evidence, and recommendation state separate.
6. Persist the new proposals to `pending-review.json.items[]`, preserving existing items, then append the canonical audit event before showing the review bundle.

## Proposal record requirements

Every proposal must include:

- `candidateId`
- normalized display name
- current handles and previous handles
- possible Motion creator id and Motion link when resolved
- evidence sources and timestamps
- mapping status, such as `human-confirmed`, `exclusive`, `shared`, `unresolved`, or `naming-rule-inference`
- ambiguity notes, for example same first name, editor-looking token, unknown handle, or duplicate profile candidates

## Visible review bundle

The customer-facing review bundle must:

- summarize total counts up front
- show the people before asking for approval
- group visible people into these sections only: **Ready to confirm**, **Needs your input**, **Could not match**, **Conflicts**
- show, for each visible person: name, handle, matched profile when available, source, and the exact uncertainty
- keep each batch to 10 people or fewer

End the visible bundle with exactly:

> Confirm the clear matches, or correct anyone by name. Anything you do not mention will stay pending.
