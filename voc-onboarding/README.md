# Voice of Customer Onboarding Package: Overview

> **Manual install.** This schema-v1 package is available only through an explicit
> `package install`. `updatePolicy: auto` rolls out merged updates to installed copies.
> A branch ref instead of `#main` is only for testing an unmerged branch or PR.

This is the Voice of Customer half of the onboarding lifecycle: it lands the customer's
raw voice - product reviews, support conversations, surveys, social listening, and ad
comments - as standardized files in the workspace's brain folder, keeps them current with
daily sync routines, and offers a Voice of Customer Audit with gap analysis once the
backfill is covered. Onboarding has two halves and is complete only when both land:
the **technical half** (sources connected and syncing) and the **strategic half** (the
initial audit and gap analysis delivered and explained, with a standing refresh routine
that keeps surfacing new signal). Connection alone never closes out onboarding.
It is one of two independent installs (the other is the `meta-onboarding`
package, which owns Meta account context, guards, validation, and the walkthrough); each
installs, activates, and completes on its own, and neither requires the other. Together
they replace the combined `meta-and-voc-onboarding` package (see "Migrating from
meta-and-voc-onboarding" below - a note for VMs that ran the old package, not an
install-time concern).

The parts, and their operational nature:

- **VoC Data Pull** - background: setup once, daily routines do the work.
- **Voice of Customer Audit** - turns synced customer language into durable
  creative-strategy insight, always including a gap analysis. The initial run waits for
  a person's yes; delivering it completes onboarding and starts a standing refresh that
  keeps the audit current.

The one-line model:

> **The pull gives Runneth the org's raw customer voice, one file per item, per workspace.
> The audit and gap analysis turn it into creative-strategy insight - and delivering
> them is what makes the workspace onboarded.**

---

## Where the package files live

This folder holds one part per subfolder: `voc-data-pull/` (the VoC Data Pull skill,
recipes, and templates) and `voc-audit/` (the manual Voice of Customer Audit skill), plus
`instructions/` (the activation gate) and this README. `package.json` (the package
manifest) maps every file to its installed location.

### How to install (exact procedure)

Never copy files by hand - the package manager stages everything.

**What to send Runneth for an explicit install.** Installation stages files only. The
package activation subsequently discloses the post-install effects and asks the person
before VoC sync routines are created. The install message never needs to name a
workspace: after approval, post-install step 0 reads it from the `Default workspace:`
line of the conversation's Motion context. Canonical message:

> Install the voc-onboarding package: run
> `package install "github:Motion-Creative/runneth-apps/voc-onboarding#main"`.

Branch-testing variant (same clause, different ref):

> Install the voc-onboarding package: run
> `package install "github:Motion-Creative/runneth-apps/voc-onboarding#<branch>"`.

The canonical install path:

1. Run `package install "github:Motion-Creative/runneth-apps/voc-onboarding#main"`.
   The completed install records selected intent, so VM rebuilds reinstall the package
   automatically, and `updatePolicy: auto` keeps it updated after that.

Branch testing only (the version on `main` is not what you were asked to install, e.g. a
PR or branch reference):

1. If you were given a pull-request URL, resolve it to its head branch first. VMs have no
   GitHub connection, so `gh` always fails here (`Client Error (409)`); use the public API
   instead: `curl -s https://api.github.com/repos/<owner>/<repo>/pulls/<number>` and read
   `.head.ref`.
2. Run: `package install "github:Motion-Creative/runneth-apps/voc-onboarding#<branch>"`.
   Always use this `github:` ref form - the `https://github.com/.../tree/<branch>/...` URL
   form misparses branch names that contain `/` and fails with a 422.

If an install fails, report the exact error and stop. Do not work around the package
manager: never copy staged files by hand and never edit anything under
`/agent/.runneth/packages/` (`installed.json`, operations, locks). Partial or hand-made
package state is worse than a failed install.

