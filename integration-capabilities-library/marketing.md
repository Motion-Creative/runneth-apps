---
hero_headline: "Know exactly what every connected tool can and can't do."
hero_subhead: "Your Runneth keeps a permission-aware reference for every integration in your sandbox, built from the official docs the moment a tool is connected."
install_time: "~2 minutes"
requires: "Nothing"
status: "experimental"
---

## Super powers this unlocks

- Answers "can we do X with Y?" with a real source.
- Names the exact permission scope each call needs.
- Documents a new tool the moment it's connected.
- Refreshes any reference on request. Just ask.

## How it works

When a new tool is connected, your Runneth fetches the official API docs and writes a reference: what the tool can do, what scopes it needs, and where the docs say so. Answers cite that reference, and you can ask for a refresh any time a tool changes.

## A real example

Reza is scoping a new automation that depends on HubSpot deals. He asks his Runneth whether the current connection can move a deal between stages. The answer comes back yes, with the specific scope used, the API call name, and a link to the section in the reference. No detour into the HubSpot docs.
