# voc-data-pull is installed

The `voc-data-pull` skill (in your skills folder) pulls raw voice-of-customer data - product
reviews, support conversations, community posts, and ad comments - from connected VoC
platforms into standardized files under `/agent/brain/data-sources/voc/<platform>/`, one
file per item. Installing this package staged files only - no pull has run yet.

Covered platform slugs: `judge_me`, `trustpilot`, `yotpo`, `junip`, `gorgias_oauth`,
`intercom`, `reddit`, plus the secrets-path platforms `okendo` and `stamped`.

**Setup is manually triggered - do nothing unprompted.** When asked to set up the VoC data
sync (directly, or as part of an onboarding run), run the skill's **"Set up the recurring
sync"** procedure for each connected covered platform. It creates the daily sync routine,
kicks the first run in the background, and owns every rule (routine command, Junip gate,
never pulling inside the user's conversation). Follow it exactly. Do not create routines or
start pulls just because a platform is connected.
