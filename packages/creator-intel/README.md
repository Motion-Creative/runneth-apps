# Creator Intel

Build a trusted creator roster, match the right people to each brief, and compare past creator performance without guessing.

Creator Intel gives a team one trusted place for each Motion workspace to:

- organize the creators they already trust
- review uncertain matches before they become part of the roster
- keep evidence fresh without silently changing approvals
- compare creator performance honestly, with source and coverage limits intact
- cast the right person for a concept, or say when no creator is the better move

## What the first run should feel like

After install, Creator Intel is available but still inactive.

On the first real use, Runneth should naturally:

1. ask which Motion workspace to set up
2. ask where the current roster lives
3. ask how the team wants creator performance judged

That setup flow asks one question at a time. It creates empty workspace state only. It does not import a roster, approve creators, or pull performance data.

## First version scope

- Activate one exact Motion workspace at a time.
- Keep package-owned reference docs separate from customer-owned workspace state.
- Recognize creators from explicit sources such as trackers, handle lists, and ad-name evidence.
- Require human confirmation before any creator becomes trusted.
- Refresh evidence manually unless the customer later asks for a scheduled workflow.
- Suggest creators in two tiers: confirmed roster first, credible ecosystem candidates second.
- Support an explicit combined brief-plus-casting workflow.

## Maintainer notes

### Install boundaries

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

### State boundaries

Package-owned reference docs install to:

- `/agent/brain/creator-intel-reference/`

Customer-owned mutable state is created later by setup at:

- `/agent/brain/creator-intel/workspaces/<workspaceId>/`

That separation is a hard requirement. Package install, update, reinstall, and uninstall must not overwrite customer decisions.

## Main jobs

1. **Set up Creator Intel**: activate one workspace and seed empty customer-owned state.
2. **Recognize creators**: turn explicit source material into pending identity proposals.
3. **Review creator identities**: apply human confirmation, correction, merge, and disqualification decisions.
4. **Update Creator Intel**: refresh evidence and pending queues only.
5. **Suggest creators**: answer standalone casting and creator-performance asks.
6. **Brief and cast**: run the explicit combined workflow when the customer asks for both.
