# PRD: Creative content fallback enforced in the Motion CLI

**Status:** Proposal
**Requested by:** Rachel Grant (CS)
**For:** Yann (agent-builder)
**Date:** 2026-07-29
**Repo affected:** `agent-builder` (primarily `packages/runneth-tools`)

---

## 1. Background

The Meta and VoC Onboarding package (`runneth-apps/meta-and-voc-onboarding`) defines a
"creative content layer" for how Runneth retrieves creative attributes (summaries, hooks,
transcripts, AI tags). The contract is a resolution ladder, resolved top-down:

1. Knoweth pre-injected context (the summary artifacts Cacheth generates)
2. `motion cache search-summaries` (local search)
3. `motion cache get-creative` (full local record)
4. `motion meta insights` with content flags (`--summary-sections`,
   `--include-transcript`, `--include-glossary`) — the live pull, **failure-only**

The design intent: Cacheth serves ~99% of creative reads; the live pull fires only when the
cache errors, is empty/still building, is missing the record, or the sandbox cache feature is
disabled (`MOTION_CACHE_ENABLED=false`). A cache failure must never cause Runneth to answer a
WHY question without reading the creative content.

**Today this contract is enforced only by package documentation.** The instructions live in
markdown installed on customer VMs, and correct behavior depends on the right doc chunk being
in Runneth's context when a creative-content question arrives. That is the ceiling of a
docs-only approach: it can be well-written, but it cannot be guaranteed.

### What already exists in agent-builder (verified 2026-07-29)

- `MOTION_CACHE_ENABLED` env flag, read by `readMotionCacheEnabled()`
  (`packages/runneth-tools/src/runtime/motion/cache/env.ts`).
