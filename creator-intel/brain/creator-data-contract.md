# Creator Intel data contract

This file defines the durable customer-owned data model that setup creates under `/agent/brain/creator-intel/workspaces/<workspaceId>/`.

The reference docs in this package are read-only defaults. Customer state lives outside package ownership from day one.

## Directory contract

```text
/agent/brain/creator-intel/workspaces/<workspaceId>/
  workspace.json
  identities.json
  relationships.json
  evidence-map.json
  pending-review.json
  recommendations.json
  refresh-state.json
  performance/
  audit.jsonl
```

`performance/` starts empty. Refresh writes Meta snapshots on demand (`meta-30d.json`, `meta-60d.json`, `meta-90d.json`, or `meta-365d.json`). Do not pre-create snapshot files, and do not create a fixed Meta and Northbeam matrix. Northbeam is not part of the default model.

## Canonical file shapes and initial state

Every JSON file uses `schemaVersion: 1`. Collection files use the exact top-level collection key shown below; never replace an envelope with a bare array. Timestamps are ISO 8601 UTC strings. Setup writes these shapes only when the file is missing and preserves existing collection contents on every rerun. For a new setup, create the other required files and empty `performance/` directory before `workspace.json`; then persist `status: setup-in-progress` and the current phase so OAuth, connection, retry, and fresh-session handoffs resume safely. `status: active` with `setupPhase: complete` is the completion marker and is valid only after every required file exists.

`workspace.json` is one direct record:

```json
{
  "schemaVersion": 1,
  "workspaceId": "<workspaceId>",
  "workspaceName": "<workspaceName>",
  "status": "active",
  "setupPhase": "complete",
  "pendingAction": null,
  "defaultConversationLanguage": "<language>",
  "performanceMeasure": {
    "mode": "spend",
    "detail": null,
    "source": "default"
  },
  "rosterSource": {
    "type": "naming-conventions-only",
    "connectionRef": null,
    "hasRightsColumn": false,
    "rightsDefault": null,
    "adCreatorNamingConvention": null
  },
  "costSource": null,
  "recommendationSources": {
    "apify": {
      "connectionState": "not-connected",
      "secretKeyRef": null
    }
  },
  "hiringLens": {
    "dimensions": [],
    "groundedFrom": [],
    "gaps": []
  },
  "manualRefreshOnly": true,
  "createdAt": "<ISO-8601 UTC timestamp>",
  "updatedAt": "<same setup timestamp>",
  "setupOwner": "<person>"
}
```

`status` is `setup-in-progress | active`. `setupPhase` is `workspace | performance | sources | hiring-lens | complete`. `pendingAction` is null or a bounded object with `type`, `provider`, `resumePhase`, and `requestedAt`; it never contains a credential or provider response. A fresh session resumes from these fields.

`performanceMeasure.mode` is `spend` by default. If an Account Context doc from the Meta onboarding package exists, use its goal and set `source: account-context`; otherwise set `source: default`. Never enable Northbeam here.

A non-null connection reference has this shape:

```json
{
  "kind": "native | integration | secret",
  "provider": "<google | notion | asana | airtable | monday | apify | other>",
  "accountId": "<stable account id or null>",
  "accountLabel": "<human-readable label or null>",
  "resourceId": "<stable sheet/database/project id or null>",
  "secretKeyRef": "<stored secret key name or null>",
  "status": "connected | not-connected | export-only"
}
```

Native and integration references use account/resource identifiers and leave `secretKeyRef` null. Secret-backed references use a stable, workspace-specific `secretKeyRef` and never contain the secret value. `costSource` uses the same reference shape plus `costGrain` (`creator | campaign | program`). `recommendationSources.apify.secretKeyRef` may hold only the selected stored key name.

`hiringLens.dimensions` records how the team hires (for example `product`, `persona`, `campaign`, `theme`). `groundedFrom` records where each dimension was found (`ad-names`, `account-context`, `brand-context`, `review-audit`). `gaps` records dimensions that could not be grounded and need the person to supply them.

Initialize collection files exactly as follows:

```json
{"schemaVersion":1,"identities":[]}
{"schemaVersion":1,"relationships":[]}
{"schemaVersion":1,"evidence":[]}
{"schemaVersion":1,"recommendations":[]}
{"schemaVersion":1,"items":[]}
```

Those lines correspond, in order, to `identities.json`, `relationships.json`, `evidence-map.json`, `recommendations.json`, and `pending-review.json`.

Initialize `refresh-state.json` with one Meta source record:

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

`audit.jsonl` contains one compact JSON object per line. Setup appends one `workspace_setup` event only after the complete state tree exists and `workspace.json.status` is `active`. A resumed setup repairs missing state first and appends the event if it is missing; it never appends a second completed-setup event. Every later durable mutation appends another event with this exact envelope:

```json
{"schemaVersion":1,"eventId":"<stable event id>","workspaceId":"<workspaceId>","occurredAt":"<ISO-8601 UTC timestamp>","actor":"<person or system owner>","action":"<action>","entityType":"<workspace|identity|relationship|evidence|recommendation|refresh>","entityIds":[],"source":"<owning skill>","summary":"<short English summary>","changes":{}}
```

