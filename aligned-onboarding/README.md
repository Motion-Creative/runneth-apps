# Aligned Onboarding Package: Overview

This is the onboarding bundle for a customer's brain. Installing it is the trigger: the
install conversation stages this folder's files to their destinations on the VM with one
`package install` call (per `package.json`, the package manifest - skill files to the
skills root, docs to `/agent/brain/aligned-onboarding/`) and immediately runs the package
for everything the org already has connected (see "After install" below); routines and
guard blocks keep it current afterward. Its parts do two jobs, in order: **land the data** (VoC pulls into brain
files, the creative layer in Cacheth), then **teach the interpretation** (Account Context
Brain, Validation) - with Knoweth organizing the result so retrieval stays tight.

The parts, and their operational nature:

- **VoC Data Pull** - background: setup once, daily routines do the work.
- **Creative Attributes** - establishes the creative layer (Cacheth) and naming detection.
- **Account Context Brain** - human-gated interview; autofill first, gap questions to a person.
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
Guide, and the Cacheth Command Reference) and `voc-data-pull/` (the VoC Data Pull skill, recipes, and templates), plus `knoweth/` (the organize-the-brain part that runs after the questions), `meta-ad-performance-analysis/` (the single-ad performance analysis skill), and `guards/` (the four ready-made `/agent/user.md` guard blocks that post-install merges). This README
covers all of them; `package.json` (the package manifest) maps every file to its installed location.

### How to install (exact procedure)

Never copy files by hand - the package manager stages everything in one call:

1. If you were given a pull-request URL, resolve it to its head branch first:
   `gh pr view <pr-url> --json headRefName`.
2. Run: `package install https://github.com/Motion-Creative/runneth-apps/tree/<branch>/aligned-onboarding`
3. The moment the install succeeds, run [`post-install.md`](post-install.md)
   (staged at `/agent/brain/aligned-onboarding/post-install.md`) in the same conversation.

These instruction files are the package itself, not its output. They live in the brain
outside the `meta` folder structure. The brain's `meta` folder holds only what Runneth
generates from running them: the filled account context (which carries the confirmed naming
decode). Per-creative content lives in Cacheth (the local creative cache); nothing in this
package writes it to brain files.

---

## Scope rules (apply to every Meta step)

