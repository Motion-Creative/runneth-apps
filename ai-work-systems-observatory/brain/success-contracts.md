# Success contracts

A success contract is owner-approved. The observatory does not define good work globally.

## Required fields

- `contractId`
- `workflowId`
- `ownerPersonId`
- `approvedAt`
- `decisionJob`
- `deliveryDeadline`
- `freshnessRequirement`
- `requiredSources`
- `evidenceRequirements`
- `humanReviewRequirement`
- `acceptanceStates`: `accept`, `change`, and `reject`
- `outcomeMeasure`
- `baselineId`
- `reviewCadence`
- `version`

## Example: Weekly creative performance review

The review succeeds only when:

- It covers the correct account and time period.
- Inputs meet the agreed freshness requirement.
- Claims cite evidence.
- Weak evidence is labeled directional.
- Delivery happens before the decision meeting.
- Uncertainty is visible.
- The owner reviews the output.
- A decision is recorded.
- The owner marks the output accept, change, or reject.
- Later outcomes are attached without unsupported causal claims.

This example is a reusable shape, not a universal standard. Every organization adapts it with the workflow owner.
