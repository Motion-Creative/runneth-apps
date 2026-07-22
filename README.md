# runneth-apps

The source registry for packages installed by Runneth.

This repository is migrating from the retired Use Case Library format to the
OS package format. The complete pre-migration library remains available on
[`archive/full-library`](https://github.com/Motion-Creative/runneth-apps/tree/archive/full-library)
and at the immutable `pre-cleanup-2026-07-21-with-aligned-onboarding` tag.

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

## Migrating an archived use case

Legacy Creative Strategy, Bootcamp, Permissions, and other use-case payloads
are available from the archive branch and snapshot tag. Reintroduce one to
`main` only after rebuilding it as a schema-v1 package; do not restore its
legacy directory directly.

## Aligned Onboarding compatibility

`aligned-onboarding/` remains on `main` with `corpus-search/` and
`building-integrations/`. These are a deliberate compatibility exception so
the recently merged onboarding flow keeps its source and referenced
dependencies while it is migrated to the package contract.

Validate its deterministic creative-corpus export with:

```bash
node --test aligned-onboarding/test/export-creative-corpus.test.mjs
```

## Library website

`use-case-library-site/` remains deployed as a rebuilding page. Its archived
catalog mode reads the immutable pre-cleanup tag and is available only for
local recovery and migration work. See its
[README](use-case-library-site/README.md) for build and deployment commands.
