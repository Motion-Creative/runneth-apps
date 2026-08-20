# Observatory app template

This is a staged view template, not a registered app.

The setup skill creates the app through the app lifecycle first, then copies this template without overwriting the generated `buildeth.app.json`. Organization, workspace, conversation, and app IDs are setup-time values and must never be copied from another organization.

The page runtime-loads `/ai-work-systems-observatory/data/observatory.json`, so ordinary data refreshes do not require an app rebuild. The included JSON is clearly marked illustrative and must be replaced before a live handoff.
