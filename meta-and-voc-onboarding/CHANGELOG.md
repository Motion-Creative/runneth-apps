# Meta and Voice of Customer Onboarding changelog

Repo-side maintainer history. Never staged to customer brains. Versions are simple
integers (`1`, `2`, ...) and bump once per package update - one version per merged
change to the package, not per commit. Entries are newest-first.

## 1 - 2026-07-29

The package as it ships:

- Schema-v1 `package.json` manifest, indexed in the repo root `package-index.json`
  with a raw `github` source. Manual install: one explicit `package install` call
  of the GitHub source. `installPolicy: manual`, `updatePolicy: auto`,
  `categories: []`.
- Stages onboarding docs and four ready-made guard blocks into
  `/agent/brain/meta-and-voc-onboarding/`, plus the `voc-data-pull`, `voc-audit`,
  `meta-ad-performance-analysis`, and `onboarding-walkthrough` skills into the
  skills root.
- **One folder per workspace.** Everything the package produces lands in
  `/agent/brain/<workspace>/` (workspace name slugged: lowercase; non-alphanumeric
  runs become one hyphen; trim hyphens): the Meta interpretation layer under
  `data-sources/meta/` (`account-context.md`, `naming-decoder.json`,
  `validation.md`, `_changelog.md`), VoC data under `data-sources/voc/<platform>/`
  (Meta ad comments are the standard pull of every onboarding, one file per creative
  under `data-sources/voc/meta-ad-comments/`),
  the compiled VoC audit at `data-sources/voc/voice-of-customer-audit.md`, and
  `_tag-vocabulary.md` at the workspace root alongside that workspace's general
  `_changelog.md`. A second workspace in the same org onboards additively without
  touching the first.
- **Workspace-agnostic guards** (`account-context-guard` v3, `meta-validation-gate`
  v4, `knoweth-organize` v3, `knoweth-brain` v3): merged into `/agent/user.md`
  verbatim, once per VM, with no install-time token substitution. Each guard
  resolves the workspace folder per conversation. Post-install records each
  onboarded workspace in a `runneth:meta-voc-onboarded` roster block in
  `/agent/user.md`; the activation gate checks the roster for this conversation's
  workspace, so a second workspace on an already-guarded VM still gets its own
  onboarding run.
- **VoC account pinning.** Platform accounts are org-level with no workspace tag,
  and one org can hold several accounts of the same platform (or share one). Setup
  pins a human-confirmed account per workspace per platform; every sync run
  addresses that exact account (`--account <accountId>`) and never falls back to
  another. Auto-pin only when the org has exactly one Motion workspace. Routines
  are workspace-named (`voc-sync-<workspace>-<platform>`), each carrying its
  workspace folder path, workspace id, and pinned account id literally - routine
  runs have no workspace attached to resolve.
- **Voice of Customer Audit** (`voc-audit` skill): the manually triggered compiled
  layer across reviews, support conversations, ad comments, community posts,
  surveys, and other synced customer voice. It requires 200 total entries, produces
  five creative-strategy buckets, and adds evidence-backed personas for products
  with 200 or more entries. It saves one canonical compiled page at
  `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`, with
  Knoweth metadata and raw-item citations, indexed in `/agent/INDEX.md`. The
  workspace's first fully covered VoC backfill offers the audit once and records
  the offer in `/agent/brain/<workspace>/_changelog.md`; the audit runs only on a
  person's yes or explicit request - never on connection, sync, install, or daily
  refresh - and person-approved reruns regenerate that page rather than creating
  duplicates. `meta-ad-performance-analysis` reads the audit for customer-side WHY
  and what-to-make-next questions; `onboarding-walkthrough` offers the audit as a
  fallback when a backfill is ready and the routine has not already offered it;
  validation (doc v1.12) adds a conditional customer-voice starter question when
  the audit exists and uses it in customer-side WHY answers.
- **The creative content layer** is a capability with an access contract, not a
  synonym for Cacheth: the Cacheth Command Reference defines a four-rung ladder
  (Knoweth injection -> `motion cache search-summaries` ->
  `motion cache get-creative` -> live `motion meta insights` content flags). The
  live rung is failure-only - it fires when the cache errors, is empty or still
  building, or is missing the record, and is the standing path when the sandbox
  cache feature is disabled - so cache-disabled sandboxes still decode names,
  validate, and organize instead of being permanently gated. Metrics pulls stay
  lean (no content flags); content joins from the cache on `creativeId`.
