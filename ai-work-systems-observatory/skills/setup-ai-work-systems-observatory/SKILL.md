---
name: setup-ai-work-systems-observatory
description: Set up the portable AI Work Systems Observatory after package installation. Use when someone says "set up the Observatory", "activate AI Work Systems Observatory", "configure our AI operating review", or asks to create the private dashboard and governed workflow ledger. Installation alone never triggers this skill's reads or writes.
---

# Set up AI Work Systems Observatory

Set up a private, read-only operating review centered on meaningful workflows.

## Hard boundaries

- Installation staged capability only. It did not approve discovery, state creation, app creation, or routines.
- Do not read organization records until the requester approves a disclosed read plan.
- Do not create durable state, an app, or a routine until the requester approves the disclosed writes.
- Do not send external messages or modify provider records.
- Do not create a raw conversation browser.
- Do not rank people by activity, cost, messages, routines, apps, or inferred performance.
- Do not claim time saved, ROI, effectiveness, or business value without a validated baseline.
- Preserve unresolved identities and source gaps.
- Default to team-level aggregation.

## Step 1: Resolve the requester and access

Use the active per-turn identity and the organization's permissions rules. Before any write or side effect, read the active permissions source. If the requester cannot approve shared setup, explain the required approver and stop before discovery.

## Step 2: Compact setup intake

Ask one compact question that collects the few choices that materially change the system:

- The executive objective for the review.
- Which teams should appear and whether any authorized viewer may see confirmed person-level ownership.
- Which local sources are allowed for discovery: team members, conversations, routines, tasks, workflows, packages, apps, and indexed saved knowledge.
- Which sources or topics are excluded or sensitive.
- What the organization considers a meaningful workflow.
- Which outcome measures leadership cares about.
- Preferred review cadence.

Recommend team-level visibility, source minimization, and no person-level ranking.

## Step 3: Disclose the read-only discovery plan

Before discovery, show exactly what will be read. The default proposal is:

- Live team-member and account-link records for identity and access boundaries.
- Local routine, task, workflow, package, and app inventories.
- Bounded local conversation metadata and indexed saved-knowledge references only if the requester approved them.
- No message bodies by default. If qualitative workflow discovery genuinely needs message content, propose a bounded corpus search with explicit time, team, and source scope first.
- No third-party source unless it was explicitly approved and its connection is already available.

State that discovery is read-only and that no dashboard, ledger, or routine will be created in this stage. Ask for explicit approval.

## Step 4: Run discovery

After approval:

1. Run the deterministic collector without `--out` so it emits a preview instead of creating durable state.
2. Inspect source coverage and errors.
3. Use bounded qualitative retrieval only for approved sources and only when inventory evidence cannot identify a workflow's business job, owner, audience, or output.
4. Group records into candidate meaningful workflows. Inventory records are evidence, not automatic workflows.
5. Preserve ungrouped and unresolved records.
6. Assign maturity only when every minimum condition in the maturity rubric is satisfied.
7. Mark inferences with confidence and last-confirmed timestamps.

## Step 5: Present the proposed system

Show:

- Source coverage and exclusions.
- Candidate systems and workflows.
- Unresolved identities and owners.
- Proposed maturity with confidence.
- Missing success contracts and outcome evidence.
- Proposed private dashboard state.
- Optional routine plan.

Do not present activity as value. Use the required language when appropriate: "Delivered successfully. Usefulness not yet verified."

## Step 6: Disclose and approve writes

Before writing, list the exact changes:

1. Create private app `ai-work-systems-observatory` using the staged app template.
2. Create organization-specific `data/observatory.json`, `data/system-ledger.json`, and `data/setup.json` under that app.
3. Record no secrets in app state.
4. Optionally create only the routines the requester selects, with exact schedules, owner, delivery, and stop rules.

Make clear that the private Motion-auth default is recommended and reversible. Ask for explicit approval of the selected writes.

## Step 7: Create and verify

After approval:

1. Use the app-builder workflow to create the app with route `/ai-work-systems-observatory`.
2. Copy the staged template into the new app source, preserving the runtime-generated organization, workspace, conversation, and app identity fields.
3. Replace illustrative data with the approved organization-specific ledger and source-coverage state.
4. Validate the ledger.
5. Build and verify the app.
6. Confirm that OAuth protection is enabled unless the requester explicitly chose public access.
7. Create approved routines only after the app is verified.

For an admin-created routine, ask whether they want self-logging to a Slack channel. Treat it as an option, not a default. Any Slack delivery requires its own explicit confirmation before posting or testing.

## Optional routine proposals

Do not create these automatically:

- **Daily telemetry**: deterministic local inventory and execution-health refresh.
- **Weekly reconciliation**: agentic ownership, maturity, opportunity, and stale-inference review.
- **Monthly executive pulse**: summarize what changed, evidence of use or outcome, risks, and decisions required.

A routine's prompt must preserve approved sources, privacy boundaries, evidence rules, and dashboard destination. A later bare "refresh" reruns the established source scope unchanged.

## Completion

Hand back the verified private app and a short setup record: approved sources, exclusions, aggregation policy, owner, cadence, and routines created. Do not duplicate the dashboard content in chat.
