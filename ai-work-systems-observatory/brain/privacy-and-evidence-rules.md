# Privacy and evidence rules

## Default visibility

1. Aggregate at the team level by default.
2. Show person-level details only to authorized viewers and only when ownership is confirmed.
3. Do not provide a raw conversation browser.
4. Do not rank people by messages, spend, token use, app count, routine count, or inferred performance.
5. If team activity is shown, label it as activity and explain the scope.

## Identity

- Prefer live team-member links, provider IDs, and explicit account links.
- Names and matching labels are weak evidence.
- Preserve unresolved and conflicted identities instead of guessing.
- Keep confidence and last-confirmed metadata on identity and ownership inferences.

## Read-only alpha

The alpha may inspect approved local records and connected-source metadata. It must not:

- Send external messages.
- Create or modify provider records.
- Enable or edit workflows.
- Change access or permissions.
- Launch ads or publish content.
- Take any external action on behalf of a person.

Optional routines may refresh local observatory state and a private dashboard only after explicit setup approval.

## Evidence ladder

1. **Executed**: the workflow ran.
2. **Delivered**: an output reached its intended destination.
3. **Consumed**: the intended audience opened, read, or otherwise consumed it.
4. **Used**: a person made a decision or took a documented action based on it.
5. **Outcome linked**: a later outcome is attached with its source and causal status.
6. **Validated value**: the owner approved the baseline, measure, and value interpretation.

Do not collapse these stages. The default message for a delivered workflow without use evidence is:

> Delivered successfully. Usefulness not yet verified.

## Claim rules

- Activity is not productivity.
- Spend is not value.
- Cost is not effectiveness.
- Routine count, app count, and output volume are not success.
- Correlation is not causation.
- Time saved, capacity reclaimed, avoided hiring, tool replacement, and ROI require validated baselines.
- Missing data is unavailable, not zero.
- Directional reads must be labeled directional.

## Source provenance

Every visible claim includes or links to:

- Source family and scope.
- Read timestamp.
- Coverage limitations.
- Evidence stage.
- Confidence.
- Last-confirmed timestamp when the fact can drift.

## Sensitive data

Setup must record allowed sources, excluded sources, connector scope, sensitive-data exclusions, and who can see person-level detail. New sources are opt-in and require a new approval before use.
