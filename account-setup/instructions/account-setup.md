# Account Setup

Use Account Setup for customer-owned setup that should be visible in Agent Brain and easy for a user to change.

## Purpose

Account Setup is the customer's visible setup layer. It is not hidden runtime config.

Use it for:

- brand context
- primary KPI and attribution settings
- spend thresholds
- naming conventions
- customer-specific source instructions
- integration setup notes that describe how this customer wants Runneth to use a connected source

## Main Folder

Account Setup lives under:

`/agent/brain/account-setup/`

Motion imports live under:

`/agent/brain/account-setup/motion-imports/`

Each setup file should clearly say what it applies to: organization, workspace, account, brand, market, data source, folder, or user scope.

## Motion Imports

Motion imports have two important sections:

- `Latest Import From Motion`: the most recent value pulled from Motion
- `Runneth Instructions`: customer-taught corrections and rules

Use the Motion accessors for ordinary reads:

- `motion brand-context --data-query "..."`
- `motion workspace-goal`
- `motion spend-threshold`

Use `--refresh-from-motion` only when the user asks to refresh, re-import, sync with Motion, or compare against the current Motion UI value.

Refreshing should update `Latest Import From Motion` and preserve `Runneth Instructions`.

## Conflict Rule

When `Latest Import From Motion` conflicts with `Runneth Instructions`, follow `Runneth Instructions` unless the user explicitly chooses the Motion value.

If the conflict matters to the answer, say it plainly:

`Motion currently says X, but your Runneth instructions say Y. I am using Y.`

If the user wants Motion itself changed, explain whether Runneth has a write path for that Motion setting. If not, save the Runneth-side instruction here and say that it does not change the Motion UI.

## Integration Source Guides

Keep the split simple:

- Integration capability docs describe what the tool can do.
- Account Setup source guides describe how this customer wants Runneth to use that tool.

Do not create integration setup files by default.

Create a source guide only when the customer connects that source or gives instructions for it.

Use clear names like:

- `integrations/ad-platform.md`
- `integrations/asset-library.md`
- `integrations/data-warehouse.md`

Each source guide should answer:

- What account, workspace, folder, table, or brand does this apply to?
- What should Runneth use this source for?
- What should Runneth avoid using it for?
- What customer-specific rules matter?
- What is still an open question?

## Updating Setup

When a user asks to save or change setup:

1. Resolve the scope first.
2. Read the existing Account Setup file.
3. Put customer rules in `Runneth Instructions`.
4. Preserve Motion import JSON unless the user asked to refresh from Motion.
5. Ask one short confirmation before overwriting a conflicting instruction.
6. Reread the file after editing and make sure any Motion import JSON block is still valid.
