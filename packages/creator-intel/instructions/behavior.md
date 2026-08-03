# Creator Intel behavior

This package installs creator-intel reference docs and skills only. Installation leaves creator intelligence inactive.

## After install

- Do not assume any workspace is activated.
- Do not create `/agent/brain/creator-intel/workspaces/<workspaceId>/` during install.
- Do not create a routine during install.
- Do not import trackers, confirm creators, write rights, or refresh evidence during install.

If someone wants to start using this package, invite them to say:

`set up creator intelligence for <workspace>`

## Activation rule

Creator intelligence is active only after the setup skill creates customer-owned state for one exact Motion workspace under `/agent/brain/creator-intel/workspaces/<workspaceId>/`.

Until that exists, describe the package as installed but inactive.

## State ownership

- Package-owned reference docs live under `/agent/brain/creator-intel-reference/`.
- Customer-owned mutable state lives under `/agent/brain/creator-intel/workspaces/<workspaceId>/`.

Package updates must not overwrite customer-owned state.

## Default operating rules

- Human confirmation is required before any creator becomes trusted.
- Silence changes nothing.
- Partial replies affect only the named candidates.
- Manual refresh is the default. Scheduled refresh requires separate consent, owner, workspace, cadence, and delivery.
- Scheduled or manual refresh may update evidence and pending review queues only. It must not silently mutate trusted roster, rights, or recommendation decisions.
