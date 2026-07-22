# Connect My Stack

Guided integration onboarding for Runneth. A customer shares their website URL,
Runneth scans the live site, confirms the detected tools in plain language,
checks what is already connected, and walks them through connecting the rest one
at a time.

## Package contents

The schema-v1 package manifest installs two complete skill directories:

- `connect-my-stack`: the guided onboarding flow.
- `tech-stack-scanner`: the scanner instructions, detection engine, and signature
  library.

Installing each skill as a directory keeps the scanner's `lib/` files alongside
its `SKILL.md`, so the engine is available on every VM where the package is
installed.

## Installed paths

- `/agent/.agents/skills/connect-my-stack/`
- `/agent/.agents/skills/tech-stack-scanner/`

## Verification

After installation, confirm that the following engine files exist under
`/agent/.agents/skills/tech-stack-scanner/lib/`:

- `scan.js`
- `fetch-capture.mjs`
- `detect.mjs`
- `signatures.json`

## Customer-facing trigger

> Here's my website: [paste URL]. Scan it and tell me what tools I'm running.
> For anything that isn't already connected, help me connect it to Runneth.