- Post-install opens with step 0: it quotes the `Default workspace:` line from
  the conversation's Motion context verbatim - the workspace the runtime bound
  the conversation to - states the name, workspaceId, and slug taken from it,
  and only then proceeds. Existing folders, rosters, routine names, and
  remembered context never identify the workspace. It then runs silently in the
  installing conversation: reachability check
  (`integrations status --app <slug>` per known VoC platform, stored secrets,
  Meta workspace connection), one daily `voc-sync-<workspace>-<platform>` routine
  per reachable platform with the first run kicked, single-Write guard merge into
  `/agent/user.md` with an anti-duplication check, Creative Attributes, and the
  Account Context Brain autofill persisted to disk - asking nothing else except
  the account-pinning confirmation when ownership cannot be auto-resolved. It ends
  with a status-only report (one line per part, question count, no findings or
  question text) and the verbatim invitation "Are you ready to begin your
  onboarding?".
- The walkthrough presentation (opening frame, field sections, closing TLDR)
  lives in the `onboarding-walkthrough` skill and fires only on a human's yes to
  that invitation or an explicit ask to begin/resume onboarding. After the
  account-context questions are handled, the walkthrough is proactive about
  customer voice: it presents a Voice of Customer summary without being asked -
  one line per integration with platform, kind of voice, items synced, products
  spanned, and date coverage ("Judge.me: 1,240 reviews across 6 products") -
  then explains what the audit entails (the five buckets, per-product personas
  at 200+ entries, the compiled page, and its gate) and hands the person the
  manual trigger. Data ready means the direct question (logging the
  `voc-audit-offer` entry if absent); an existing audit gets a rerun offer with
  what has synced since; an incomplete backfill still gets the summary and
  explanation with the run deferred.
- The Account Context Brain's field-to-command map names the real extraction
  keys, verified against agent-builder's response schemas (fixes from the first
  real customer-VM install report): ads-grain rows carry no
  `adName`/`campaignName`/`adsetName` keys - the ad's name is `name`, and ad
  set / campaign identity lives in `associatedObjectDetails` (populated only
  with `--include-associated-objects`); a top-level `adName` exists only on
  adnames-grain rows. Field 4 pulls the decode from the Creative Attributes
  handoff or `--grain adnames --include-associated-objects`; Fields 6 and 7
  keep ads-grain with the flag and the right paths; a standing note under the
  map says spend rows with `.adName: null` mean a wrong extraction key, never
  an empty account. The same response-shape note sits in the Data-Query Guide's
  `motion meta ads` section, and the Creative Attributes playbook's
  cache-disabled decode fallback uses adnames-grain with associated objects.
  For navigation, every ACB field section is headed `## Field N - <name>` with
  a contents section up top, and the saved `account-context.md` file-metadata
  block has an explicit YAML template (`fields_confirmed`, `field_statuses`,
  `open_flags`, `naming_decoder`) that the guard's all-confirmed check and the
  validation gate read.
- Validation generates its question set from the confirmed account context
  (doc v1.13) instead of a fixed list: the baseline questions parameterized with
  the account's real reporting dimensions, testing bucket, and decoder names,
  plus one derived question per filterable decoder dimension with at least 3
  creatives and meaningful 7-day spend, a Field 9 winner/cut probe, and a
  Field 7 testing-pipeline question - typically 7-12 total, customer additions
  invited. Answers are pre-filled in batch before any are shown: one primary-
  bucket insights pull (no `--limit`, `totalCount` checked before all-ads
  claims), one testing-bucket pull, a conditional wider pull when Field 9's
  floor is lifetime, and creative content through the content layer's ladder
  (`get-creative` per winner for tags). The full Q&A presents together and
  confirms per question under a fixed answer format contract: verbatim
  question, 2-4 bullets, table at 3+ comparisons, gallery with decoded names
  when ads are named - Winner/Watch/Cut labels only on the winner/cut
  question. The testing-pipeline question makes no scale recommendations until
  the testing-to-scaling rule is captured.
- Validation is a training loop (validation doc v1.13, ACB v1.32, validation
  gate guard v4): the question loop and the deck build train one brain. All
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
  `voc-sync-<workspace>-meta-ad-comments` even when API probes error, and the
  account-context scaffold is always written, blockers recorded per field.
- Install-failure posture: report the exact error and stop - never hand-copy
  staged files or edit state under `/agent/.runneth/packages/`.