Audit events are append-only. `entityIds` contains every record changed by that event, and `changes` contains only bounded before/after fields; never copy full source documents or tool output into the audit log.

## 1. Workspace record

`workspace.json` is one record per Motion workspace. Required: `schemaVersion`, `workspaceId`, `workspaceName`, `status`, `setupPhase`, `pendingAction`, `defaultConversationLanguage`, `performanceMeasure`, `rosterSource`, `costSource`, `recommendationSources`, `hiringLens`, `manualRefreshOnly`, `createdAt`, `updatedAt`, `setupOwner`.

## 2. Identity ledger

`identities.json.identities[]` stores stable creator identity decisions. Required per creator:

- `creatorId`, `status` (`confirmed | pending | disqualified | unresolved`)
- `displayName`, `canonicalName`, `currentHandles[]`, `previousHandles[]`, `aliases[]`
- `motionCreatorId` (nullable), `motionLink` (nullable)
- `representation`: `{ "topics": [], "anglesCovered": [] }`, what this creator talks about and the messaging angles they can carry
- `mergeHistory[]`, `correctionHistory[]`, `provenance[]`
- `createdAt`, `updatedAt`, `lastHumanDecisionAt` (nullable)

`representation` is required for gap analysis. New or removed upstream entries never mutate confirmed local identity decisions silently. The local confirmed ledger is authoritative.

## 3. Relationship ledger (includes simple rights)

`relationships.json.relationships[]` stores workspace relationship state and the simplified rights object. Required per relationship:

- `creatorId`
- `relationshipTypes[]`: any of `ugc`, `organic`, `paid-media`, `partnership`, `whitelisting`
- `hardEligibility[]`
- `disqualified` (boolean), `disqualificationReason` (nullable)
- `rights`: `{ "usageScope": "none | some | all", "whitelisting": true|false, "expiryNote": null }`
- `notes`, `createdAt`, `updatedAt`

Rights are a simple per-creator field, not a separate ledger. A confirmed identity does not imply confirmed rights. Unknown usage scope never means approved for paid.

## 4. Evidence map

`evidence-map.json.evidence[]` bridges ad delivery evidence to creator evidence. Required: `adId`, `adName`, `creativeAssetId` (nullable), `creatorIds[]`, `mappingStatus` (`exclusive | shared | unresolved | human-confirmed | naming-rule-inference`), `source`, `notes`, `createdAt`, `updatedAt`.

Rules: treat `ad -> ad name -> creative asset -> creator` as separate levels; do not move ad-name rollup metrics onto one creative when several assets attach; do not credit full performance to every creator in a mashup or flexible ad; include spend-bearing ads without synced Motion creative assets in eligible and unassigned accounting.

## 5. Performance snapshots

Each file in `performance/` stores one source and one window, created on demand by refresh. Default source is Meta. Required: `schemaVersion`, `workspaceId`, `source` (`meta`), `window` (`30d | 60d | 90d | 365d`), `startDate`, `endDate`, `currency`, `attribution`, `filters`, `grain`, `metricDefinitions`, `eligibleSpend`, `exclusiveMappedSpend`, `sharedSpend`, `unassignedSpend`, `coverage`, `creatorRows[]`, `createdAt`.

For the 60-day window, `endDate` is yesterday and `startDate` is 59 calendar days earlier, inclusive. The Motion call uses explicit start/end dates; `last_60d` is not a supported preset.

Reconciliation invariant: `exclusiveMappedSpend + sharedSpend + unassignedSpend = eligibleSpend`. Recalculate rates from totals. Never average ROAS, CTR, or CPA. Creator performance claims require exclusive verified mapping and sufficient evidence.

## 6. Recommendation ledger

`recommendations.json.recommendations[]` stores stable recommendation records. Required: `recommendationId`, `workspaceId`, `createdAt`, `requestType` (`standalone-casting | roster-review`), `recommendationMode` (`roster-reuse | new-sourcing | creatorless-production`), `methods[]` (one or more of `a-motion-context | b-top-creator-similarity | c-reviews-gap`), `creatorIds[]`, `hardEligibilityApplied[]`, `evidenceWindow`, `sourceSummary`, `notes`, `launchLinkId` (nullable), `outcomeStatus` (`unknown | linked | measured`).

Do not claim later ad outcomes were caused by a recommendation unless a launched ad or brief carries that exact stored recommendation id.

## 7. Pending review queue

`pending-review.json.items[]` stores unresolved human decisions. Required: `candidateId`, `workspaceId`, `proposedCreatorId` (nullable), `status` (`pending | confirmed | rejected | merged | unresolved`), `evidence[]`, `conflicts[]`, `createdAt`, `updatedAt`. Silence changes nothing. Partial answers affect only the named candidates.

## 8. Refresh state

`refresh-state.json` stores source-by-source freshness and partial failures. Required: `schemaVersion`, `sources[]` with `sourceName`, `lastSuccessAt`, `lastAttemptAt`, `status`, `errorSummary`, `coverage`; `scheduledRefresh` (nullable object with `owner`, `cadence`, `delivery`, `approvedAt`); `updatedAt`. Scheduled refresh is off by default.

## 9. Record language

Durable records are English. User-facing output follows the conversation language.
