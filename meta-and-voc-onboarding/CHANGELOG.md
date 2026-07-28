# Meta and Voice of Customer Onboarding changelog

Repo-side maintainer history. Never staged to customer brains. Versions are simple
integers (`1`, `2`, ...) and bump once per package update - one version per merged
change to the package, not per commit. Entries are newest-first.

## 1 - 2026-07-27

The package as it ships:

- Schema-v1 `package.json` manifest, indexed in the repo root `package-index.json`
  with a raw `github` source. Manual install: one explicit `package install` call
  of the GitHub source. `installPolicy: manual`, `updatePolicy: auto`,
  `categories: []`.
- Stages onboarding docs and four ready-made guard blocks into
  `/agent/brain/meta-and-voc-onboarding/`, plus the `voc-data-pull`,
  `meta-ad-performance-analysis`, and `onboarding-walkthrough` skills into the
  skills root.
- Post-install runs silently in the installing conversation: reachability check
  (`integrations status --app <slug>` per known VoC platform, stored secrets,
  Meta workspace connection), one daily `voc-sync-<platform>` routine per
  reachable platform with the first run kicked, single-Write guard merge into
  `/agent/user.md` with an anti-duplication check, Creative Attributes, and the
  Account Context Brain autofill persisted to disk - asking nothing. It ends
  with a status-only report (one line per part, question count, no findings or
  question text) and the verbatim invitation "Are you ready to begin your
  onboarding?".
- The walkthrough presentation (opening frame, field sections, closing TLDR)
  lives in the `onboarding-walkthrough` skill and fires only on a human's yes to
  that invitation or an explicit ask to begin/resume onboarding.
- Validation is a training loop (validation doc v1.10, ACB v1.31, validation
  gate guard v3): the question loop and the deck build train one brain. All
  feedback routes through a durability test — judgment rules heal ACB fields,
  standing preferences land in the register note or Field 10, current-state
  facts shape the answer only, one-offs are applied and forgotten. Deck change
  requests are context corrections (structure/cadence/slicing to Field 10,
  metric/winner complaints to the interpretation fields); the deck regenerates
  from context and is never hand-edited directly (one-offs touch the current
  render only and revert on refresh — said out loud; standing look-and-feel
  lives in validation.md's deck record, where the refresh routine reads it).
  MVCE requires every question clean (latest answer confirmed without
  correction — corrections re-open only the questions they touch, never a full
  re-run) and spec-level deck approval; validation.md tracks questions clean,
  total corrections, and deck rebuilds. The loop continues past MVCE: durable
  corrections in any later conversation get the same routing, no scheduled
  check-ins.
- Meta reachability is connection-status-driven: a connected Meta workspace gets
  `voc-sync-meta-ads` even when API probes error, and the account-context
  scaffold is always written, blockers recorded per field.
- Install-failure posture: report the exact error and stop - never hand-copy
  staged files or edit state under `/agent/.runneth/packages/`.
