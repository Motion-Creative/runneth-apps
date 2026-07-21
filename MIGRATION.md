# OS package migration

This repository is moving from the retired Use Case Library format to the
Runneth OS package format.

## Safety snapshot

The complete library immediately before this cleanup is preserved in two
places:

- browsable branch: `archive/full-library`
- immutable tag: `pre-cleanup-2026-07-21`

Restore a file or directory with:

```bash
git restore --source pre-cleanup-2026-07-21 -- <path>
```

The earlier `pre-cleanup-2026-07-09` tag remains unchanged.

## Main branch after cleanup

`main` contains:

- `package-index.json` and its schema-v1 validator;
- canonical package payloads as they are merged;
- the Runneth Library rebuilding-page site;
- scripts and GitHub workflows; and
- repository documentation.

Legacy use cases that have no active package migration are available only from
the archive branch and snapshot tag.

## Archived migration candidates

These legacy payloads are preserved in `archive/full-library` and at the
snapshot tag. They must return to `main` only as schema-v1 packages:

| Candidate | Current blocker |
|---|---|
| Creative Strategy | Reconcile the complete payload with the separate skills-only package |
| Bootcamp | Decide how its corpus maps to supported package resources and targets |
| Permissions | Complete the active rework and add a schema-v1 manifest |

They are not package-manager installable until a canonical package payload,
matching `runneth-package.json`, and `package-index.json` entry are merged.

## Package acceptance criteria

Every package pull request must:

1. add one package payload and schema-v1 `runneth-package.json`;
2. add a matching `package-index.json` entry;
3. reference only existing relative paths without symlinks;
4. target a supported root (`agent_apps`, `agent_brain`, `agent_skills`, or
   `agent_tools`);
5. pass `node --test scripts/validate-runneth-package-index.mjs`; and
6. receive core engineering approval and the
   `runneth-fleet-change-approved` label when it changes an auto-updating
   package.

Merge package pull requests sequentially because each one updates the central
index.

## Website

The library website remains deployed in rebuilding mode. Its archived catalog
mode reads `pre-cleanup-2026-07-21` for local migration work and is not the new
package discovery experience.
