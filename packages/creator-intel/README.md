# Creator Intel

Creator Intel gives a customer one workspace-scoped place to recognize trusted creators, review uncertain identities, refresh evidence, and make roster-first casting decisions.

This draft package was prepared for Vamsi's creator-intel build review.

## First version scope

- Activate one exact Motion workspace at a time.
- Keep package-owned reference docs separate from customer-owned workspace state.
- Recognize creators from explicit sources such as trackers, handle lists, and ad-name evidence.
- Require human confirmation before any creator becomes trusted.
- Refresh evidence manually unless the customer later asks for a scheduled workflow.
- Suggest creators in two tiers: confirmed roster first, credible ecosystem candidates second.
- Support an explicit combined brief-plus-casting workflow.

## What install does

Install stages only these package-owned files:

- one behavior instruction
- creator-intel skills
- creator-intel reference docs

Install does **not**:

- activate any workspace
- create `/agent/brain/creator-intel/workspaces/<workspaceId>/`
- create a routine
- import a tracker
- refresh evidence
- change trusted roster or rights state

## How activation starts

After install, Runneth should invite the customer to say:

`set up creator intelligence for <workspace>`

Setup is the first point that may create customer-owned state, and it must do so only for the named Motion workspace.

## Durable storage model

Package-owned reference docs install to:

- `/agent/brain/creator-intel-reference/`

Customer-owned mutable state is created later by setup at:

- `/agent/brain/creator-intel/workspaces/<workspaceId>/`

That separation is hard requirement. Package install, update, reinstall, and uninstall must not overwrite customer decisions.

## Main jobs

1. **Set up creator intelligence**: activate one workspace and seed empty customer-owned state.
2. **Recognize creators**: turn explicit source material into pending identity proposals.
3. **Review creator identities**: apply human confirmation, correction, merge, and disqualification decisions.
4. **Refresh creator evidence**: update evidence and pending queues only.
5. **Suggest creators**: answer standalone casting and creator-performance asks.
6. **Brief and cast**: run the explicit combined workflow when the customer asks for both.