- **Meta only.** Never look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta ad data and
  customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <id>`.
- **Brain files are customer-facing account content.** Only account facts belong in them.
  Never save internal notes, CLI commands, or debugging mechanics. Per-creative content lives
  in Cacheth; it goes into a brain file only when a person explicitly asks, as a dated snapshot
  (the cache stays the source of truth for current facts).

---

## The Meta parts in detail

- **Fires at install.** Right after this package installs, when a Meta workspace is
  connected, Runneth runs the Creative Attributes step and then the Account Context Brain
  interview (autofill first, then the gap questions a human must answer) - per
  `post-install.md`. Validation and Knoweth organize fire later from their own gates.

### Creative Attributes
File: `meta/meta-creative-attributes-playbook.md`

- **Job:** establish the creative content layer — one enriched record per active creative
  (identity, summary, hook, value props, transcript, AI tags) held in **Cacheth**, the local
  creative cache — and detect naming patterns, passing them to the Account Context Brain as
  pre-filled proposals.
- **Runs first.** Collects facts without interpreting them.
- **Persists to:** nothing. The provisional naming decode is a handoff to the Account Context
  Brain (Field 4), which owns it once confirmed and writes the operational decoder to
  `/agent/brain/meta/naming-decoder.json`. **No creative files** — nothing here writes
  per-creative content to the brain (Cacheth is the system of record; person-requested snapshot
  files are a separate, explicit ask).
- **Retrieval:** Knoweth pre-context injection first (matching creative chunks arrive in the
  turn automatically); when that is not enough, the local motion cache CLI
  (`motion cache search-summaries`, `motion cache get-creative`).
- **Maintenance:** the cache syncs itself; if the account's naming convention changes, the
  decode re-runs and routes through Field 4.

### Account Context Brain
File: `meta/meta-account-context-brain-onboarding-package.md`

- **Job:** capture how the team interprets the account — what "best" means, which numbers to
  trust, how campaigns map to stages. Nine required fields confirmed with a person, plus
  Field 10 (the deck spec: reporting structure and marketing calendar, synthesized from
  confirmed fields) — it gates the validation deck, not the question loop.
- **Runs second.** Uses what the Creative Attributes step found (especially naming decode) as
  pre-populated proposals for confirmation, rather than starting cold.
- **Persists to:** `/agent/brain/meta/account-context.md`, plus the operational naming decoder
  at `/agent/brain/meta/naming-decoder.json` when a convention is confirmed (Field 4 owns it).
- **Activation:** merges a read-before-performance guard into `/agent/user.md`.
- **Refresh:** monthly cadence plus structural-drift triggers, logged in
  `/agent/brain/meta/_changelog.md`.

### Meta Validation
File: `meta/meta-validation-onboarding-package.md`

- **Job:** prove Runneth understood the account. The answer-and-confirm loop on the customer's
  starter questions (including the name-level probe: "show me all our [product] ads," with the
  filtered name level shown), the weekly deck build pre-filled from the Field 10 deck spec (no
  deck without it; questions-only customers never need it), lock-in (deck approval, refresh
  routine, Slack), and the MVCE gate.
- **Runs third, gated.** Starts only when all nine Account Context Brain fields are confirmed
  and the workspace's creatives are in Cacheth (cache coverage, not files). Every correction in
  the loop heals the specific Account Context Brain field behind it — never move past a wrong
  answer.
- **Persists to:** `/agent/brain/meta/validation.md` (confirmed answers, corrections, deck
  route, lock-in state, MVCE block).
- **Activation:** merges the `runneth:meta-validation-gate` guard block into `/agent/user.md`;
  once merged, the trigger fires on its own when the prerequisites are met.
- **Re-validation:** re-run the affected questions when the account changes in a way that could
  break an answer (new north-star metric, naming-system change, new product line).

---

### Motion CLI Data-Query Guide (supporting reference)
File: `meta/motion-cli-data-query-guide.md`

- **Job:** the canonical contract for how Runneth pulls Meta data through the `motion` CLI, so
  queries come out right on the first try. Every Meta step leans on it for its pulls.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

### Cacheth Command Reference (supporting reference)
File: `meta/cacheth-command-reference.md`

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
  `/agent/brain/data-sources/voc/<platform>/`, one file per item. Recipes exist for
  Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped, Reviews.io, Gorgias, Intercom,
  Zendesk, Klaviyo, Attentive, Gong, Hotjar, Reddit, Discord, YouTube, and Meta ad comments
  (the authoritative table is the skill's Step 1) - but the scope is customer-voice data,
  not the recipe list: any other reachable VoC platform gets pulled live-adapted, no recipe
  needed. Any platform may be reachable by OAuth connection **or** a stored API key - the
  connection method is how the customer set it up, never a coverage limit.
- **Own scope rules.** The Meta-only scope rules above do not apply to this part; its
  boundaries live in `voc-data-pull/SKILL.md` (read-only against platforms, bounded
  12-month pulls, PII rules).
- **Fires at install.** Right after this package installs, Runneth checks which VoC
  platforms the org can reach - `integrations status` for OAuth connections **and** the
  stored secrets for every VoC platform (any of them may be key-stored instead of
  connected; Okendo and Stamped always are), plus the Motion connection for Meta ad
  comments - and runs the skill's "Set up the recurring sync" procedure for every reachable
  one: one daily routine per platform (`voc-sync-<platform>`, 6am) whose first run backfills
  and whose daily runs pull only new items. A platform connected later gets set up on ask -
  nothing runs just because a platform connects.
- **Installs to the skills root** (`/agent/.agents/skills/voc-data-pull/`), not the brain -
  see the `voc-data-pull-skill` resource in `package.json`.

---

## Meta Ad Performance Analysis (skill, own folder)

Folder: `meta-ad-performance-analysis/`

- **Job:** the diagnostic framework for reading a single ad's performance. Identify the ad's
  primary KPI first, judge efficiency (cost per KPI or ROAS) against the account's own
  averages, then trace the supporting metrics — first frame retention, thumbstop rate, hold
  rate, engagement, CTR outbound, conversion rate, AOV — to locate exactly where in the funnel
  the ad wins or loses. Account-agnostic: with one exception (first frame retention's 90%
  standard), everything is read against the account's own averages, never universal benchmarks.
- **Runs on demand - does not fire at install.** Triggered when someone asks how an ad is
  doing, why it is or isn't working, or to compare ads. Installing only stages the skill.
- **What it leans on:** the scope rules above apply in full. Interpretation (winner metric,
  targets, naming decode, spend floor) comes from `/agent/brain/meta/account-context.md`,
  guard-enforced — never Motion workspace settings. Metrics are pulled live via the `motion`
  CLI per the Data-Query Guide and never stored; name filters go through the confirmed naming
  decode (Field 4 / `naming-decoder.json`); every pull names the workspace with
  `--workspace-id`; per-creative content stays in Cacheth. Analyses show their work: filter
  applied, signal read, what couldn't be confirmed.
- **Installs to the skills root** (`/agent/.agents/skills/meta-ad-performance-analysis/`), not
  the brain - see the `meta-ad-performance-analysis-skill` resource in `package.json`.

---

## After install: the package fires itself

**Run [`post-install.md`](post-install.md) the moment this package's files land - every
install, no exceptions.** Installing is the trigger - the manifest's `activation` package
instruction, the staged post-install doc, and this line all point at the same file, which
carries the executable install-time sequence (reachability check, VoC sync setup, guard
merges, Meta context steps). The run order below is the human-readable description of the
same lifecycle.

## Install and run order

1. **Install the package** with one `package install` call (see "How to install" above);
   never copy files by hand. Staging the files does not self-run anything - the post-install
   run right after it does. Nothing in this package writes per-creative files to the brain —
   creative content lives in Cacheth and is surfaced through Knoweth.
2. **Creative Attributes (Step 1).** Confirms the workspace scope, establishes the creative
   content layer (Cacheth + the query paths), detects naming patterns, and passes them to the
   Account Context Brain as provisional proposals. Writes nothing per-creative to the brain.
3. **Activate and run the Account Context Brain (Step 2).** Its guard block (staged at
   `guards/account-context-guard.md`) is merged into `/agent/user.md` by the post-install run's
   single guard merge; then run the fill-in. Confirms how the team judges performance, drawing on
   the Creative Attributes step (if it was run) for naming proposals and creative evidence.
4. **Activate and run Meta Validation (Step 3).** Its validation-gate guard block (staged at
   `guards/meta-validation-gate.md`) is merged by the same post-install guard merge; once the
   Account Context Brain is fully confirmed and the cache has synced,
   the gate opens the validation experience on its own: the answer-and-confirm loop, the weekly
   deck, lock-in, and the MVCE gate. Onboarding is done when MVCE is on, not when data is
   connected.
5. **Set up the VoC data sync (when asked).** For each available VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure - it creates the daily sync
   routine and kicks the backfill in the background.
6. **Organize with Knoweth (after the questions are answered).** Once the Account Context Brain is
   confirmed and data-source content has landed, organize the brain: keep shared content in the
   global lane and make it findable with tags and a naming decoder. Both the
   `runneth:knoweth-organize` and `runneth:knoweth-brain` guard blocks (staged at
   `guards/knoweth-organize.md` and `guards/knoweth-brain.md`) are merged into /agent/user.md by the
   post-install run's single guard merge, so the organize trigger fires and save-routing/maintenance stay on. Do not carve data-source-family or
   initiative lanes today; only global, the user lane, and the workspace lane are queried. See
   knoweth/knoweth-organize-onboarding-package.md.
7. **Keep everything current.** Creative content stays current through the Cacheth sync
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
  before any performance work. Creative attributes are surfaced automatically through Knoweth
  when creatives are discussed.
- **Naming decode is the handoff point.** The Creative Attributes step detects provisional naming patterns
  from ad names and passes them to the Account Context Brain as proposals. Account Context Brain
  confirms or corrects them in Field 4 — the single interpretation owner — and writes the
  operational decoder to `/agent/brain/meta/naming-decoder.json` (typed positions, query fields,
  filter patterns). Creative queries decode ad names through it at analysis time.
