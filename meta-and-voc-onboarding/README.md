# Meta and Voice of Customer Onboarding Package: Overview

> **Manual install (beta).** This is a real indexed package: it carries a schema-v1
> manifest and is registered in the repo's `package-index.json` with
> `installPolicy: manual` - nothing installs it except one explicit
> `package install "github:Motion-Creative/runneth-apps/meta-and-voc-onboarding#main"` call.
> The completed install records selected intent, so it survives VM rebuilds, and
> `updatePolicy: auto` rolls out merged updates. A branch ref instead of `#main` is only
> for testing an unmerged branch or PR.

This is the onboarding bundle for a customer's brain. Installing it is the trigger: the
install conversation stages this folder's files to their destinations on the VM with one
`package install` call (per `package.json`, the package manifest - skill files to the
skills root, docs to `/agent/brain/meta-and-voc-onboarding/`) and immediately runs the package
for everything the org already has connected (see "After install" below); routines and
guard blocks keep it current afterward. Its parts do two jobs, in order: **land the data** (VoC pulls into brain
files, the creative layer in Cacheth), then **teach the interpretation** (Account Context
Brain, Validation) - with Knoweth organizing the result so retrieval stays tight.

The parts, and their operational nature:

- **VoC Data Pull** - background: setup once, daily routines do the work.
- **Voice of Customer Audit** - manual skill: turns synced customer language into durable
  creative-strategy insight after a person says yes.
- **Creative Attributes** - establishes the creative layer (Cacheth) and naming detection.
- **Account Context Brain** - autofill runs silently at install; the gap questions wait for
  the walkthrough.
- **Onboarding Walkthrough** - on-demand skill: presents the findings and collects the human
  answers when someone says yes to "Are you ready to begin your onboarding?", then
  summarizes the synced customer voice per integration and offers the audit.
- **Meta Validation** - human-gated proof loop.
- **Meta Ad Performance Analysis** - on-demand diagnostic skill; nothing self-runs.
- **Knoweth organize** - self-gating: fires on its own conditions once content lands; do not
  force it.

The one-line model:

> **The data parts give Runneth the org's raw material - customer voice and creative facts.
> The interpretation parts teach it how this account judges that material. Knoweth holds the
> structure so both stay findable as the brain grows.**

---

## Where the package files live

This folder holds one part per subfolder: `meta/` (the Creative Attributes playbook, the
Account Context Brain package, the Meta Validation package, the Motion CLI Data-Query
Guide, and the Cacheth Command Reference), `voc-data-pull/` (the VoC Data Pull skill,
recipes, and templates), and `voc-audit/` (the manual Voice of Customer Audit skill), plus
`knoweth/` (the organize-the-brain part that runs after the questions),
`meta-ad-performance-analysis/` (the ad performance analysis skill),
`onboarding-walkthrough/` (the walkthrough presentation skill), and `guards/` (the four
ready-made `/agent/user.md` guard blocks that post-install merges). This README
covers all of them; `package.json` (the package manifest) maps every file to its installed location.

### How to install (exact procedure)

Never copy files by hand - the package manager stages everything.

**What to send Runneth (copy-paste - this exact shape matters).** The install message
must carry the kickoff clause itself: installing stages files, but the post-install
sequence (VoC sync routines, guard merges, Meta account context) runs only when the
conversation tells it to. The message never needs to name a workspace: post-install's
step 0 resolves it mechanically from the conversation's own runtime environment.
Canonical message:

> Install the meta-and-voc-onboarding package: run
> `package install "github:Motion-Creative/runneth-apps/meta-and-voc-onboarding#main"`,
> then read `/agent/brain/meta-and-voc-onboarding/post-install.md` and execute its
> install-time sequence in this conversation.

Branch-testing variant (same clause, different ref):

> Install the meta-and-voc-onboarding package: run
> `package install "github:Motion-Creative/runneth-apps/meta-and-voc-onboarding#<branch>"`,
> then read `/agent/brain/meta-and-voc-onboarding/post-install.md` and execute its
> install-time sequence in this conversation.

The canonical path (`installPolicy: manual` - nothing installs this package except the
explicit call):

1. Run `package install "github:Motion-Creative/runneth-apps/meta-and-voc-onboarding#main"`.
   The completed install records selected intent, so VM rebuilds reinstall the package
   automatically, and `updatePolicy: auto` keeps it updated after that.

