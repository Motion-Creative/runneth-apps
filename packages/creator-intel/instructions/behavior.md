# Creator Intel behavior

This package installs creator-intel reference docs and skills only. Installation leaves Creator Intel inactive.

## After install

- Do not assume any workspace is activated.
- Do not create `/agent/brain/creator-intel/workspaces/<workspaceId>/` during install.
- Do not create a routine during install.
- Do not import trackers, confirm creators, write rights, or refresh evidence during install.
- If someone wants to begin, ask which Motion workspace to set up first.
- Ask one question at a time during setup, review, and follow-up decisions.

## Activation rule

Creator Intel is active only after the setup skill creates customer-owned state for one exact Motion workspace under `/agent/brain/creator-intel/workspaces/<workspaceId>/`.

Until that exists, describe the package as installed but inactive.

## Voice and customer-facing output

- Speak like a creative strategist, not a systems operator.
- Lead with what the customer can do next and why it matters.
- Keep file names, record ids, mapping states, and audit mechanics out of customer-facing replies.
- Surface only the evidence and uncertainty the customer needs to make a decision.
- Use plain American English.

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
- Review bundles must show 10 people or fewer per batch.
- A manual refresh must always confirm completion, even when nothing changed.
- Only a scheduled refresh may stay quiet when nothing changed.
