# Meta Onboarding Package: Overview

This package teaches Runneth how to understand and work inside a customer's Meta ad account. It
ships as three parts that live side by side. Install and run them in order.

The three parts:

- **Account Context Brain** - how Runneth should analyze this account.
- **Report Dashboard Setup** - how this customer wants report, dashboard, and app readouts built.
- **Creative Corpus** - the per-creative attributes Runneth analyzes.

The one-line model:

> **The Account Context Brain tells Runneth how to analyze the account. The Report Dashboard Setup
> tells Runneth how to package that analysis for this customer. The Creative Corpus gives Runneth the
> per-creative attributes it needs to actually do the job.**

Report Dashboard Setup and Creative Corpus both depend on the Account Context Brain and never
re-derive it. Keep them as separate files: they do different jobs, persist to different places, and
refresh on different cadences.

---

## Where the package files live

These instruction files (this overview, the Account Context Brain, the Report Dashboard Setup, the
Creative Corpus, and the Motion CLI Data-Query Guide) are the package itself, not its output. They
live in the Brain outside the `meta` folder structure at `/agent/brain/aligned-onboarding/`.
corpus-search is an optional companion tool, not an instruction file, and installs under
`/agent/tools/corpus-search/` when needed. The `meta` folder holds only what Runneth generates from
running the package: the filled account context, the report/dashboard setup context, and the
per-creative files.

---

## Scope rules (apply to all three parts)

- **Meta only.** Never look for or pull other ad platforms (TikTok, LinkedIn, YouTube).
- **Ignore Motion workspace settings.** Treat workspace goal, preferred KPI, spend threshold, and
  attribution config as if they do not exist. Everything comes from auto-pulled Meta ad data, the
  worksheet, and customer confirmation.
- **One workspace at a time.** Every auto-pull names the account with `--workspace-id <id>`.
- **Brain files are customer-facing.** Saved outputs hold account interpretation, report/dashboard
  preferences, and creative attributes. Never save internal Runneth-team content: tool-calling
  nuances, CLI commands or flags, command-vs-command discrepancies, or debugging notes. Metric
  nuances about how a metric shows up in this account are welcome, written in business terms.
- **Customer setup belongs in the Brain.** Report/dashboard preferences, saved-report trust rules,
  taxonomy, delivery cadence, and visual standards are customer-owned setup. They should be visible
  and editable in `/agent/brain/meta/report-dashboard-context.md`, not hidden in runtime config.
- **Onboarding pull window.** The fill-in auto-pulls default to `last_365d` so onboarding sees
  enough history. This governs the fill-in only, not later performance queries.

---

## The three parts

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

### Report Dashboard Setup
File: `report-dashboard-setup.md`

- **Job:** capture how this customer wants Runneth to build report, dashboard, app, and weekly-readout
  surfaces so they do not repeat the same preferences every time. It covers standard views, trusted
  sources, metrics, thresholds, date windows, taxonomy, creative evidence, visual standards, cadence,
  and validation questions.
- **How it runs:** reads the Account Context Brain first, inspects any saved Motion report metadata
  and existing app/routine registry entries when available, then asks a short confirmation with a
  person. It captures only customer-facing preferences and labels uncertain items as open.
- **Persists to:** `/agent/brain/meta/report-dashboard-context.md`
- **Activation:** extends the account-context guard with a read-before-reporting rule.
- **Refresh:** after reporting setup calls, when saved Motion reports change, or when a built
  dashboard gets corrected by the team. Log updates in `/agent/brain/meta/_changelog.md`.

### Creative Corpus
File: `creative-corpus-playbook.md`

- **Job:** build and maintain one enriched record per active creative (identity, summary, hook,
  value props, transcript, AI tags, naming), the attributes Runneth uses to do the analysis the
  Account Context Brain defines.
- **How it runs:** reads what the Account Context Brain already knows, then pulls from Motion only
  what the Account Context Brain cannot tell it (the creative content itself). Knoweth picks up the
  files automatically; corpus-search can be installed as the optional filterable supplement.
- **Persists to:** individual creative Markdown files under `/agent/brain/meta/creatives/`, plus an
  optional tagging taxonomy at `/agent/brain/meta/creatives/_tagging-taxonomy.md`.
- **Retrieval:** automatic through Knoweth. Writing the file is the index step.
- **Maintenance:** daily and event-triggered updates as creatives change.

---

### Motion CLI Data-Query Guide (supporting reference)
File: `motion-cli-data-query-guide.md`

- **Job:** the canonical contract for how Runneth pulls Meta, TikTok, Inspo, benchmark, and
  workspace-setup data through the `motion` CLI, so queries come out right on the first try. The
  package procedures lean on it for their auto-pulls.
- **Not run on its own.** It's reference knowledge, not a step to execute. It is brand-agnostic and
  carries no account-specific IDs.

### corpus-search (optional companion tool)
Source: `Motion-Creative/runneth-apps/corpus-search`

The package reuses **corpus-search**, a local hybrid-retrieval CLI, to **supplement** Knoweth (not
replace it). Knoweth stays the default: everything written under `/agent/brain/` is surfaced
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
4. **Run Report Dashboard Setup.** Read `/agent/brain/meta/account-context.md`, capture the team's
   reporting preferences, write `/agent/brain/meta/report-dashboard-context.md`, and index it in
   `/agent/INDEX.md`.
5. **Install corpus-search.** Run `bash /agent/tools/corpus-search/install.sh`, resolve its
   checklist (including `OPENAI_API_KEY`), and register `/agent/brain/meta/creatives` as a source
   with `kind: creative`. One-time; can happen before or after the corpus is built.
6. **Build the Creative Corpus.** With the Account Context Brain in place, generate the per-creative
   attribute files (each with its frontmatter). The Creative Corpus reads the Account Context Brain
   for interpretation and the Report Dashboard Setup when report surfaces need creative evidence
   rules. Then index the folder into corpus-search so filterable search is available.
7. **Keep all three current.** The Account Context Brain on its refresh cadence, Report Dashboard
   Setup when report preferences or saved reports change, the Creative Corpus on daily and
   event-triggered maintenance, and refresh the corpus-search index on that same cadence.

---

## How the three parts relate

- The Account Context Brain is the lens, Report Dashboard Setup is the packaging rulebook, and the
  Creative Corpus is the material. A dashboard request uses the Account Context Brain to decide what
  "best" means, Report Dashboard Setup to decide which view, metric order, thresholds, and evidence
  belong on the surface, then the Creative Corpus to reason about the specific creatives.
- The Account Context Brain's read-before-performance guard is what forces the lens to be loaded
  before any performance work. Report Dashboard Setup adds the read-before-reporting preferences.
  The Creative Corpus is surfaced automatically through Knoweth when creatives are discussed.
- The dependency runs one way: Report Dashboard Setup and Creative Corpus read the Account Context
  Brain. The Account Context Brain never depends on the other two.
