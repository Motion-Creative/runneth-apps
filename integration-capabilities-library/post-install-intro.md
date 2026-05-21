# Integration capabilities library

## What just opened up
Runneth always has an accurate, sourced reference for what every connected integration can do and what permissions it needs. When someone asks what Slack can post, what GitHub scopes are needed, or whether Notion supports file uploads, the answer comes from a live document, not from memory. New integrations get a capabilities file created automatically. Every night, all files re-check against the official docs and patch what changed.

## Try this now
1. **Ask about a connected integration's capabilities**: `What can my Slack integration actually do right now? What scopes does it have?`
   _You'll get back:_ a sourced answer pulled from the current capabilities-and-scopes file, with the official doc URL inline.
2. **Trigger a manual sync on one integration**: `Sync the capabilities file for GitHub.`
   _You'll get back:_ the file re-fetched against the latest docs, diffed against your existing version, patched, and a one-line summary of what changed.
3. **See what's in the library**: `What integrations does Runneth have capability files for?`
   _You'll get back:_ the index, when each was last reviewed, and any that need attention.

## Compounds with
- **building-integrations:** The deep-dive flow writes new capability files into this library; the library keeps them fresh.
- **runneth-health-alerts:** If a sync fails or scopes get revoked, health alerts catch it.
