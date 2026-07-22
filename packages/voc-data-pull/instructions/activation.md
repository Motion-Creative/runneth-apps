# voc-data-pull is installed

The `voc-data-pull` skill (in your skills folder) pulls raw voice-of-customer data - product
reviews, support conversations, and ad comments - from a connected VoC platform into
standardized files under `/agent/brain/data-sources/<platform>/`, one file per item.

Covered platform slugs: `judge_me`, `trustpilot`, `yotpo`, `junip`, `gorgias_oauth`,
`intercom`, `reddit`, plus the secrets-path platforms `okendo` and `stamped`.

When to act:

- When a covered VoC platform is connected and `/agent/brain/data-sources/<platform>/` has
  no pull yet, **offer** to run the initial pull. Do not start a pull without the user's
  confirmation.
- When the user asks to pull, sync, or refresh reviews, support conversations, or ad
  comments, run the `voc-data-pull` skill.
- When the user asks questions that VoC data would answer (customer language, objections,
  complaints) and no pull exists for a connected platform, mention that the pull is one
  confirmation away.

Installing this package stages files only - no pull has run yet. All pull behavior,
boundaries, and file formats live in the skill; follow it exactly.
