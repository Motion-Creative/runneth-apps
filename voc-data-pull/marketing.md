---
hero_headline: "Every review, support ticket, and ad comment - filed and ready to use."
hero_subhead: "Connect your VoC platform once. The raw customer voice lands in your brain as clean, consistent files."
install_time: "Installs automatically when a VoC platform connects"
requires: "A connected reviews or support platform (or a stored API key for Okendo/Stamped)"
---

## Super powers this unlocks

- One file per review, support conversation, or ad comment - metadata header plus the full text.
- The same flat metadata shape across every platform, so downstream packages never care where the data came from.
- Covers reviews (Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped), support (Gorgias, Intercom), and Meta ad comments.
- Bounded, read-only pulls with the untouched platform payload preserved in every file.

## How it works

When a voice-of-customer platform connects, this package installs into the org's Runneth
automatically. Prompted to pull, Runneth follows the platform's recipe - discovery step,
pagination, date bounds - and writes one standardized file per item under
`data-sources/<platform>/` in the org brain. Creative strategy packages read those files
directly.

## A real example

An org connects Gorgias. Runneth pulls the last year of tickets - one file each, with
status, channel, tags, and the org's own custom fields in the header and the full
conversation below. A week later the strategist asks "what do customers complain about
after their first order?" and Runneth answers from real tickets, quoting real customers.