After a successful install there is exactly one next step: the package activation
discloses the setup and waits for a human yes. Do not append migration questions,
package-conflict checks, or file inventories to the install confirmation - the
disclosed offer (and the human's yes) is the whole handoff. Only on that yes run
[`post-install.md`](post-install.md), staged at
`/agent/brain/voc-onboarding/post-install.md`.

These instruction files are the package itself, not its output. They stay in the shared
staged folder (`/agent/brain/voc-onboarding/`), outside every workspace folder. What
Runneth generates from running them lands under
`/agent/brain/<workspace>/data-sources/voc/`.

### Migrating from meta-and-voc-onboarding

A VM onboarded by the combined package needs nothing: this package's activation honors
the legacy `runneth:meta-voc-onboarded` roster, so listed workspaces count as onboarded
and their existing `voc-sync-<workspace>-*` routines keep running untouched. Do not keep
the combined package installed alongside this one - both stage `voc-data-pull` and
`voc-audit` to the skills root, and two installed owners of one path is a conflict.
This is a migration note, not an install-time checklist: installing this package never
requires checking for, asking about, or uninstalling the combined package first. Raise
the conflict only if the combined package actually shows as installed on this VM, and
even then after the activation's setup offer, never instead of it.

---

## One folder per workspace

Everything this package produces is scoped to the Motion workspace it was produced for.
The workspace's VoC corpus lives under
`/agent/brain/<workspace>/data-sources/voc/`, where `<workspace>` is the workspace name
slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen,
trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`,
"St. Fig & Co." -> `st-fig-co`), resolved from the conversation.

```
/agent/brain/
  bramblewick-nyc/
    data-sources/
      voc/
        voice-of-customer-audit.md  # created by the later audit skill, not initial sync
        <platform>/                 # one folder per pulled platform, one file per item
        meta-ad-comments/           # standard pull when Meta is connected, one file per creative
  st-fig-co/                the same structure, entirely independent
```

Why it matters: a sandbox is per organization, not per workspace, so every workspace in an
org shares one VM and one filesystem. Multi-workspace orgs are real - agencies with a
workspace per client, brands with a workspace per region - and each one has its own
platform accounts and its own customers. Writing to shared paths would silently accumulate
two brands' customer voice into one corpus. Per-workspace folders make onboarding a second
workspace a normal, additive operation: it creates a folder and touches nothing that
belongs to the first.

Integrations and stored secrets are VM-wide, and an org can hold one account of a platform,
several (one per workspace), or one genuinely shared - which is why setup pins a
human-confirmed account per workspace, and the folders separate the data each workspace
pulls through it.

---

## VoC Data Pull

Folder: `voc-data-pull/`

- **Job:** pull raw voice-of-customer data - product reviews, support conversations, surveys,
  community posts, and comments - from available VoC platforms into standardized files under
  `/agent/brain/<workspace>/data-sources/voc/<platform>/`, one file per item. Meta ad
  comments are the standard pull whenever a Meta workspace is connected: they land beside
  the other platform
  folders under `voc/meta-ad-comments/`, one file per creative carrying every comment on
  that creative (creative asset id, the creative's preview URL when the pull returns one,
  each comment's author, date, and platform, engagement, and the creative's total comment
  count). Recipes exist for
  Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped, Reviews.io, Gorgias, Intercom,
  Zendesk, Klaviyo, Attentive, Gong, Hotjar, Reddit, Discord, and Meta ad comments
  (the authoritative table is the skill's Step 1) - but the scope is customer-voice data,
  not the recipe list: any other reachable VoC platform gets pulled live-adapted, no recipe
  needed. Any platform may be reachable by OAuth connection **or** a stored API key - the
  connection method is how the customer set it up, never a coverage limit.
- **Own boundaries.** Read-only against platforms, bounded 12-month pulls, PII rules - all
  in `voc-data-pull/SKILL.md`.
- **Does not create the audit.** The later Voice of Customer audit skill reads these raw files
  and writes `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. That file
  is intentionally absent during initial install and backfill.
- **Runs after onboarding approval.** After a human approves the activation's disclosed
  setup, Runneth checks which VoC
  platforms the org can reach - one batched status sweep for the OAuth connections
  (a single shell loop of `integrations status` over the skill's canonical slug list;
  `integrations list` reports catalog metadata only, so it is never part of the
  check) **and** the
  stored secrets for every VoC platform (any of them may be key-stored instead of
  connected; Okendo and Stamped always are; a stored Apify key makes Reddit, X, and
  Amazon Reviews reachable through Apify actors), plus the Motion workspace connection
  for Meta ad
  comments (never a data-pull probe). The findings are never silent: setup opens with
  the transparent inventory ("here's what I can already see"), offers the connectable
  categories with concrete examples - customer reviews (Yotpo, Trustpilot, Judge.me),
  customer support (Zendesk, Gorgias, Intercom), post-purchase surveys (Narvar,
  AfterShip, Malomo, Loop Returns, Rebuy), social listening (specific Reddit threads,
  X - via Apify) - and asks which of these the person actually hears from customers
  on. Their answer gets a numbered plan (connect, sync, choose where updates land)
  before any work happens. Then Runneth runs the skill's "Set up the recurring sync"
  procedure for every reachable or newly connected
  platform: one daily routine per platform per workspace (`voc-sync-<workspace>-<platform>`, 6am)
  whose first run backfills
  and whose daily runs pull only new items. Platform accounts are org-level with no
  workspace tag, so setup starts by **pinning the account**: a human confirms which
  account belongs to this workspace (a lone connection may belong to a different
  workspace, or be genuinely shared - both are normal), and every pull afterwards
  addresses that exact account. Once the workspace's backfill is fully covered, the sync
  routine offers a Voice of Customer Audit once (deferring while a Meta onboarding is
  mid-flight); it never runs the audit
  automatically. A platform connected later gets set up on ask - nothing runs just
  because a platform connects.
- **Installs to the skills root** (`/agent/.agents/skills/voc-data-pull/`), not the brain -
  see the `voc-data-pull-skill` resource in `package.json`.

---

## Voice of Customer Audit (skill, own folder)

Folder: `voc-audit/`

- **Job:** analyze synced reviews, support conversations, ad comments, community posts, and
  other customer voice into five creative-strategy buckets: pain points, trigger moments,
  addressable objections, transformations, and standout customer language. Buckets 1-4 are
  numbered lists of distinct standalone findings — quotes, where they appear, verbatim and
  attributed inline (name, rating, source file), with an explicit no-signal line for empty
  buckets — and the same structure lands in the saved brain page, not just the chat view.
  **Every audit includes a gap analysis**: pain points mapped against transformations to
  show what the product already resolves, what is partially addressed, and what is still
  open — a standard section, never an ad-hoc addition. Products with at least 200 entries
  also receive evidence-backed personas.
- **The initial run is manual; refreshes are standing.** The sync routine offers the
  audit once after the workspace's backfill is fully covered; the offer previews the
  method and invites additions and reference docs (existing personas especially), which
  the run honors. A yes or an explicit request such as "run a VoC audit" invokes the
  skill. Connecting a source or syncing files never runs it automatically. The audit
  requires at least 200 total entries. **Delivering the initial audit completes
  onboarding**: the skill creates a daily `voc-audit-refresh-<workspace>` routine that
  updates the audit and gap analysis when new customer voice lands, notifies the chosen
  destination in plain language only when something moved, and once a month asks whether
  there are insights or sources the audit isn't capturing.
- **Reads raw evidence from:** `/agent/brain/<workspace>/data-sources/voc/<platform>/`.
- **Persists compiled insight to:**
  `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. The skill rewrites this one
  canonical page on a person-approved rerun, cites raw items, and indexes it for validation
  and future customer-side WHY questions.
- **Installs to the skills root** (`/agent/.agents/skills/voc-audit/`), not the brain - see
  the `voc-audit-skill` resource in `package.json`. Its compiled output lives in the brain;
  the executable skill instructions do not.

---

## After install: offer onboarding and wait for approval

The activation instruction checks the per-workspace state blocks (this package's
`runneth:voc-onboarded` roster and `runneth:voc-connected` block, plus the legacy
`runneth:meta-voc-onboarded` from the combined
package) and offers the setup at most once per conversation when this workspace is not
listed anywhere. It states that setup will show what's already visible, ask which
channels the person hears customers on, inspect connected accounts, create applicable
routines, and later offer the audit and gap analysis that complete onboarding. Only an
explicit human yes runs
[`post-install.md`](post-install.md). Installation, reinstall, or upgrade alone is never
consent. Automatic updates never rewrite `/agent/user.md`.

**Onboarding completes in two halves.** Setup ending with dedicated sources syncing
records the workspace in the `runneth:voc-connected` block - the technical half. The
strategic half lands later: once the backfill covers, the sync routine offers the
Voice of Customer Audit, and delivering it (with its gap analysis, plus the standing
refresh routine the audit skill creates) is what moves the workspace to
`runneth:voc-onboarded`. Post-install never writes the onboarded roster itself.

**A dedicated customer-voice platform is required to even get that far.** When setup
runs and Meta ad
comments turns out to be the only reachable source, the workspace is recorded in a
`runneth:voc-partial` block instead: the ad-comments sync runs,
but the closing message leads with connecting an integration (not a completion report),
and the activation gives a short once-per-conversation reminder in every later
conversation until a dedicated platform - reviews, support, post-purchase surveys, or
social listening - is connected. Connecting one and saying yes resumes setup for that
platform and moves the workspace to the connected block, where the audit pipeline takes
over.

## Install and run order

1. **Install the package** with one explicit `package install` call (see "How to install"
   above); never copy files by hand.
   Staging the files does not self-run anything. The activation discloses the setup and
   waits for a human yes; the approved post-install run then opens
   with step 0: it quotes the `Default workspace:` line from the conversation's Motion
   context verbatim and states the name, workspaceId, and slug taken from it before
   anything else executes - existing folders, rosters, routines, and remembered context
   never identify the workspace.
2. **Open with the inventory and the channel question.** Setup states what it can
   already see (connected and reachable sources, in plain words), offers the
   connectable categories with concrete examples - customer reviews, customer support,
   post-purchase surveys, social listening - and asks which of these the person
   actually hears from customers on. Their answer gets a numbered plan (connect the
   named platforms, set up the daily syncs, confirm where updates land - this
   conversation, Slack, or somewhere else) before any work happens. Social listening
   channels connect through Apify.
3. **Set up VoC data syncs.** For each reachable or newly connected customer-voice
   source, pin the workspace's
   account, create the daily `voc-sync-<workspace>-<platform>` routine, and kick the first
   backfill. The 12-month backfills churn in the background; daily runs keep the corpus
   current afterward and notify the chosen destination only when something new landed -
   a run that found nothing new is silent, and the initial backfill is silent regardless
   of volume (its completion surfaces through the audit offer). This records the
   workspace as connected, not onboarded. If ad comments end up the
   only reachable source, the workspace lands
   in the partial state described above - setup is not complete, and the person is urged
   to connect a dedicated platform until one is.
4. **Run the Voice of Customer audit to complete onboarding.** Offered once by the sync
   routine after the
   workspace's backfill is fully covered (deferring while a Meta onboarding is mid-flight)
   and run only on a person's yes, the `voc-audit` skill compiles
   the workspace's cross-platform customer-voice findings - five buckets, gap analysis,
   personas - to
   `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. Delivering it
   is what marks the workspace onboarded. It is not an install-time artifact.
5. **Keep everything current.** VoC data refreshes itself through its daily sync
   routines, and once onboarding completes, the standing `voc-audit-refresh-<workspace>`
   routine updates the audit and gap analysis when new customer voice lands, notifies
   in plain language only when something moved, and once a month asks whether anything
   is missing from the picture. A person can still ask for a full rerun anytime.
