# Aligned Onboarding changelog

Repo-side history of the package. Not staged to the VM.

## 2.8.4 - 2026-07-26

Guard merge rewritten for how the VM actually works: `/agent/user.md` is walled off from
Bash (reads and writes both refused), so the scripted python pass is gone. The merge is now
one file-write-tool Write composed from the system-prompt copy of user.md plus the four
staged guard files (byte-for-byte, workspaceId substituted), with a mandatory pre-write
check that the base document's opening heading and each sentinel pair appear exactly once -
the v2.8.2 fallback silently doubled the entire base document and the purge couldn't undo
it. A connected Meta workspace now explicitly counts as a reachable VoC platform (ad
comments via `motion meta creative-comments`, slug `meta-ads`), so `voc-sync-meta-ads` is
always created alongside the other routines. Account Context autofill must persist its
results - terse facts written to the brain file before stopping at the gap questions;
long-form write-ups and INDEX.md updates wait for the turn where the answers arrive.

## 2.8.3 - 2026-07-26

The package is now a real indexed package: registered in the repo root `package-index.json`
(source `backend-github` at `main`, `installPolicy: manual`, `updatePolicy: auto`,
`uninstallPolicy: allowed`), so the canonical install path is
`package intent add-optional aligned-onboarding` + `package sync` - durable intent across VM
rebuilds, backend-cached artifacts, fleet auto-updates, clean uninstall. Explicit
`package install "github:...#<branch>"` stays the branch-testing path. The manifest
description is compacted (the index entry must mirror it verbatim). Guard MERGE
INSTRUCTIONS now require byte-for-byte copies from the staged guard files - never
paraphrased. Root README stops calling this folder a compatibility exception.

## 2.8.2 - 2026-07-26

Post-install is now mechanical wherever content already exists as staged bytes. The guard
merge runs as one python pass (read user.md + the four staged guard files, substitute
workspaceId, splice by sentinel, write back) with a verify-then-single-Write fallback only
if the sandbox rejects the scripted write - no more regenerating the whole user.md through
the model. Every VoC routine created at install gets its first run kicked and checked off;
canceled routines from prior installs are terminal and never resumed. All INDEX.md and
existing-file updates go read-then-write-whole (the edit/patch tool fails validation on
staging VMs).

## 2.8.1 - 2026-07-26

Post-install now fires reliably on the first turn after install. The package manager loads
`package_instruction` resources as prompt context for the turns after install (it never runs
setup itself), so the activation instruction is rewritten for that moment: it checks
`/agent/user.md` for the `runneth:account-context-guard` sentinel and, when absent, runs the
post-install sequence before anything else. The guard sentinels double as the ran-already
marker, so activation is idempotent across turns. Install docs now mandate the
`github:owner/repo/path#branch` ref form - the `tree/<branch>` URL form misparses branch
names containing `/` and 422s.

## 2.8.0 - 2026-07-26

Deterministic install. Replaced `install-config.json` with a real `package.json` manifest so
the Runneth package manager stages every file mechanically in one `package install` call (no
LLM file copying). The install trigger now rides the manifest's `activation` package
instruction and the staged `post-install.md`. The four `/agent/user.md` guard blocks ship as
ready-made staged files under `guards/` (workspaceId token resolved at post-install), and
post-install merges all four in one full-file write - read `/agent/user.md`, splice the
blocks, write the whole file back with the file-write tool - instead of extracting them from
three docs and editing four times. No behavior changes to any part: same docs, same guards,
same gates, same run order.

## 2.7.0 - 2026-07-24

The package now fires itself at install: a post-install entry (backed by the staged
post-install.md) makes the installing conversation run the install-time sequence immediately
after the file copies - reachability check, VoC recurring-sync setup for every available
platform (backfills kicked in the background, never pulled in-conversation), the Meta context
steps, and the Knoweth guard merges; Knoweth organize still waits on its own gates. VoC Data
Pull expanded from 9 to 17 platforms (adds Zendesk, Klaviyo, Attentive, Gong, Hotjar, Discord,
YouTube, Reviews.io) with registry live-probe upgrades (Junip unblocked, Yotpo since_date), a
Step 2 resilience mandate (the live API is the truth; a stale recipe never stops a pull), and
single-sourced docs: per-platform evidence/caveats live only in recipe headers, and the
coverage contract is owned solely by SKILL.md.

## 2.6.0 - 2026-07-24

Merged Jose's Field 10 work (authored as ACB v1.23 on an older base, landed as v1.24). Field
10 (reporting structure and marketing calendar) is the deck spec: synthesized from Fields 4,
7, and 9 once confirmed - no new Motion pull - with an auto-detected marketing calendar from
the naming decoder's campaign-type and launch-date positions and four standard deck sections
proposed as a starting hypothesis. Scope rule: Field 10 gates the deck, not validation - the
question loop runs on the nine required fields; no deck is built without a confirmed Field 10,
and an unconfirmed Field 10 at deck time runs its two beats on the spot. Validation (v1.5)
pre-fills the deck build from the spec, leads the deck-first door with it, anchors starter
questions 2 and 4 in the confirmed reporting dimensions and calendar, and keeps MVCE gated on
the approved deck.

