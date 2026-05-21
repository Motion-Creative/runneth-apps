# Add roles and permissions

## What just opened up
This sandbox now has identity-verified permissions. Every message resolves to a specific person via Slack ID or motionapp.com email, and that person has an admin or team scope that controls what they can change. Admins can edit org-level paths and standing instructions; team members get their own home base and write only there. Prompt-injection attacks that try to talk Runneth into a different scope get rejected at the kernel.

## Try this now
1. **Add an admin**: `Make [name with Slack ID or @motionapp.com email] an admin.`
   _You'll get back:_ that person's identity resolved across both platforms, added to the admin list, and a confirmation of what they can now do.
2. **Check your own scope**: `What's my scope and home base in this sandbox?`
   _You'll get back:_ your handle, scope (admin or team), home base path, and which platforms are mapped to you.
3. **See the full permissions state**: `Show me everyone with access to this sandbox and their scope.`
   _You'll get back:_ the full list of resolved identities, their scopes, when each was provisioned, and any pending unresolved IDs.

## Compounds with
- **team-member-memory:** Memory profiles attach to the resolved identity from this layer, so adapting-to-people only works once permissions are set.
- **import-from-ai:** Imports write to each user's permissions home base; identity has to resolve first.
