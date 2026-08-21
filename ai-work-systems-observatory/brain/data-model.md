# Observatory data model

## Model boundary

The Observatory stores observed state separately from proposed state. Facts, inferences, unknowns, and recommendations are typed and rendered separately. Inventory is evidence, not proof of a working system.

## Document 1: observed-state ledger

`system-ledger.json` uses `schemaVersion: 2` and `documentType: observed-state-ledger`.

### Required top-level records

- `meta`: organization, mode, scope, generation time, last confirmation, and interpretation boundary.
- `sourceCoverage`: every approved source, read time, availability, row count, and limitation.
- `evidence`: auditable evidence references with source, kind, observed time, summary, reference, and confidence.
- `observedState`: roles, rhythms, handoffs, decisions, approvals, outputs, manual friction, current systems, recurring mechanisms, available capabilities, delivered assets, and incomplete setup.
- `adoptionDefinition`: one named population, rule, numerator, denominator, and evidence list.
- `limitations` and `unknowns`: missing coverage and focused follow-ups.

### Lifecycle classifications

- `available-capability`: installed package, skill, integration, or reusable capability. Availability does not prove setup or use.
- `incomplete-setup`: onboarding or configuration that has not reached a usable loop.
- `delivered-asset`: one-time app, report, brief, or artifact. Delivery does not prove consumption.
- `recurring-mechanism`: routine, task, or workflow record that appears repeatable but has not passed system qualification.
- `current-operating-system`: an end-to-end recurring loop that passes every qualification gate.

### Current operating-system qualification

A current system must include:

1. A business job and stable identifier.
2. `owner.status: confirmed` plus direct confirmation evidence.
3. A real schedule, event, or condition trigger with cadence or condition evidence.
4. Identifiable inputs and an output with audience and destination.
5. `consumption.status: observed` plus evidence that the output was reviewed, approved, acted on, or repeatedly used.
6. Run-history-based health with an explicit assessment window and evidence references.
7. A human-control or approval path.
8. Confidence, last-confirmed time, and evidence references.

If any gate is missing, keep the record in `recurringMechanisms` with `qualificationGaps`. Never promote it by inference.

### Adoption definition

Organization-level adoption is **qualified-system consumption coverage**: the number of qualified current systems with observed repeat consumption divided by all qualified current systems in scope. Show the rule, population, numerator, denominator, and evidence. Conversation participation, ownership coverage, or record volume may be supporting context, but they are not system adoption.

## Document 2: proposed operating model

`operating-model.json` uses `documentType: proposed-operating-model`. It contains the strategist thesis, synthesis answers, three to five proposed systems, role changes, weekly cadence, opportunity portfolio, and phased build sequence. Every proposed system is labeled `proposed` and points back to observed evidence or an explicitly stated hypothesis.

## Document 3: executive report

`observatory.json` uses `documentType: executive-operating-report`. It is the report-ready view over the two durable documents. Its chapters and regression answers are defined in `executive-report-contract.md`.

## Value claims

Never publish ROI, time saved, avoided hiring, reclaimed capacity, or business impact unless the claim includes either an owner-approved manual baseline or an independently validated outcome source, including evidence references, scope, and measurement window.