## 2.5.0 - 2026-07-24

Merged Jose's parallel Account Context Brain work (authored as v1.22, landed as v1.23). Field
4 now writes an operational naming decoder to /agent/brain/meta/naming-decoder.json - typed
positions (segment_filter / context_only / unique_id / metadata_do_not_filter) mapped to Meta
query fields, with the LP-reference decode and the _VALUE_ filter-translation rules - owned by
Field 4 and referenced from account-context.md rather than embedded in it. Field 9
restructured around four captures: ranking metric, CPA target (commentary, not a filter),
winner/cut criteria applied only to explicit winner/cut questions (spend floor, minimum days,
optional tier labels with the rank-then-classify usage rule), and the default reporting
window; supersedes v1.21's mandatory always-ask spend-floor script. Playbook, README, Knoweth
answer standard, skeleton, and validation references updated to point at the decoder.

## 2.4.0 - 2026-07-24

Added the Meta Ad Performance Analysis skill (meta-ad-performance-analysis/SKILL.md, installed
to the skills root): a generalized framework for reading a single ad's performance - primary
KPI first, efficiency (cost-per or ROAS) against the account's own averages, then supporting
metrics (first frame retention, thumbstop, hold rate, engagement, CTR outbound, conversion
rate, AOV) to locate where in the funnel the ad wins or loses. Reconciled to package contracts
on staging: account-context.md is the interpretation source (never Motion workspace settings),
metrics are pulled live via the motion CLI and never stored, name filters go through the
confirmed naming decode, every pull names the workspace, and analyses show their work. Skill
addition only; no changes to existing parts.

## 2.3.0 - 2026-07-24

Removed the per-creative-files model everywhere: creative content lives in Cacheth (the local
creative cache) and is queried via Knoweth pre-context injection first, then the motion cache
CLI (search-summaries / get-creative; local, no API call). The Creative Attributes playbook
(renamed from Creative Attribution: the step establishes attributes of each creative, not
spend attribution) is now the creative-content-layer contract plus naming decode. Validation
gates on cache coverage instead of files under /agent/brain/meta/creatives/. The naming decode
is a handoff, not an artifact: detected provisionally in Step 1 and folded into
account-context.md (Field 4) on confirmation - no separate taxonomy file. Performance metrics
are pulled live via the motion CLI, never stored. Staged the Cacheth Command Reference
(meta/cacheth-command-reference.md) beside the Data-Query Guide as the flag-level contract for
the motion cache CLI. Added the name-level disambiguation contract: the Data-Query Guide gains
a "Which name level to filter on" section (product/theme words cascade across campaign, ad
set, and ad names; bare product names default to adName + includes; never silently swap
levels), Field 4 detects and confirms where product names live in this account, the Creative
Attributes decode hands over provisional token placement, and validation (v1.4) probes the
read with a "show me all our [product] ads" starter question.

## 2.2.0 - 2026-07-23

Added the Knoweth organize part (knoweth/): after the account questions are answered, organize
the brain so retrieval stays tight, plus a standing save + maintenance contract. Grounded in
the real retrieval wiring - only global, user:<userId>, and project:<workspaceId> (the
workspace) are queried today, so shared content stays in the global lane and is sliced by
tags; data-source-family lanes are a documented forward path gated on a harness change, not
shipped.

## 2.1.0 - 2026-07-23

Reorganized into meta/ and voc-data-pull/ subfolders with one combined README. Added the VoC
Data Pull part: skill, platform recipes, and output templates installed to the skills root.
Setup is manually triggered - when asked, Runneth creates one daily voc-sync-<platform>
routine per available VoC platform (backfill first run, incremental daily runs). Nothing runs
on install or on connect.

## 2.0.0 - 2026-07-22

Full replacement of the v1 package. Reordered the flow: Creative Attributes (formerly Creative
Corpus) collects raw facts first, the Account Context Brain (v1.21, with mandatory spend
confidence floor) confirms interpretation second, and a new third part, Meta Validation
(v1.1), proves the account is understood via the answer-and-confirm loop, the weekly deck,
lock-in, and the MVCE gate. Dropped the corpus-search tool and all references to it; retrieval
is Knoweth with per-creative summaries in Cacheth (staging). The Creative Attributes build and
its maintenance run only on an explicit request from a person and never auto-grab creatives
into the brain. Dropped the orchestration skill; the staged docs are the source of truth.

## 1.0.0 - 2026-07-21

Initial release. Account Context Brain plus Creative Corpus with corpus-search retrieval.
