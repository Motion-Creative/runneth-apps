# Meta Onboarding Package: Overview

This package teaches Runneth how to understand and work inside a customer's Meta ad account. It
ships as two parts that run in order.

The two parts:

- **Creative Attribution** - the per-creative facts Runneth works with.
- **Account Context Brain** - how Runneth analyzes those facts.

The one-line model:

> **The Creative Attribution gives Runneth the per-creative facts it needs. The Account Context
> Brain tells Runneth how to analyze them.**

Run them in this order. Creative Attribution first: it collects raw facts without interpreting
anything, and those facts give the Account Context Brain real material to work with. Account
Context Brain second: it confirms how the team judges performance, drawing on what the attribution
build found.

---

## Where the package files live

This folder holds one part per subfolder: `meta/` (the Creative Attribution playbook, the
Account Context Brain package, the Meta Validation package, the Motion CLI Data-Query
Guide, and the Cacheth Command Reference) and `voc-data-pull/` (the VoC Data Pull skill, recipes, and templates), plus `knoweth/` (the organize-the-brain part that runs after the questions). This README
covers all of them; `install-config.json` maps every file to its installed location.

These instruction files are the package itself, not its output. They live in the brain
outside the `meta` folder structure. The brain's `meta` folder holds only what Runneth
generates from running them: the filled account context (which carries the confirmed naming
decode). Per-creative content lives in Cacheth (the local creative cache); nothing in this
package writes it to brain files.

---

## Scope rules (apply to both parts)

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

## The two parts

### Creative Attribution
File: `meta/meta-creative-attribution-playbook.md`

- **Job:** establish the creative content layer — one enriched record per active creative
  (identity, summary, hook, value props, transcript, AI tags) held in **Cacheth**, the local
  creative cache — and detect naming patterns, passing them to the Account Context Brain as
  pre-filled proposals.
- **Runs first.** Collects facts without interpreting them.
- **Persists to:** nothing. The provisional naming decode is a handoff to the Account Context
  Brain (Field 4), which owns it once confirmed. **No creative files** — nothing here writes
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
  trust, how campaigns map to stages. Nine required fields confirmed with a person.
- **Runs second.** Uses what the Creative Attribution found (especially naming decode) as
  pre-populated proposals for confirmation, rather than starting cold.
- **Persists to:** `/agent/brain/meta/account-context.md`
- **Activation:** merges a read-before-performance guard into `/agent/user.md`.
- **Refresh:** monthly cadence plus structural-drift triggers, logged in
  `/agent/brain/meta/_changelog.md`.

---

### Motion CLI Data-Query Guide (supporting reference)
File: `meta/motion-cli-data-query-guide.md`

- **Job:** the canonical contract for how Runneth pulls Meta data through the `motion` CLI, so
  queries come out right on the first try. Both parts lean on it for their pulls.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

### Cacheth Command Reference (supporting reference)
File: `meta/cacheth-command-reference.md`

- **Job:** the canonical contract for querying the local creative cache through the
  `motion cache` CLI — all five commands with every flag, the full-record field layout, `jq`
  extraction recipes, and the retrieval priority order. The Creative Attribution playbook's
  compact contract points here for the detail.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

## VoC Data Pull (separate part, own folder)

Folder: `voc-data-pull/`

- **Job:** pull raw voice-of-customer data - product reviews, support conversations, community
  posts, and ad comments - from available VoC platforms (Judge.me, Trustpilot, Yotpo, Junip,
  Gorgias, Intercom, Reddit, Okendo, Stamped - reachable by OAuth connection, stored API key,
  or Motion native alike) into standardized files under
  `/agent/brain/data-sources/voc/<platform>/`, one file per item.
- **Own scope rules.** The Meta-only scope rules above do not apply to this part; its
  boundaries live in `voc-data-pull/SKILL.md` (read-only against platforms, bounded
  12-month pulls, PII rules).
- **Manually triggered, like everything here.** Installing stages the skill only. When the
  onboarding run (or a person) asks to set up the VoC data sync, Runneth runs the skill's
  "Set up the recurring sync" procedure: one daily routine per connected platform
  (`voc-sync-<platform>`, 6am) whose first run backfills and whose daily runs pull only new
  items. Nothing runs just because a platform is connected.
- **Installs to the skills root** (`/agent/.agents/skills/voc-data-pull/`), not the brain -
  see the install entries in `install-config.json`.

---

## Install and run order

1. **Install the package.** Staging the files does not self-run anything. Nothing in this
   package writes per-creative files to the brain — creative content lives in Cacheth and is
   surfaced through Knoweth.
2. **Creative Attribution (Step 1).** Confirms the workspace scope, establishes the creative
   content layer (Cacheth + the query paths), detects naming patterns, and passes them to the
   Account Context Brain as provisional proposals. Writes nothing per-creative to the brain.
3. **Activate and run the Account Context Brain (Step 2).** Merge the guard block into
   `/agent/user.md`, then run the fill-in. Confirms how the team judges performance, drawing on
   the attribution build (if one was requested) for naming proposals and creative evidence.
4. **Set up the VoC data sync (when asked).** For each connected VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure - it creates the daily sync
   routine and kicks the backfill in the background.
5. **Organize with Knoweth (after the questions are answered).** Once the Account Context Brain is
   confirmed and data-source content has landed, organize the brain: keep shared content in the
   global lane and make it findable with tags and a naming decoder, and merge both the
   `runneth:knoweth-organize` and `runneth:knoweth-brain` guard blocks into /agent/user.md (per the
   MERGE INSTRUCTIONS in that doc) so the organize trigger fires and save-routing/maintenance stay on. Do not carve data-source-family or
   initiative lanes today; only global, the user lane, and the workspace lane are queried. See
   knoweth/knoweth-organize-onboarding-package.md.
6. **Keep everything current.** Creative content stays current through the Cacheth sync
   automatically. Account Context Brain on monthly cadence and structural-drift triggers. VoC
   data refreshes itself through its daily routines once set up.

---

## How the two parts relate

- Creative Attribution is the material. Account Context Brain is the lens. A performance question
  uses the Account Context Brain to decide what "best" means, then the Creative Attribution to
  reason about the specific creatives.
- The dependency runs one way for interpretation: Account Context Brain is the authority on how
  to analyze. But Creative Attribution runs first because it supplies real evidence the Account
  Context Brain can draw on — naming patterns, campaign structure, creative volume.
- The Account Context Brain's read-before-performance guard forces the interpretation lens to load
  before any performance work. The Creative Attribution is surfaced automatically through Knoweth
  when creatives are discussed.
- **Naming decode is the handoff point.** Creative Attribution detects provisional naming patterns
  from ad names and passes them to the Account Context Brain as proposals. Account Context Brain
  confirms or corrects them in Field 4. Once confirmed, the decode lives in the Account Context
  Brain — the single owner — and creative queries decode ad names through it at analysis time.
