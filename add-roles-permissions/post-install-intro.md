# Add roles and permissions

## What just opened up
Your sandbox now has identity-verified permissions in PERMISSIVE mode by default. Every message resolves to a specific person via Slack ID or motionapp.com email, and every durable write under `/agent/brain/` carries `author: @<handle>` so you always know who wrote what. Nobody is confined to a personal folder yet — anyone resolved can contribute anywhere except another person's home base.

When you are ready to lock things down (multi-brand agency, sensitive content, regulated work), say "upgrade permissions to strict" and the skill will walk you through the interview to set up member confinement, locked paths, and per-space writer maps.

## Try this now
1. **Add an admin**: `Make [name with Slack ID or @motionapp.com email] an admin.`
   _You will get back:_ that person's identity resolved across both platforms, added to the admin list, and a confirmation of what they can now do.
2. **Check your own scope**: `What's my scope and home base in this sandbox?`
   _You will get back:_ your handle, scope (admin or member), home base path, and which platforms are mapped to you.
3. **See everyone with access**: `Show me everyone with access to this sandbox and their scope.`
   _You will get back:_ the full list of resolved identities, their scopes, when each was provisioned, and any pending unresolved IDs.
4. **Upgrade to strict when ready**: `Upgrade permissions to strict.`
   _You will get back:_ the educational walkthrough, then the interview to define org shape, per-space writer maps, and locked-path extras.

## Compounds with
- **team-member-memory:** Memory profiles attach to the resolved identity from this layer. Both packages use the same `organization-map.json`.
