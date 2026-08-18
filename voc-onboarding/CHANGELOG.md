# voc-onboarding changelog

## v1

Initial release, extracted from `meta-and-voc-onboarding` v6 so the Meta and VoC halves
of onboarding install and test independently.

- **Scope**: the VoC half only - the `voc-data-pull` skill (recipes and templates
  included), the manual `voc-audit` skill, a VoC-only post-install, and a VoC-only
  activation gate. No guards, no Meta account context, no walkthrough: those live in the
  separate `meta-onboarding` package, and neither package requires the other.
- **Own completion roster**: post-install records workspaces in a
  `runneth:voc-onboarded` block in `/agent/user.md`. The activation also honors the
  legacy `runneth:meta-voc-onboarded` roster from the combined package, so already
  onboarded VMs are never re-set-up and their existing `voc-sync-<workspace>-*` routines
  keep running untouched.
- **Completion requires a dedicated platform**: when Meta ad comments is the only
  reachable customer-voice source, the workspace is recorded in a `runneth:voc-partial`
  block instead of the onboarded roster. The install closes with a
  connect-an-integration message (the ask is the headline; ad comments a parenthetical),
  and the activation reminds once per conversation until a dedicated reviews, support,
  survey, community, or calls platform is connected - then setup resumes for that
  platform and the workspace graduates to `runneth:voc-onboarded`.
- **Self-contained audit offer**: the combined package's walkthrough delivered the
  customer-voice summary and audit offer when a Meta onboarding was open; VoC is now
  fully out of Meta onboarding, so the sync routine owns the offer outright. Once
  backfill coverage is reached, each daily run sends the offer if it is still owed -
  deferring (not handing off) while a Meta onboarding is mid-flight
  (`account-context.md` exists with interpretation fields unconfirmed), then sending on
  a later run once the context is confirmed. The `voc-audit-offer` changelog entry still
  guarantees at most one offer.
- Carries the v6 behavior of the combined package's VoC parts otherwise: pinned
  per-workspace accounts, workspace-named routines, 12-month bounded backfills,
  read-only pulls, unified record format, and the manual-only audit with the 200-entry
  gate.
