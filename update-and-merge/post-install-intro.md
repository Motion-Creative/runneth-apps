# Update and merge

## What just opened up
When an installed use case has a new version upstream, Runneth now decides what to apply automatically and what needs your eyes. Clean changes get merged silently. Anything you customized locally gets surfaced in a consolidated plan you can review and resolve in chat. No more silent overwrites of org-specific tweaks.

## Try this now
1. **Check what's currently pending**: `Are any of my installed use cases out of date?`
   _You'll get back:_ a list of installed use cases with available upstream updates, or confirmation that everything is current.
2. **Trigger a merge scan on one use case**: `Run an update scan on competitor-intel.`
   _You'll get back:_ either a clean apply ("nothing was customized, applied cleanly") or a plan file showing each file diff and asking how to resolve.
3. **Resolve a pending plan in plain language**: `On that plan, apply upstream for everything except keep my version of the Slack channel ID.`
   _You'll get back:_ Runneth parses the resolution, applies it per file, and confirms each merge.

## Compounds with
- **add-roles-permissions:** Only admins can trigger merges that touch org-level files; the permissions layer enforces it.