- When disabled, every `motion cache` command fails with
  `MOTION_CACHE_DISABLED_MESSAGE` ("Motion cache is disabled for this sandbox. Use live
  Motion commands or enable the sandbox Motion cache feature before retrying cache
  commands.") — gated in `startMotionCli`
  (`packages/runneth-tools/src/runtime/cli/motion.ts`).
- With the cache disabled, `motion meta insights` with content flags serves summaries and
  transcripts live from the provider APIs (`getCreativeSummary`, `getCreativeTranscript`).
  Proven by the system test
  `tests/system/suites/motion/cli/creative-summary-v2-cache-off.test.ts`.
- With the cache enabled, the insights query path checks the query cache before any live
  fetch (`packages/runneth-tools/src/runtime/motion/api/creative-insights.ts`, around the
  `readCachedCreativeInsightsResponse` call).

So the CLI already has both halves — a clean disabled signal and a working live path. What's
missing is the connection between them: today the agent is told (in prose) to notice the
failure and re-route itself.

## 2. Problem statement

When the cache cannot serve, the correct fallback depends on the agent remembering
instructions. Failure modes we cannot rule out today:

- Runneth answers a WHY/creative question from metrics alone (or refuses) because a cache
  command errored and the fallback instruction wasn't in context.
- Runneth loops retries against cache commands instead of falling through.
- Runneth uses the live content flags as a shortcut past a healthy cache (slow, costly).
- Nobody knows how often the live fallback actually fires in production, so "Cacheth serves
  99% of reads" remains an assumption.

## 3. Goals

1. The Cacheth-first / live-fallback resolution is enforced by the CLI, not by prose.
2. The agent (and transcripts) can always tell which source served a creative read.
3. A system test proves the end-to-end behavior in a cache-disabled sandbox.

**Non-goals:**

- No change to what Cacheth stores or how it syncs.
- No change to performance metrics retrieval (metrics are already live-only; the package
  rule "pull metrics lean, join content from cache on `creativeId`" stays doc-side).
- No removal of the existing `motion cache` commands or the disabled message for workflows
  that genuinely target the cache (e.g. `status`, `refresh`).

## 4. Proposed change

### 4.1 Fall-through in `motion cache get-creative` (core)

When `motion cache get-creative --creative-id <id>` cannot serve — cache disabled, cache
empty/unbuilt, or record missing — instead of erroring, the command resolves the same
creative live (the existing insights `scope=creative-asset-id` path with summary sections,
transcript, and glossary) and returns the record in the same envelope shape, with explicit
provenance metadata:

```json
{
  "successful": true,
  "servedBy": "live",            // "cache" | "live"
  "fallbackReason": "cache_disabled", // "cache_disabled" | "cache_empty" | "record_missing" | "cache_error"
  "file": "./workdir/motion-...json"
}
```

When the fall-through reason is transient (`cache_error`, `cache_empty`, `record_missing`
with cache enabled), the command also triggers a background cache refresh for the workspace,
so the cache serves next time. `servedBy: "cache"` remains the overwhelmingly common result
and involves no behavior change.

An `--offline` / `--no-fallback` flag preserves the strict local-only behavior for callers
that need it (tests, cache diagnostics).

### 4.2 `motion cache search-summaries` behavior when it cannot serve

Local text search has no live equivalent (searching requires the synced corpus). When
disabled or empty, keep the failure but make it structured and directive rather than a bare
error message: return `successful: false` with `fallbackReason` and a `remediation` field
naming the live alternatives (`motion meta filter-reference` for name resolution;
`motion meta insights` with content flags for content reads). This turns the current prose
hint in `MOTION_CACHE_DISABLED_MESSAGE` into machine-readable guidance in the envelope the
agent already parses.

### 4.3 Guardrail against the reverse mistake (optional, recommended)

With the cache **enabled and healthy**, a `motion meta insights` call that requests content
flags for creatives the cache already holds is a slow path taken unnecessarily. Emit a
one-line notice in the command envelope (not a failure):
`"note": "content served faster by motion cache get-creative for cached creatives"`.
This nudges without blocking — there are legitimate reasons to want a fresh live read.

### 4.4 Telemetry (nice-to-have, small)

Count `servedBy` per workspace (cache vs live, with `fallbackReason`). Even a log line that
can be grepped from transcripts converts the "99% Cacheth" assumption into a measurable
number. No dashboard needed for v1.

## 5. Test plan (for Yann to implement and run)

**New system test — `creative-content-fallback-cache-off`** (mirror the harness of
`creative-summary-v2-cache-off.test.ts`):

1. With `MOTION_CACHE_ENABLED=false`, run `motion cache get-creative --creative-id <id>`.
2. Assert `successful: true`, `servedBy: "live"`, `fallbackReason: "cache_disabled"`.
3. Assert the output file contains summary sections and transcript lines.
4. Assert provider API calls include `getCreativeSummary` / `getCreativeTranscript` and do
   not include the cache compact-summary path.

**New behavioral test — agent-level fall-through** (prompt-proof style, like
`cacheth-counteth-prompt-proof.test.ts`):

1. In a cache-disabled sandbox with the onboarding package installed, ask a WHY question
   about a specific ad ("why is <ad> hooking people?").
2. Assert the agent's answer includes creative-content claims (not metrics-only), the
   tool events show a live content read, and the answer discloses the live source
   (show-the-work).

**Regression:** existing cache-on tests unchanged; `--no-fallback` returns today's strict
behavior.

## 6. Acceptance criteria

- [ ] `motion cache get-creative` never returns a bare failure for a fetchable creative:
      it serves from cache, or serves live with `servedBy`/`fallbackReason` set.
- [ ] Transient fall-throughs trigger a background refresh.
- [ ] `search-summaries` failures carry structured remediation.
- [ ] Both new tests pass in CI.
- [ ] `servedBy` provenance is visible in the returned envelope (and ideally logged).

## 7. Impact on runneth-apps (after this ships)

The onboarding package currently paraphrases the fallback ladder in four documents
(Cacheth Command Reference, Data-Query Guide, meta-ad-performance-analysis skill, Creative
Attributes playbook). Once the CLI owns the fall-through, those paraphrases collapse to one
sentence each ("the CLI resolves cache-first and reports `servedBy`; disclose the source"),
removing the drift risk. The CS team (Rachel) will make those doc changes; no action needed
from agent-builder.

## 8. References (agent-builder, as of 2026-07-29)

- `packages/runneth-tools/src/runtime/motion/cache/env.ts` — enable flag + disabled message
- `packages/runneth-tools/src/runtime/cli/motion.ts` — CLI capability gating (`startMotionCli`)
- `packages/runneth-tools/src/runtime/motion/cache/query-helpers.ts` — cache read/refresh helpers
- `packages/runneth-tools/src/runtime/motion/api/creative-insights.ts` — cache-first query path + live content fetch
- `tests/system/suites/motion/cli/creative-summary-v2-cache-off.test.ts` — proves the live content path with cache off
- `runneth-apps/meta-and-voc-onboarding/meta/cacheth-command-reference.md` — the doc-side ladder this PRD hardens
