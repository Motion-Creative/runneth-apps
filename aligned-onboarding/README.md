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

These instruction files (this overview, the Creative Attribution playbook, the Account Context
Brain package, and the Motion CLI Data-Query Guide) are the package itself, not its output. They
live in the brain outside the `meta` folder structure. The `meta` folder holds only what Runneth
generates from running them: the per-creative attribution files and the filled account context.

---

## Scope rules (apply to both parts)

- **Meta only.** Never look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta ad data and
  customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <id>`.
- **Attribution files are customer-facing account content.** Only creative facts belong in them.
  Never save internal notes, CLI commands, or debugging mechanics.

---

## The two parts

### Creative Attribution
File: `meta-creative-attribution-playbook.md`

- **Job:** build and maintain one enriched record per active creative — identity, summary, hook,
  value props, transcript, AI tags, naming. The per-creative facts Runneth uses for every analysis
  the Account Context Brain defines.
- **Runs first.** Collects facts without interpreting them. Detects naming patterns provisionally
  and passes them to the Account Context Brain as pre-filled proposals.
- **Persists to:** individual creative Markdown files under `/agent/brain/meta/creatives/`, plus
  an optional tagging taxonomy at `/agent/brain/meta/creatives/_tagging-taxonomy.md`.
- **Retrieval:** automatic through Knoweth. Writing the file is the index step.
- **Maintenance:** daily and event-triggered.
- **Staging deployment note:** in staging, per-creative summaries live in **Cacheth** and are
  surfaced through **Knoweth**. Never run this playbook automatically: do not auto-pull creatives
  and store summary files in the brain. It runs only on an explicit request from a person.

### Account Context Brain
File: `meta-account-context-brain-onboarding-package.md`

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
File: `motion-cli-data-query-guide.md`

- **Job:** the canonical contract for how Runneth pulls Meta data through the `motion` CLI, so
  queries come out right on the first try. Both parts lean on it for their pulls.
- **Not run on its own.** Reference only, not a step to execute. Brand-agnostic; carries no
  account-specific IDs.

---

## Install and run order

1. **Install the package.** Staging the files does not self-run anything. In particular, nothing
   in this package may auto-grab creatives and store them in the brain with summaries; in staging,
   summaries live in Cacheth and are surfaced through Knoweth.
2. **Creative Attribution (Step 1) — explicit request only.** When a person asks for it, builds
   the per-creative attribution files, detects naming patterns, and passes them to the Account
   Context Brain as provisional proposals. Never run automatically as part of install or
   onboarding.
3. **Activate and run the Account Context Brain (Step 2).** Merge the guard block into
   `/agent/user.md`, then run the fill-in. Confirms how the team judges performance, drawing on
   the attribution build (if one was requested) for naming proposals and creative evidence.
4. **Keep both current.** Creative Attribution maintenance (daily and event-triggered) applies
   only where the attribution build was explicitly requested. Account Context Brain on monthly
   cadence and structural-drift triggers.

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
  confirms or corrects them in Field 4. Once confirmed, the naming decode is re-projected onto
  the creative files.
