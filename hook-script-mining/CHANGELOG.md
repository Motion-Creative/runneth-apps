# Hook & Script Mining changelog

Repo-side maintainer history. Never staged to customer brains. Versions are simple
integers (`1`, `2`, ...) and bump once per package update - one version per merged
change to the package, not per commit. Entries are newest-first.

## 1 - 2026-08-11

The package as it ships:

- Schema-v1 `package.json` manifest, indexed in the repo root `package-index.json`
  with a raw `github` source. `installPolicy: auto`, `updatePolicy: auto`,
  `uninstallPolicy: allowed`, `categories: ["ai-training-club-26"]`.
- Stages the process docs (`README.md`, `01-source-and-classification.md`,
  `02-pattern-library-and-concept-use.md`, `03-worked-example.md`,
  `04-bank-building-process.md`, `05-library-confirmation.md`) into
  `/agent/brain/hook-script-mining/`, plus the `hook-script-mining` skill into the
  skills root, plus a `package_instruction` (`instructions/activation.md`) that the
  package manager surfaces in every conversation while the package is installed.
- **Idempotent activation.** Because the package instruction is present in every
  conversation (not delivered once at install), it gates on the built library as its
  done-marker: silent when `/agent/brain/<workspace>/hook-script-mining/` exists,
  and while it doesn't, offers the first build at most once per conversation and
  drops the offer on a "not yet."
- **Uninstall leaves the library.** Uninstalling removes the staged docs and the
  skill only; the built library stays at its canonical path, and a reinstall seeds
  from it instead of rebuilding.
- **Seed numbers come from glossary rollups.** Per-tag creative counts and spend are
  read from the pull's top-level `glossaryRollups` (`exclusive_value_only` policy)
  instead of summing row spend, so multi-tagged creatives are never double-counted
  in the customer-facing confirmation tables.
- **Bounded pulls.** The cache-miss transcript fallback is scoped to the one
  creative (`--scope creative-asset-id`), never a fresh account-wide pull; the
  mechanics Tier 2 sample is defined (top 2-3 per visual format) and capped at ~15
  creatives.
- **One Apify token per customer.** The credential is org/VM-scoped under the
  standard `APIFY_API_TOKEN` key everywhere (matching how runtime secrets actually
  scope); "never shared" means across customers' VMs.
- **App fetch guardrails + real design reference.** Media downloads only from the
  actor-returned HTTPS URL with a ~50MB cap and timeout (text-tile fallback on any
  failure), and the app themes on `/runneth/references/design-system.md` - the
  reference that actually exists in the runtime - instead of a per-account stylesheet
  path.
- **URL rule scoped to links; uploads never blocked.** Field feedback: the agent
  refused to file a directly uploaded video without a source URL. The exact-URL
  requirement now applies only to assets that arrived as links (Step 1a's path); a
  direct upload is its own watchable evidence - record platform/handle when known,
  ask once for the original link if they have it, never block filing on it.
- **The Apify ask says why, in human words.** The activation's step-one offer now
  explains it plainly: Apify is what lets Runneth actually watch the posts you send
  in; without it only the caption is visible, and it won't classify a video it
  hasn't watched.
- **Swipe-file viewer app (optional visualization).** New staged doc
  `06-swipe-file-app.md`: once 3-4 confirmed entries exist, the skill offers a
  browsable app over the confirmed library (one tab per axis, brand/creator filters,
  playable evidence pulled via the workspace's Apify token), discloses the app writes,
  media downloads, and build, and waits for a human yes. After a human-approved build
  succeeds, it offers a separate human-confirmed daily sync routine
  (`swipe-file-app-sync-<workspace>`). Read-only: the app and its routine never add,
  infer, or auto-confirm entries; the one-human-yes-per-entry gate is untouched.
- **Apify connection is setup step one.** The activation offers connecting Apify
  (via the secure credential flow, per `01` Step 1a) before the library build, so
  the credential outside-link submissions need is in place from day one. Declining
  blocks nothing: the build is Motion-only, and the first outside link re-raises
  the connection.
- **One save path.** The built library always lands at
  `/agent/brain/<workspace>/hook-script-mining/`, kept separate from this account's
  own shared hook/headline taxonomy folder. Resolves the earlier inconsistency
  between two real installs (one had saved to the shared taxonomy folder, the other
  to a separate `creative-scouting/`-style folder); `01` now specs this one path
  only.
- **Account-context aware, not account-context dependent.** Before building, reads
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` when it already
  exists (from the Meta and Voice of Customer onboarding package), and uses its
  confirmed naming decoder and reporting dimensions. Builds fully standalone when it
  doesn't exist. Top-spend sorting is called out explicitly as a sampling method for
  picking one representative seed example per tag, never a performance judgment.
- **Cache-first creative content.** Transcript, summary, and creative-breakdown
  pulls check `motion cache search-summaries` / `motion cache get-creative` first and
  fall through to a live `motion meta insights` pull only on a clear cache miss,
  error, or a sandbox with the cache feature disabled.
- **Spend is an intentional, documented exception.** This account's own spend and
  creative counts are saved into seed entries and confirmation tables as the
  library's own ranking signal, an explicit exception to the standing "never save
  spend into brain content" rule. Spend here never stands in for ad performance and
  never drives a scale/cut call; those stay out of this package's scope entirely.
- **Logs itself.** Once a build or update clears human confirmation, adds one line to
  `/agent/brain/<workspace>/_changelog.md`, matching the Meta and Voice of Customer
  onboarding package's brain-organization convention so a maintenance sweep doesn't
  flag the new folder as stray.
- Package description rewritten to match what the docs actually do: points install
  behavior at `instructions/activation.md` (ask before touching anything) instead of
  describing an immediate, unprompted run; states that creative mechanics builds from
  a checklist plus creative breakdowns rather than "starting empty"; and states the
  real, narrower paid-performance-data boundary (spend feeds the library's own
  ranking, but never a performance or scale/cut judgment) instead of the broader
  "never touches paid performance data" claim the docs contradicted.
- One asset at a time, submission-driven, no scheduled runs. Never lets another
  account's names, quotes, or figures appear in this account's library.
