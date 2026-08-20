# Observatory data model

## Primary object: Meaningful workflow

A meaningful workflow is a repeatable unit of work with a business job, identifiable input, intended output, human or system owner, and a control path. Conversations, routines, apps, tasks, and integrations are evidence about the workflow. They are not the workflow by themselves.

## Core entities

### Organization profile

- `organizationId`
- `organizationName`
- `executiveObjective`
- `visibilityPolicy`
- `allowedSources`
- `excludedSources`
- `configuredAt`
- `lastReviewedAt`

### Person

- `personId`
- `displayName`
- `teamId`
- `authorizedDetail`
- `identityStatus`: `resolved`, `unresolved`, or `conflicted`
- `identityEvidence`
- `lastConfirmedAt`

Names are not identity proof. Preserve unresolved and conflicted records without merging them.

### Team

- `teamId`
- `name`
- `leaderPersonId`
- `visibilityScope`

### Workstream

- `workstreamId`
- `name`
- `teamId`
- `businessJob`
- `decisionCadence`

### System

A system groups one or more meaningful workflows that share an operating job and maintenance path.

- `systemId`
- `name`
- `workstreamId`
- `ownerPersonId`
- `ownerTeamId`
- `maturityLevel`
- `health`
- `lastConfirmedAt`
- `maintenancePath`
- `confidence`

### Workflow

- `workflowId`
- `name`
- `systemId`
- `workstreamId`
- `ownerPersonId`
- `ownerTeamId`
- `audience`
- `businessJob`
- `trigger`
- `cadence`
- `inputs`
- `outputs`
- `controls`
- `latestRun`
- `health`
- `evidenceStage`
- `evidenceConfidence`
- `successContractId`
- `outcomeIds`
- `maintenancePath`
- `lastConfirmedAt`
- `inferenceNotes`

### Trigger

- `type`: `manual`, `schedule`, `event`, or `unknown`
- `description`
- `sourceId`
- `status`

### Input and provenance

- `inputId`
- `sourceFamily`
- `sourceName`
- `scopeDescription`
- `freshness`
- `lineage`
- `accessBoundary`
- `sensitiveDataHandling`
- `coverageStatus`

### Output and delivery

- `outputId`
- `type`
- `destination`
- `deliveredAt`
- `consumptionEvidence`
- `useEvidence`

### Control

- `controlId`
- `type`: `human_review`, `approval_gate`, `scope_guard`, `quality_check`, `stop_rule`, or `other`
- `ownerPersonId`
- `status`
- `lastExercisedAt`

### Run

- `runId`
- `workflowId`
- `startedAt`
- `finishedAt`
- `status`
- `failureReason`
- `deliveryEvidence`
- `consumptionEvidence`
- `useEvidence`
- `sourceRefs`

### Outcome

- `outcomeId`
- `workflowId`
- `type`
- `description`
- `observedAt`
- `source`
- `causalStatus`: `unlinked`, `correlated`, or `validated`
- `confidence`
- `ownerConfirmedAt`

### Manual baseline

- `baselineId`
- `workflowId`
- `measure`
- `unit`
- `beforeValue`
- `afterValue`
- `measurementWindow`
- `ownerApprovedAt`
- `source`

Time saved, capacity reclaimed, avoided hiring, tool replacement, or ROI claims require a valid manual baseline or an equivalent independently validated source.

### Source coverage

Every refresh records:

- `sourceId`
- `sourceType`
- `available`
- `readAt`
- `scope`
- `rowsObserved`
- `limitations`
- `error`

Missing sources remain visible. A missing source is not treated as zero activity, zero value, or a disconnected account without evidence.
