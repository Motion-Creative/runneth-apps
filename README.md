# runneth-apps

The source registry for packages installed by Runneth.

This repository is migrating from the retired Use Case Library format to the
OS package format. The complete pre-migration library remains available on
[`archive/full-library`](https://github.com/Motion-Creative/runneth-apps/tree/archive/full-library)
and at the immutable `pre-cleanup-2026-07-21` tag.

## Package contract

`package-index.json` is the package-manager registry. Each indexed source path
must contain a `runneth-package.json` schema-v1 manifest.

The validator enforces:

- kebab-case package IDs and semantic versions;
- matching metadata and policies in the index and manifest;
- GitHub sources from `Motion-Creative/runneth-apps` at `main`;
- existing, relative resource paths without symlinks; and
- supported targets under `agent_apps`, `agent_brain`, `agent_skills`, or
  `agent_tools`.

Run the contract tests with:

```bash
node --test scripts/validate-runneth-package-index.mjs
```

Changes to auto-updating packages require core engineering approval and the
`runneth-fleet-change-approved` pull-request label.

## Adding a package

1. Add the package payload and its `runneth-package.json`.
2. Add one matching entry to `package-index.json`.
3. Run the package contract tests.
4. Open a focused pull request for that package.

Package pull requests should be merged one at a time because they share the
central index.

## Migration candidates

`creative-strategy/`, `bootcamp/`, and `add-roles-permissions/` are retained
while their package shapes are finalized. They are not installable through the
new package index until they have schema-v1 manifests and index entries.

## Library website

`use-case-library-site/` remains deployed as a rebuilding page. Its archived
catalog mode reads the immutable pre-cleanup tag and is available only for
local recovery and migration work. See its
[README](use-case-library-site/README.md) for build and deployment commands.
