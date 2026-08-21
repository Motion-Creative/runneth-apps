# Package Readiness

Package Readiness evaluates explicit, package-owned readiness contracts on one
Runneth VM. It does not infer readiness for every installed package. A package
opts in by installing a contract at:

```text
/agent/tools/package-readiness/contracts/<package-id>.json
```

Packages without a contract are ignored and do not receive a readiness label.

## State boundary

The package manifest and readiness contract are immutable desired state. The
checker produces an observed-state snapshot; it never edits a package manifest
or writes into `/agent/.runtime`. Agentd will own persistence and relay delivery
when the corresponding agent-builder support is deployed.

The snapshot contains only package, stage, check, and workspace identity fields.
It never includes matched file paths, file contents, assertion values, account
data, metrics, or secrets.

## Checker interface

The apps-first interface is deliberately file based so the contract can be
tested before agent-builder integration:

```bash
/agent/tools/package-readiness/check.mjs \
  --agent-root /agent \
  --contracts-dir /agent/tools/package-readiness/contracts \
  --workspaces /path/to/workspaces.json \
  --output -
```

The workspace inventory has this shape:

```json
{
  "schemaVersion": 1,
  "workspaces": [
    { "id": "workspace-id", "name": "Workspace name", "slug": "workspace-name" }
  ]
}
```

Agent-builder will obtain this inventory from the VM's existing workspace API,
run this evaluator, bind the result to current package versions/resource
digests, persist it, and add it to the existing package-state relay.

## Contract model

Contracts are schema version 1 and declare:

- `scope`: `workspace` or `vm`;
- an ordered list of stages;
- the stage at which the package is ready;
- ordered Markdown fenced-YAML checks; and
- safe sources: a bounded agent-root glob, a previously matched file, or a
  sibling of a previously matched file.

Stages are cumulative. Reaching a later stage requires every check required by
that stage and all preceding stages. Contracts cannot execute shell commands,
make network calls, or provide regular expressions.

The installed JSON Schema is
`/agent/tools/package-readiness/readiness-contract.schema.json`.

## Development

Run the package tests and repository package-index validation:

```bash
node --test package-readiness/tests/package-readiness.test.mjs
node --test scripts/validate-runneth-package-index.mjs
```