Branch testing only (the version on `main` is not what you were asked to install, e.g. a
PR or branch reference):

1. If you were given a pull-request URL, resolve it to its head branch first. VMs have no
   GitHub connection, so `gh` always fails here (`Client Error (409)`); use the public API
   instead: `curl -s https://api.github.com/repos/<owner>/<repo>/pulls/<number>` and read
   `.head.ref`.
2. Run: `package install "github:Motion-Creative/runneth-apps/meta-and-voc-onboarding#<branch>"`.
   Always use this `github:` ref form - the `https://github.com/.../tree/<branch>/...` URL
   form misparses branch names that contain `/` and fails with a 422.

If an install fails, report the exact error and stop. Do not work around the package
manager: never copy staged files by hand and never edit anything under
`/agent/.runneth/packages/` (`installed.json`, operations, locks). Partial or hand-made
package state is worse than a failed install.

The moment the install succeeds, run [`post-install.md`](post-install.md)
(staged at `/agent/brain/meta-and-voc-onboarding/post-install.md`) in the same conversation.

These instruction files are the package itself, not its output. They stay in the shared
staged folder (`/agent/brain/meta-and-voc-onboarding/`), outside every workspace folder.
What Runneth generates from running them lands under
`/agent/brain/<workspace>/data-sources/meta/`: the filled account context (which carries
the confirmed naming decode). Per-creative content lives in Cacheth (the local creative
cache); nothing in this package writes it to brain files.

---

## Scope rules (apply to every Meta step)

- **Meta only.** Never look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta ad data and
  customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <id>`, and
  everything it produces lands in that workspace's own folder (see below).
- **Brain files are customer-facing account content.** Only account facts belong in them.
  Never save internal notes, CLI commands, or debugging mechanics. Per-creative content lives
  in Cacheth; it goes into a brain file only when a person explicitly asks, as a dated snapshot
  (the cache stays the source of truth for current facts).

---

## One folder per workspace

Everything this package produces is scoped to the Motion workspace it was produced for. A
workspace's context, naming decoder, validation state, and VoC corpus live together under
`/agent/brain/<workspace>/`, where `<workspace>` is the workspace name slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Huel EU" -> `huel-eu`, "Mr. Beast" -> `mr-beast`), resolved from the conversation.

```
/agent/brain/
  huel-eu/
    _tag-vocabulary.md
    _changelog.md
    data-sources/
      meta/
        account-context.md
        naming-decoder.json
        validation.md
        _changelog.md
      voc/
        voice-of-customer-audit.md  # created by the later audit skill, not initial sync
        <platform>/                 # one folder per pulled platform, one file per item
        meta-ad-comments/           # standard pull of every onboarding, one file per creative
  motion-crew/              the same structure, entirely independent
