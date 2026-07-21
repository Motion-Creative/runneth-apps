# Meta Onboarding Package: Overview

This package teaches Runneth how to understand and work inside a customer's Meta ad account. It
ships as two parts that live side by side. Install and run them in order.

The two parts:

- **Account Context Brain** - how Runneth should analyze this account.
- **Creative Corpus** - the per-creative attributes Runneth analyzes.

The one-line model:

> **The Account Context Brain tells Runneth how to analyze the account. The Creative Corpus gives
> Runneth the per-creative attributes it needs to actually do the job.**

The Creative Corpus depends on the Account Context Brain and never re-derives it. Keep them as two
files: they do different jobs, persist to different places, and refresh on different cadences.

---

## Where the package files live

These instruction files (this overview, the Account Context Brain, the Creative Corpus, and the
Motion CLI Data-Query Guide) are the package itself, not its output. They live in the Brain outside
the `meta` folder structure; the exact folder for them is not fixed yet and can be decided later.
corpus-search is a bundled tool, not an instruction file, and installs under
`/agent/tools/corpus-search/`. The `meta` folder holds only what Runneth generates from running the
package: the filled account context and the per-creative files.

---

## Scope rules (apply to both parts)

- **Meta only.** Never look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta ad data, the
  worksheet, and customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <id>`.
- **Brain files are customer-facing.** Only account interpretation goes into the saved files. Never
  save internal Runneth-team content: tool-calling nuances, CLI commands or flags,
  command-vs-command discrepancies, or debugging notes. Metric nuances about how a metric shows up
  in this account are welcome, written in business terms.
- **Onboarding pull window.** The fill-in auto-pulls default to `last_365d` so onboarding sees
  enough history. This governs the fill-in only, not later performance queries.

---

## The two parts

### Account Context Brain
File: `account-context-brain.md`

- **Job:** capture how the team interprets the account, so rankings, "best ad" calls, and insights
  match how they actually think. Nine required context fields (sources of truth, conversion
  hierarchy, metric gotchas, naming, attribution, account structure, funnel map, creative metrics,
  targets).
- **How it runs:** auto-pull, then confirm with a person, then validate, then flag what it cannot
  capture. `[AUTO]` values are proposals until a person confirms them.
- **Persists to:** `/agent/brain/meta/account-context.md` (create the `meta` folder if needed)
- **Activation:** merges a read-before-performance guard into `/agent/user.md`.
- **Refresh:** monthly cadence plus structural-drift triggers, logged in
  `/agent/brain/meta/_changelog.md`.

### Creative Corpus
File: `creative-corpus-playbook.md`

- **Job:** build and maintain one enriched record per active creative (identity, summary, hook,
  value props, transcript, AI tags, naming), the attributes Runneth uses to do the analysis the
  Account Context Brain defines.
- **How it runs:** reads what the Account Context Brain already knows, then pulls from Motion only
  what the Account Context Brain cannot tell it (the creative content itself). No separate corpus
  tool to install.
- **Persists to:** individual creative Markdown files under `/agent/brain/meta/creatives/`, plus an
  optional tagging taxonomy at `/agent/brain/meta/creatives/_tagging-taxonomy.md`.
- **Retrieval:** automatic through Knoweth. Writing the file is the index step.
- **Maintenance:** daily and event-triggered updates as creatives change.

---

### Motion CLI Data-Query Guide (supporting reference)
File: `motion-cli-data-query-guide.md`

- **Job:** the canonical contract for how Runneth pulls Meta, TikTok, Inspo, benchmark, and
  workspace-setup data through the `motion` CLI, so queries come out right on the first try. Both
  parts above lean on it for their auto-pulls.
- **Not run on its own.** It's reference knowledge, not a step to execute. It is brand-agnostic and
  carries no account-specific IDs.

### corpus-search (bundled tool)
Source: `Motion-Creative/runneth-apps/corpus-search`

The package ships with **corpus-search**, a local hybrid-retrieval CLI, to **supplement** Knoweth
(not replace it). Knoweth stays the default: everything written under `/agent/brain/` is surfaced
automatically as pre-context. Reach for corpus-search when you need deliberate, filterable search
over a lot of raw text.

**corpus-search is a general raw-text retrieval layer, not a creative-only tool.** The Creative
Corpus is one source it indexes; it is meant to hold any high-volume raw text the brain accumulates,
with customer reviews and voice-of-customer as primary use cases, alongside transcripts, notes, and
similar. Everything shares one index, kept separate by the `kind` tag (`creative`, `review`,
`voice-of-customer`, `transcript`, and so on), so you can search within a type or across all of them.

- **Install:** stage it under `/agent/tools/corpus-search/`, then run
  `bash /agent/tools/corpus-search/install.sh` and resolve its checklist.
- **Requires `OPENAI_API_KEY`** reachable in the workspace for embeddings. If the checklist flags it
  as missing, request it securely (host `api.openai.com`), never pasted into chat. Some workspaces
  pre-provision it.
- **Register sources by kind:** for this package, add `/agent/brain/meta/creatives` to
  corpus-search's `sources.json` with `kind: creative`. Register other raw-text folders (reviews,
  voice-of-customer, transcripts) the same way under their own `kind` so `refresh` keeps them all
  current. Give each indexed file frontmatter (`brand`, `workspace`, `source_id`, and `event_at`
  where it applies) so corpus-search can filter and dedupe on it.

---

## Install and run order

1. **Install the package.** Staging the files does not self-run anything.
2. **Activate the Account Context Brain.** Merge its guard block into `/agent/user.md`.
3. **Run the Account Context Brain fill-in.** Auto-pull, confirm with a person, validate, flag
   gaps. This writes `/agent/brain/meta/account-context.md`.
4. **Install corpus-search.** Run `bash /agent/tools/corpus-search/install.sh`, resolve its
   checklist (including `OPENAI_API_KEY`), and register `/agent/brain/meta/creatives` as a source
   with `kind: creative`. One-time; can happen before or after the corpus is built.
5. **Build the Creative Corpus.** With the Account Context Brain in place, generate the per-creative
   attribute files (each with its frontmatter). The Creative Corpus reads the Account Context Brain
   for interpretation. Then index the folder into corpus-search so filterable search is available.
6. **Keep both current.** The Account Context Brain on its refresh cadence, the Creative Corpus on
   daily and event-triggered maintenance, and refresh the corpus-search index on that same cadence.

---

## How the two parts relate

- The Account Context Brain is the lens; the Creative Corpus is the material. A performance question
  uses the Account Context Brain to decide what "best" means and which numbers to trust, then the
  Creative Corpus to reason about the specific creatives.
- The Account Context Brain's read-before-performance guard is what forces the lens to be loaded
  before any performance work. The Creative Corpus is surfaced automatically through Knoweth when
  creatives are discussed.
- The dependency runs one way: the Creative Corpus reads the Account Context Brain. The Account
  Context Brain never depends on the Creative Corpus.
