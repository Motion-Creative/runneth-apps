# Creator Intel data contract

This file defines the durable customer-owned data model that setup creates later under `/agent/brain/creator-intel/workspaces/<workspaceId>/`.

The reference docs in this package are read-only defaults. Customer state lives outside package ownership from day one.

## Directory contract

```text
/agent/brain/creator-intel/workspaces/<workspaceId>/
  workspace.json
  identities.json
  relationships.json
  rights.json
  evidence-map.json
  pending-review.json
  recommendations.json
  refresh-state.json
  performance/
    meta-30d.json
    meta-90d.json
    meta-365d.json
    northbeam-30d.json
    northbeam-90d.json
    northbeam-365d.json
  audit.jsonl
```

## 1. Workspace record

`workspace.json` is one record per Motion workspace.

Required fields:

- `workspaceId`
- `workspaceName`
- `status`: `inactive | active`
- `defaultConversationLanguage`
- `performancePolicies`: source-specific comparison policy
- `manualRefreshOnly`: boolean
- `createdAt`
- `updatedAt`
- `setupOwner`

## 2. Identity ledger

`identities.json` stores stable creator identity decisions.

Required fields per creator:

- `creatorId`: stable local id
- `status`: `confirmed | pending | disqualified | unresolved`
- `displayName`
- `canonicalName`
- `currentHandles[]`
- `previousHandles[]`
- `aliases[]`
- `motionCreatorId`: nullable
- `motionSlug`: nullable
- `motionLink`: nullable
- `mergeParentId`: nullable
- `mergeHistory[]`
- `correctionHistory[]`
- `provenance[]`
- `createdAt`
- `updatedAt`
- `lastHumanDecisionAt`: nullable

New or removed upstream entries never mutate confirmed local identity decisions silently. The local confirmed ledger is authoritative for Runneth behavior.

## 3. Workspace relationship ledger

`relationships.json` stores workspace-specific relationship state separate from identity.

Required fields per relationship:

- `creatorId`
- `relationshipTypes[]`: any of `ugc`, `organic`, `paid-media`, `partnership`, `whitelisting`
- `hardEligibility[]`
- `disqualified`: boolean
- `disqualificationReason`: nullable
- `notes`
- `createdAt`
- `updatedAt`

A confirmed identity does not imply a confirmed relationship.

## 4. Rights ledger

`rights.json` stores rights as separate records, never as one vague yes or no field.

Required fields per rights record:

- `rightsId`
- `creatorId`
- `workspaceId`
- `advertiser`
- `platform`
- `usageType`: `new-commissioning | asset-reuse | paid-media | organic | partnership | whitelisting`
- `assetScope`
- `territory`
- `startDate`
- `expiryDate`
- `status`: `approved | expired | unknown | denied`
- `source`
- `updatedAt`

Unknown never means approved.

## 5. Evidence map

`evidence-map.json` is the explicit bridge from ad delivery evidence to creator evidence.

Required entities:

- `adId`
- `adName`
- `creativeAssetId`: nullable
- `creatorIds[]`
- `mappingStatus`: `exclusive | shared | unresolved | human-confirmed | naming-rule-inference`
- `source`
- `notes`
- `createdAt`
- `updatedAt`

Rules:

- Treat `ad -> ad name -> creative asset -> creator` as separate levels.
- Do not move ad-name rollup metrics to one creative when several assets attach.
- Do not credit full performance to every creator in a mashup or flexible ad.
- Include spend-bearing ads without synced Motion creative assets in eligible and unassigned accounting.

## 6. Performance snapshots

Each file in `performance/` stores one source and one window.

Required fields:

- `workspaceId`
- `source`: `meta | northbeam`
- `window`: `30d | 90d | 365d`
- `startDate`
- `endDate`
- `currency`
- `attribution`
- `filters`
- `grain`
- `metricDefinitions`
- `eligibleSpend`
- `exclusiveMappedSpend`
- `sharedSpend`
- `unassignedSpend`
- `coverage`
- `creatorRows[]`
- `createdAt`

Reconciliation invariant:

`exclusiveMappedSpend + sharedSpend + unassignedSpend = eligibleSpend`

Other rules:

- Keep Meta and Northbeam separate.
- Recalculate rates from totals. Never average ROAS, CTR, or CPA.
- Use 30, 90, and 365 day language only. Never call 365 days all-time.
- Creator performance claims require exclusive verified mapping and sufficient evidence.

## 7. Recommendation ledger

`recommendations.json` stores stable recommendation records.

Required fields per recommendation:

- `recommendationId`
- `workspaceId`
- `createdAt`
- `requestType`: `standalone-casting | brief-and-cast | roster-review`
- `recommendationMode`: `roster-reuse | new-sourcing | creatorless-production`
- `creatorIds[]`
- `hardEligibilityApplied[]`
- `evidenceWindow`
- `sourceSummary`
- `notes`
- `launchLinkId`: nullable
- `outcomeStatus`: `unknown | linked | measured`

Do not claim later ad outcomes were caused by a recommendation unless a launched ad or brief carries that exact stored recommendation id.

## 8. Pending review queue

`pending-review.json` stores unresolved human decisions.

Required fields per item:

- `candidateId`
- `workspaceId`
- `proposedCreatorId`: nullable
- `status`: `pending | confirmed | rejected | merged | unresolved`
- `evidence[]`
- `conflicts[]`
- `createdAt`
- `updatedAt`

Silence changes nothing. Partial answers affect only the named candidates.

## 9. Refresh state

`refresh-state.json` stores source-by-source freshness and partial failures.

Required fields:

- `sources[]` with `sourceName`, `lastSuccessAt`, `lastAttemptAt`, `status`, `errorSummary`, `coverage`
- `scheduledRefresh`: nullable object with `owner`, `cadence`, `delivery`, `approvedAt`
- `updatedAt`

Scheduled refresh is later-phase and off by default.

## 10. Record language

Durable records are English. User-facing output follows the conversation language.