```

Why it matters: a sandbox is per organization, not per workspace, so every workspace in an org
shares one VM and one filesystem. Multi-workspace orgs are real - agencies with a workspace per
client, brands with a workspace per region - and each one has its own Meta connection, its own
naming conventions, and its own customers. Writing to shared paths would mean the second
workspace onboarded either overwrites the first's context or silently accumulates its customer
voice into the same corpus. Per-workspace folders make onboarding a second workspace a normal,
additive operation: it creates a folder and touches nothing that belongs to the first.

Two things stay deliberately org-wide, because they describe the VM rather than an account: the
four guard blocks in `/agent/user.md` (workspace-agnostic rules that resolve the folder per
conversation, so they are merged once and shared) and `/agent/INDEX.md`. Integrations and
stored secrets are also VM-wide, and an org can hold one account of a platform, several (one
per workspace), or one genuinely shared - which is why VoC setup pins a human-confirmed
account per workspace, and the folders separate the data each workspace pulls through it.

Retrieval has a known gap worth stating: the automatic per-workspace Knoweth lane is injected as
pre-context but explicit Knoweth searches query only the global and user lanes, so content filed
only in a workspace lane cannot be searched back. Until the harness requests configured lanes on
search, content stays in the global lane and separation comes from the folder plus a workspace tag
on every compiled page. The folders already match the lane shape, so that change is additive.

---

## The Meta parts in detail

- **Fires at install.** Right after this package installs, when a Meta workspace is
  connected, Runneth runs the Creative Attributes step and then the Account Context Brain
  autofill - silently, per `post-install.md` - persisting the scaffold and ending with
  "Are you ready to begin your onboarding?" The gap questions wait for the
  onboarding-walkthrough skill, which fires on a human's yes. Validation and Knoweth
  organize fire later from their own gates.

### Creative Attributes
File: `meta/meta-creative-attributes-playbook.md` (staged at `/agent/brain/meta-and-voc-onboarding/meta-creative-attributes-playbook.md`)

- **Job:** establish the creative content layer — one enriched record per active creative
  (identity, summary, hook, value props, transcript, AI tags) held in **Cacheth**, the local
  creative cache — and detect naming patterns, passing them to the Account Context Brain as
  pre-filled proposals.
- **Runs first.** Collects facts without interpreting them.
- **Persists to:** nothing. The provisional naming decode is a handoff to the Account Context
  Brain (Field 4), which owns it once confirmed and writes the operational decoder to
  `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json`. **No creative files** — nothing here writes
  per-creative content to the brain (Cacheth is the system of record; person-requested snapshot
  files are a separate, explicit ask).
- **Retrieval:** Knoweth pre-context injection first (matching creative chunks arrive in the
  turn automatically); when that is not enough, the local motion cache CLI
  (`motion cache search-summaries`, `motion cache get-creative`).
- **Maintenance:** the cache syncs itself; if the account's naming convention changes, the
  decode re-runs and routes through Field 4.

### Account Context Brain
File: `meta/meta-account-context-brain-onboarding-package.md` (staged at `/agent/brain/meta-and-voc-onboarding/meta-account-context-brain-onboarding-package.md`)

- **Job:** capture how the team interprets the account — what "best" means, which numbers to
  trust, how campaigns map to stages. Nine required fields confirmed with a person, plus
  Field 10 (the deck spec: reporting structure and marketing calendar, synthesized from
  confirmed fields) — it gates the validation deck, not the question loop.
- **Runs second.** Uses what the Creative Attributes step found (especially naming decode) as
  pre-populated proposals for confirmation, rather than starting cold. At install, only the
  autofill runs - silently; the presentation belongs to the Onboarding Walkthrough skill below.
- **Persists to:** `/agent/brain/<workspace>/data-sources/meta/account-context.md`, plus the operational naming decoder
  at `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json` when a convention is confirmed (Field 4 owns it).
- **Activation:** merges a read-before-performance guard into `/agent/user.md`.
- **Refresh:** monthly cadence plus structural-drift triggers, logged in
  `/agent/brain/<workspace>/data-sources/meta/_changelog.md`.

### Onboarding Walkthrough (skill)
Folder: `onboarding-walkthrough/`

- **Job:** the presentation layer of the Account Context Brain fill-in - the guided
  conversation that opens with the brand story and account findings, walks the field
  sections (tables where the data calls for them, the full naming breakdown always), and
  closes with the questions TLDR. Owns the required output schema; the ACB package owns the
  fields it presents. After the account-context questions, it proactively presents the
  Voice of Customer summary - one line per integration with item counts, product coverage,
  and dates ("Judge.me: 1,240 reviews across 6 products") - then explains what the Voice of
  Customer Audit entails and hands the person the manual trigger; the audit runs only on
  their yes.
- **Runs on demand - does not fire at install.** Post-install ends by asking "Are you ready
  to begin your onboarding?"; a yes (from anyone, in any conversation, whenever it comes)
  invokes this skill. Typically a CSM triggers it live on the onboarding call. An
  interrupted walkthrough resumes where it left off.
- **Installs to the skills root** (`/agent/.agents/skills/onboarding-walkthrough/`), not the
  brain - see the `onboarding-walkthrough-skill` resource in `package.json`.

### Meta Validation
File: `meta/meta-validation-onboarding-package.md` (staged at `/agent/brain/meta-and-voc-onboarding/meta-validation-onboarding-package.md`)

- **Job:** prove Runneth understood the account. The answer-and-confirm loop on the customer's
  starter questions (including the name-level probe: "show me all our [product] ads," with the
  filtered name level shown), the weekly deck build pre-filled from the Field 10 deck spec (no
  deck without it; questions-only customers never need it), lock-in (deck approval, refresh
  routine, Slack), and the MVCE gate.
- **Runs third, gated.** Starts only when all nine Account Context Brain fields are confirmed
  and the creative content layer resolves (creatives in Cacheth — or live content pulls where
  the sandbox cache feature is disabled; cache coverage, not files). Every correction in
  the loop heals the specific Account Context Brain field behind it — never move past a wrong
  answer.
- **Persists to:** `/agent/brain/<workspace>/data-sources/meta/validation.md` (confirmed answers, corrections, deck
  route, lock-in state, MVCE block).
- **Activation:** merges the `runneth:meta-validation-gate` guard block into `/agent/user.md`;
  once merged, the trigger fires on its own when the prerequisites are met.
- **Re-validation:** re-run the affected questions when the account changes in a way that could
  break an answer (new primary conversion event, naming-system change, new product line).

---

### Motion CLI Data-Query Guide (supporting reference)
File: `meta/motion-cli-data-query-guide.md` (staged at `/agent/brain/meta-and-voc-onboarding/motion-cli-data-query-guide.md`)

- **Job:** the canonical contract for how Runneth pulls Meta data through the `motion` CLI, so
  queries come out right on the first try. Every Meta step leans on it for its pulls.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

### Cacheth Command Reference (supporting reference)
File: `meta/cacheth-command-reference.md` (staged at `/agent/brain/meta-and-voc-onboarding/cacheth-command-reference.md`)

- **Job:** the canonical contract for querying the local creative cache through the
  `motion cache` CLI — all five commands with every flag, the full-record field layout, `jq`
  extraction recipes, and the retrieval priority order. The Creative Attributes playbook's
  compact contract points here for the detail.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

## VoC Data Pull (separate part, own folder)

Folder: `voc-data-pull/`

- **Job:** pull raw voice-of-customer data - product reviews, support conversations, surveys,
  community posts, and comments - from available VoC platforms into standardized files under
  `/agent/brain/<workspace>/data-sources/voc/<platform>/`, one file per item. Meta ad
  comments are the standard pull every onboarding gets: they land beside the other platform
  folders under `voc/meta-ad-comments/`, one file per creative carrying every comment on
  that creative (creative asset id, the creative's preview URL when the pull returns one,
  each comment's author, date, and platform, engagement, and the creative's total comment
  count). Recipes exist for
  Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped, Reviews.io, Gorgias, Intercom,
  Zendesk, Klaviyo, Attentive, Gong, Hotjar, Reddit, Discord, YouTube, and Meta ad comments
  (the authoritative table is the skill's Step 1) - but the scope is customer-voice data,
  not the recipe list: any other reachable VoC platform gets pulled live-adapted, no recipe
  needed. Any platform may be reachable by OAuth connection **or** a stored API key - the
  connection method is how the customer set it up, never a coverage limit.
- **Own scope rules.** The Meta-only scope rules above do not apply to this part; its
  boundaries live in `voc-data-pull/SKILL.md` (read-only against platforms, bounded
  12-month pulls, PII rules).
- **Does not create the audit.** The later Voice of Customer audit skill reads these raw files
  and writes `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. That file
  is intentionally absent during initial install and backfill.
