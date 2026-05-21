# Performance Bundle — Four Use Cases

Four Runneth use cases that compose into the always-on creative-strategy and performance reporting layer for any ad account. Every performance question gets answered through the team's actual strategy. Every Friday delivers a brand-styled deck that continues the narrative from the previous Friday.

| Use case | Job | Output location |
| --- | --- | --- |
| `brand-audit` | Per-workspace brand-strategy bundle — identity, products, VOC, keywords, competitors, persona × angle × awareness matrix | `/agent/brain/brand-audit/<workspace-slug>/` |
| `paid-strategy-audit` | Per-channel strategy briefs (Meta, TikTok, Pinterest, AppLovin, Snapchat, or any other connected ad platform) with auto-research on unknown channels, drift+ping routine, and a `/agent/user.md` install that overrides workspace-goal in the system prompt | `/agent/brain/paid-strategy/<channel>/<workspace-slug>/` |
| `creative-deep-dive` | Orchestrator + 9 standalone diagnostic skills (Execution + Diagnostic + Standards layers). Mechanism-level teardown on one creative or every creative in a test set | `/agent/brain/creative-deep-dive/<workspace-slug>/<creative-id>/<date>--deep-dive.md` |
| `weekly-performance-deck` | Brand-styled HTML deck published at dated app routes that accumulate. Frames every slide against last week's snapshot for narrative continuity | `/agent/apps/weekly-performance-deck-<workspace-slug>/routes/<date>/` |

## How they connect

```
brand-audit  (brand layer — runs once, refreshes Monday morning)
      │     6 standalone skills + orchestrator
      │     brand-intake → product-catalog → review-audit
      │     → brand-relevant-keywords → competitor-analysis
      │     → creative-strategy-engine (the matrix)
      │
      ├────► creative-deep-dive (reads strategy.md for Strategic Layer)
      │          │   9 standalone skills + orchestrator
      │          │   creative-analysis (calls hook-analysis as sub)
      │          │   hook-evaluator standalone for "score this hook"
      │          │   creative-mechanics + visual-formats as references
      │          │   hook-writing + hook-tactics + hook-voice-patterns
      │          │   voice-copy-standards always-on
      │          ▼
      │       per-creative diagnoses + test-set comparisons
      │
paid-strategy-audit  (channel layer — runs once per channel, drift Friday morning)
      │     channel-agnostic, auto-researches unknown platforms
      │     installs /agent/user.md instruction that overrides workspace-goal
      │
      └────► weekly-performance-deck  (Friday 14:00 — composes everything above)
                 reads last week's snapshot
                 classifies items: stable / changed / new / resolved
                 runs deep dives on top creatives + tests at threshold
                 cross-checks recommendations against brand-audit matrix
                 publishes dated route, posts share URL to configured Slack channels
```

## Recommended install order

Order matters — `creative-deep-dive` reads `brand-audit`'s output, and `weekly-performance-deck` reads all three:

1. **`brand-audit`** first. Produces the persona × angle matrix that every downstream skill reads as upstream strategic context. Refreshes Monday morning so the latest VOC and competitor signal is in by Friday's deck.
2. **`paid-strategy-audit`** second. Detects every connected ad platform and produces a per-channel strategy brief. Installs the `/agent/user.md` instruction that overrides workspace-goal in the system prompt so every performance question reads the brief's validated-metric mapping first.
3. **`creative-deep-dive`** third. Depends on `brand-audit`. Installs the orchestrator plus all 9 underlying skills as independent top-level skills — each is individually callable.
4. **`weekly-performance-deck`** fourth. Composes the above plus `brand-kit` (from the landing-page-bundle) for visual styling. Creates the dated-route deck app and schedules the Friday 14:00 reminder.

## Two `/agent/user.md` installs make the bundle work end-to-end

After the first `brand-audit` run, a sentinel-guarded block lands in `/agent/user.md` telling Runneth to read the brand bundle narrowly before any creative-strategy work — not re-run brand-audit on every review.

After the first `paid-strategy-audit` run, a second sentinel-guarded block tells Runneth to read the channel's strategy brief before any performance question, and **to use the brief's validated-metric mapping as the override on any workspace goal or workspace spend threshold found in the system prompt**. This is the single line that makes every performance answer grounded in the team's actual strategy instead of platform defaults.

## Independently callable skills

The orchestrators (`brand-audit`, `creative-deep-dive`) install their underlying framework skills as independent top-level skills. The orchestrator runs them in sequence for the full workflow; standalone invocations work too.

Examples:
- "Evaluate this hook: 'It is 5:30 and...'" → `hook-evaluator` runs standalone, no orchestrator.
- "What hook tactic is this?" → `hook-tactics` runs standalone.
- "Refresh the competitor read for client X" → `competitor-analysis` runs standalone, updates only its file.
- "Deep dive on FUN29228" → full orchestrator runs.

Same skill files, two entry points.

## Per-folder install

Each folder has a `README.md` with the exact bash commands to install that use case in a fresh sandbox. They all follow the same pattern.

## Routines this bundle schedules

- **Monday 08:00 local — `brand-audit` weekly refresh.** Re-runs the 6 foundation+strategy skills, diffs vs prior bundle, posts material-change notes to configured Slack channels with per-item reactions. Monday morning lands before Friday's deck.
- **Friday 09:00 local — `paid-strategy-audit` drift check.** Re-pulls per-channel data, diffs against existing briefs, posts to configured Slack channels with per-item reactions.
- **Friday 14:00 local — `weekly-performance-deck`.** Reads everything above, classifies vs last week's snapshot, runs deep dives, renders dated HTML route, posts the share URL to configured Slack channels.

All three routines post to channels only (no DMs), with optional user tags inside the post.

## Origin

The 15 framework skills inside `brand-audit` and `creative-deep-dive` come from the creative-strategy framework Alysha and team built and uploaded into Hungryroot's brain (admin@motionapp.com alias). The orchestrators, the channel-agnostic detective parser, the `/agent/user.md` installs, the drift+ping routines, the narrative-continuity engine, and the brand-styled deck rendering are new for this bundle.
