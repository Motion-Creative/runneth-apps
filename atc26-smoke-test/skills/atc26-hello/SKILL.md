---
name: atc26-hello
description: Run the AI Training Camp 26 package smoke test. Use when the user says "run the atc26 smoke test" or asks to verify the installed ATC26 marker.
user-invocable: true
---

# ATC26 hello

Read `/agent/brain/atc26/smoke-marker.md`. Find the first token shaped like
`ATC26_SMOKE_V<number>` and reply with that exact token only.

Do not guess, cache, or infer the version. If the marker cannot be read or does
not contain a valid token, report the missing or invalid marker instead.