- **Fires at install.** Right after this package installs, Runneth checks which VoC
  platforms the org can reach - `integrations status --app <slug>` for each known VoC
  platform slug (the skill's Step 1 table lists them) for OAuth connections **and** the
  stored secrets for every VoC platform (any of them may be key-stored instead of
  connected; Okendo and Stamped always are), plus the Motion connection for Meta ad
  comments - and runs the skill's "Set up the recurring sync" procedure for every reachable
  one: one daily routine per platform per workspace (`voc-sync-<workspace>-<platform>`, 6am) whose first run backfills
  and whose daily runs pull only new items. Platform accounts are org-level with no
  workspace tag, so setup starts by **pinning the account**: a human confirms which
  account belongs to this workspace (a lone connection may belong to a different
  workspace, or be genuinely shared - both are normal), and every pull afterwards
  addresses that exact account. The workspace's first fully covered backfill asks once
  whether the person wants a Voice of Customer Audit; it never runs the audit
  automatically. A platform connected later gets set up on ask - nothing runs just
  because a platform connects.
- **Installs to the skills root** (`/agent/.agents/skills/voc-data-pull/`), not the brain -
  see the `voc-data-pull-skill` resource in `package.json`.

---

## Voice of Customer Audit (skill, own folder)

Folder: `voc-audit/`

- **Job:** analyze synced reviews, support conversations, ad comments, community posts, and
  other customer voice into five creative-strategy buckets: pain points, trigger moments,
  addressable objections, transformations, and standout customer language. Products with at
  least 200 entries also receive evidence-backed personas.
- **Runs manually.** The first completed VoC backfill offers it once, and the onboarding
  walkthrough presents the per-integration Voice of Customer summary with the same offer;
  a yes or an explicit request such as "run a VoC audit" invokes the skill. Connecting a
  source, syncing files, or completing onboarding never runs it automatically. The audit
  requires at least 200 total entries.
- **Reads raw evidence from:** `/agent/brain/<workspace>/data-sources/voc/<platform>/`.
- **Persists compiled insight to:**
  `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. The skill rewrites this one
  canonical page on a person-approved rerun, cites raw items, and indexes it for validation
  and future customer-side WHY questions.
- **Installs to the skills root** (`/agent/.agents/skills/voc-audit/`), not the brain - see
  the `voc-audit-skill` resource in `package.json`. Its compiled output lives in the brain;
  the executable skill instructions do not.

---

## Meta Ad Performance Analysis (skill, own folder)

Folder: `meta-ad-performance-analysis/`

- **Job:** the diagnostic framework for reading Meta ad performance — one ad, a set of ads, or
  the account's ads in general. Identify the primary KPI first, judge efficiency (cost per KPI
  or ROAS) against the account's own averages, then trace the supporting metrics — first frame
  retention, thumbstop rate, hold rate, engagement, CTR outbound, conversion rate, AOV — to
  locate exactly where in the funnel an ad wins or loses. Across many ads: group by
  optimization goal, rank by primary-KPI efficiency, then diagnose the ads worth explaining.
  Account-agnostic: with one exception (first frame retention's 90% standard), everything is
  read against the account's own averages, never universal benchmarks.
- **Runs on demand - does not fire at install.** Triggered when someone asks how their ads —
  or one ad — are doing, why something is or isn't working, or to compare ads. Installing only
  stages the skill.
- **What it leans on:** the scope rules above apply in full. Interpretation (winner metric,
  targets, naming decode, spend floor) comes from `/agent/brain/<workspace>/data-sources/meta/account-context.md`,
  guard-enforced — never Motion workspace settings. Metrics are pulled live via the `motion`
  CLI per the Data-Query Guide and never stored; name filters go through the confirmed naming
  decode (Field 4 / `naming-decoder.json`); every pull names the workspace with
  `--workspace-id`; per-creative content stays in Cacheth. Customer-side WHY and
  what-to-make-next questions read the saved Voice of Customer Audit and its cited raw
  evidence. Analyses show their work: filter applied, signal read, what couldn't be confirmed.
- **Installs to the skills root** (`/agent/.agents/skills/meta-ad-performance-analysis/`), not
  the brain - see the `meta-ad-performance-analysis-skill` resource in `package.json`.

---

## After install: the package fires itself

**Run [`post-install.md`](post-install.md) the moment this package's files land - every
install, no exceptions.** Installing is the trigger - the manifest's `activation` package
instruction, the staged post-install doc, and this line all point at the same file, which
carries the executable install-time sequence (step 0 workspace resolution, reachability
check, VoC sync setup, guard
merges, Meta context steps). If the installing turn ends without running it (the package
manager itself never runs setup), the activation instruction fires it on the first turn
after install instead. The per-workspace `runneth:meta-voc-onboarded` roster in
`/agent/user.md` is the ran-already marker; guard presence alone only proves that some
workspace on the VM was onboarded.
The run order below is the human-readable description of the same lifecycle.

## Install and run order

1. **Install the package** with one `package install` call (see "How to install" above);
   never copy files by hand. Staging the files
   does not self-run anything - the post-install run right after it does. That run opens
   with step 0: it resolves the target workspace mechanically - `printenv MOTION_WORKSPACE_ID`
   for the id the runtime injected, the matching `motion workspaces` entry for the name -
   and states name, workspaceId, and slug before anything
   else executes. Nothing in this package writes per-creative files to the brain —
   creative content lives in Cacheth; its summary artifacts are surfaced through Knoweth.
2. **Set up VoC data syncs.** For each reachable customer-voice source, pin the workspace's
   account, create the daily `voc-sync-<workspace>-<platform>` routine, and kick the first
   backfill. When the workspace's first full backfill completes, offer the Voice of
   Customer Audit once; run it only if a person says yes.
3. **Creative Attributes (Meta Step 1).** Confirms the workspace scope, establishes the creative
   content layer (Cacheth + the query paths), detects naming patterns, and passes them to the
   Account Context Brain as provisional proposals. Writes nothing per-creative to the brain.
4. **Activate and run the Account Context Brain autofill (Meta Step 2).** Its guard block (staged at
   `guards/account-context-guard.md`) is merged into `/agent/user.md` by the post-install run's
   single guard merge; then the autofill runs silently and persists the scaffold, drawing on
   the Creative Attributes step (if it was run) for naming proposals and creative evidence.
   Post-install ends with "Are you ready to begin your onboarding?" - the onboarding-walkthrough
   skill presents the findings and collects the human answers on the yes.
5. **Activate and run Meta Validation (Meta Step 3).** Its validation-gate guard block (staged at
   `guards/meta-validation-gate.md`) is merged by the same post-install guard merge; once the
   Account Context Brain is fully confirmed and the creative content layer resolves,
   the gate opens the validation experience on its own: the answer-and-confirm loop, the weekly
   deck, lock-in, and the MVCE gate. When a Voice of Customer Audit exists, validation adds
   its customer-voice question and uses the audit in customer-side WHY answers. Onboarding is
   done when MVCE is on, not when data is connected.
5. **Set up the VoC data sync during post-install.** For each reachable VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure - it pins the workspace's
   account, creates the daily sync routine, and kicks the backfill in the background.
6. **Run the Voice of Customer audit later in onboarding.** Offered once after the workspace's
   first fully covered backfill and run only on a person's yes, the `voc-audit` skill compiles
   the workspace's cross-platform customer-voice findings to
   `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. It is not an
   install-time artifact.
7. **Organize with Knoweth (after the questions are answered).** Once the Account Context Brain is
   confirmed and data-source content has landed, organize the brain: keep shared content in the
   global lane and make it findable with tags and a naming decoder. Both the
   `runneth:knoweth-organize` and `runneth:knoweth-brain` guard blocks (staged at
   `guards/knoweth-organize.md` and `guards/knoweth-brain.md`) are merged into /agent/user.md by the
   post-install run's single guard merge, so the organize trigger fires and save-routing/maintenance stay on. Do not carve data-source-family or
   initiative lanes today; only global, the user lane, and the workspace lane are queried. See
   `knoweth/knoweth-organize-onboarding-package.md` (staged at
   `/agent/brain/meta-and-voc-onboarding/knoweth-organize-onboarding-package.md`).
8. **Keep everything current.** Creative content stays current through the Cacheth sync
   automatically. Account Context Brain on monthly cadence and structural-drift triggers. The
   weekly deck regenerates on the refresh routine agreed at lock-in. VoC data refreshes itself
   through its daily routines once set up.

---

## How the Meta parts relate

- Creative Attributes are the material. Account Context Brain is the lens. A performance question
  uses the Account Context Brain to decide what "best" means, then the creative attributes to
  reason about the specific creatives.
- Meta Validation is the catch. The first two steps are only proven when the customer confirms
  Runneth's answers and approves the deck built from them; every correction in the loop lands in
  the specific Account Context Brain field behind it, so validating and healing the context are
  the same motion.
- The dependency runs one way for interpretation: Account Context Brain is the authority on how
  to analyze. But the Creative Attributes step runs first because it supplies real evidence the
  Account Context Brain can draw on — naming patterns, campaign structure, creative volume.
- The Account Context Brain's read-before-performance guard forces the interpretation lens to load
  before any performance work. Creative summary artifacts are surfaced automatically through
  Knoweth when creatives are discussed (transcripts and AI tags via the `motion cache` CLI).
- **Naming decode is the handoff point.** The Creative Attributes step detects provisional naming patterns
  from ad names and passes them to the Account Context Brain as proposals. Account Context Brain
  confirms or corrects them in Field 4 — the single interpretation owner — and writes the
  operational decoder to `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json` (typed positions, query fields,
  filter patterns). Creative queries decode ad names through it at analysis time.
