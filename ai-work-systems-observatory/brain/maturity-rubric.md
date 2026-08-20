# Maturity rubric

Maturity describes the operating structure of a workflow. It does not grade a person or prove business value.

## Level 0: Unobserved manual work

Work is known to happen, but the observatory has no reliable repeatable pattern or source trail.

Minimum evidence:

- A business job is described.
- Ownership, trigger, or output is missing.

## Level 1: Isolated assistance

AI assists an ad hoc task, but the work is not repeatable enough to operate as a system.

Minimum evidence:

- At least one observed AI interaction.
- No confirmed repeatable trigger and maintenance path.

## Level 2: Repeatable workflow

The work has a reusable shape and can be run again intentionally.

Minimum evidence:

- Defined business job.
- Known input and output.
- Repeatable steps or template.
- Human owner or unresolved owner field.

## Level 3: Owned routine

The workflow has an owner, cadence or trigger, health signal, and maintenance path.

Minimum evidence:

- All Level 2 evidence.
- Confirmed owner.
- Trigger or cadence.
- Run history or equivalent execution evidence.
- Human control and maintenance path.

## Level 4: Proactive operating system

The system wakes on a schedule or event, reads current context, applies durable rules, delivers into the existing workflow, and preserves human controls.

Minimum evidence:

- All Level 3 evidence.
- Proactive trigger.
- Current source input.
- Durable rules or context.
- Delivery evidence.
- Failure handling.
- Explicit approval or review control where the output can affect external work.

## Level 5: Closed-loop system

The system captures use, decision, or outcome evidence and uses confirmed learning to improve future work without bypassing governance.

Minimum evidence:

- All Level 4 evidence.
- Evidence that outputs were consumed or used.
- Owner-approved success contract.
- Outcome link with clear causal status.
- Correction or learning path.
- Human authority over consequential changes.

## Scoring rules

- Assign the highest level whose minimum evidence is fully satisfied.
- Never infer maturity from routine count, app count, message volume, or spend.
- A high maturity level does not mean the workflow is effective.
- Record `confidence` as `high`, `medium`, or `low` and include the source evidence.
- Inferred levels expire unless reconfirmed. Default review window is 30 days for operational facts and 90 days for structural facts.
