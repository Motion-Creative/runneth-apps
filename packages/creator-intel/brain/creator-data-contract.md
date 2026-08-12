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

## Canonical file shapes and initial state

Every JSON file uses `schemaVersion: 1`. Collection files use the exact top-level
collection key shown below; never replace an envelope with a bare array. Timestamps
are ISO 8601 UTC strings. Setup writes these shapes only when the file is missing and
preserves existing collection contents on every rerun. Setup writes `workspace.json`
last: `status: active` is the completion marker and is valid only after every other
required file and the empty `performance/` directory exist.

`workspace.json` is one direct record:

```json
{
  "schemaVersion": 1,
  "workspaceId": "<workspaceId>",
  "workspaceName": "<workspaceName>",
  "status": "active",
  "defaultConversationLanguage": "<language>",
  "performancePolicies": {
    "enabledSources": ["meta"],
    "comparisonMode": "single-source"
  },
  "manualRefreshOnly": true,
  "createdAt": "<ISO-8601 UTC timestamp>",
  "updatedAt": "<same setup timestamp>",
  "setupOwner": "<person>"
}
```

`performancePolicies.enabledSources` contains `meta`, `northbeam`, or both. Use
`comparisonMode: single-source` when one source is enabled and `separate` when both
are enabled. Never blend the two sources.

Initialize collection files exactly as follows:

```json
{"schemaVersion":1,"identities":[]}
{"schemaVersion":1,"relationships":[]}
{"schemaVersion":1,"rights":[]}
{"schemaVersion":1,"evidence":[]}
{"schemaVersion":1,"recommendations":[]}
{"schemaVersion":1,"items":[]}
```

Those lines correspond, in order, to `identities.json`, `relationships.json`,
`rights.json`, `evidence-map.json`, `recommendations.json`, and
`pending-review.json`.

Initialize `refresh-state.json` with one source record per enabled source:

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "sourceName": "meta",
      "lastSuccessAt": null,
      "lastAttemptAt": null,
      "status": "never-run",
      "errorSummary": null,
      "coverage": null
    }
  ],
  "scheduledRefresh": null,
  "updatedAt": "<ISO-8601 UTC setup timestamp>"
}
```

Create `performance/` as an empty directory. Do not create placeholder snapshot
files.

`audit.jsonl` contains one compact JSON object per line. Setup appends one
`workspace_setup` event only after the complete state tree exists and
`workspace.json.status` is `active`. A resumed setup repairs missing state first and
appends the event if it is missing; it never appends a second completed-setup event.
Every later durable mutation appends another event with this exact envelope:

```json
{"schemaVersion":1,"eventId":"<stable event id>","workspaceId":"<workspaceId>","occurredAt":"<ISO-8601 UTC timestamp>","actor":"<person or system owner>","action":"<action>","entityType":"<workspace|identity|relationship|rights|evidence|recommendation|refresh>","entityIds":[],"source":"<owning skill>","summary":"<short English summary>","changes":{}}
```

Audit events are append-only. `entityIds` contains every record changed by that
event, and `changes` contains only bounded before/after fields needed to understand
the mutation; never copy full source documents or tool output into the audit log.

## 1. Workspace record

`workspace.json` is one record per Motion workspace.

Required fields:

- `schemaVersion`: `1`
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

`identities.json.identities[]` stores stable creator identity decisions.

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

`relationships.json.relationships[]` stores workspace-specific relationship state separate from identity.

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

`rights.json.rights[]` stores rights as separate records, never as one vague yes or no field.

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

`evidence-map.json.evidence[]` is the explicit bridge from ad delivery evidence to creator evidence.

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

- `schemaVersion`: `1`
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

`recommendations.json.recommendations[]` stores stable recommendation records.

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

`pending-review.json.items[]` stores unresolved human decisions.

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

- `schemaVersion`: `1`
- `sources[]` with `sourceName`, `lastSuccessAt`, `lastAttemptAt`, `status`, `errorSummary`, `coverage`
- `scheduledRefresh`: nullable object with `owner`, `cadence`, `delivery`, `approvedAt`
- `updatedAt`

Scheduled refresh is later-phase and off by default.

## 10. Record language

Durable records are English. User-facing output follows the conversation language.
