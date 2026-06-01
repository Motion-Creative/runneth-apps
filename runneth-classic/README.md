# runneth-classic

The deterministic, opinionated Runneth, packaged as a single installable use case.

## What this pack is

`runneth-classic` is a single self-contained directory in the runneth-apps repo that gives any Runneth instance a coordinated creative-strategy operating model: a 12-theme classifier with per-theme skill chains, the eleven craft skills written by Alysha (foundation through execution), a richer brand foundation built by `brand-audit`, durable per-workspace state, and a `user.md` sentinel that enforces eleven behavioral rules. Five derived from the original deterministic Runneth Beta system prompt. Six engineered from the Runneth 1.0 customer feedback dataset.

A CSM or org admin points a customer's Runneth at this directory. The cascade installs eleven upstream use cases (one of which, `performance-bundle`, cascades to four more underneath). The pack then installs on top. A ten-step setup conversation runs synchronously, then hands off to `brand-audit` which runs for ten to fifteen minutes in the background. When `brand-audit` completes, the closing handoff posts back into the same thread with three first-try prompts tuned to the workspace's persona, watched brands, and connected platform.

## What's in it

| File or directory | Purpose |
|---|---|
| `use-case.json` | Catalog metadata |
| `marketing.md` | Customer-facing pitch |
| `README.md` | This file |
| `install-config.json` | Cascade, `installs[]`, `runtime_installs[]`, `post_install` |
| `post-install-intro.md` | Closing message text |
| `SKILL.md` | Orchestrator: 12-theme classifier, chain runner, Synthesis Gate, surgical-edit router, Step 0 re-anchor |
| `setup-runneth-classic/SKILL.md` | The ten-step setup conversation |
| `skills/*.md` | Eleven Alysha skills bundled at install time |
| `seed/chains/*.md` | Static pack content: per-theme skill sequences |
| `seed/strategy/*.md` | Static pack content: Alysha framework supplements not already in `/runneth/references/` |
| `seed/reference/*.md` | Static pack content: Beta-specific framings (benchmark priors, custom conversion clarification) |
| `user-md-sentinels/runneth-classic.md` | Eleven `user.md` rules appended at install with sentinel guard |

## Upstream dependencies

The cascade installs these in order before this pack:

```
bootcamp
performance-bundle  (cascades to brand-audit, paid-strategy-audit, creative-deep-dive, weekly-performance-deck)
corpus-search
plan-mode
self-iteration-loop
team-member-memory
competitor-intel
health-alerts
add-roles-permissions
building-integrations
integration-capabilities-library
```

About fifteen use cases land in the customer's sandbox by the time `runneth-classic` itself installs.

## Recurring routines are opt-in

The cascade installs the capability for Monday competitor scans, Friday performance decks, Friday paid-strategy drift checks, and Monday brand-audit refreshes. None of them auto-activate. Each fires only after the customer explicitly configures cadence and Slack delivery via the relevant use case's setup skill. The pack does not silently start posting to Slack channels on install.

## How the eleven `user.md` rules work

The pack ships a `user-md-sentinels/runneth-classic.md` file that gets appended to `/agent/user.md` once at install time using a sentinel guard so the same content cannot be appended twice. The eleven rules cover:

**From Beta:** the Synthesis Gate, no metrics in prose for analyze responses, always-end-with-Next-steps, the custom-conversion clarification stop-gate, and the isActive/launchDate/pauseDate check for promotional copy claims.

**From the customer feedback dataset:** surgical edit precision, durable conversation memory, persona-conditioned generation, honest rendering and delivery, slice integrity on data pulls, and use of the saved winner-definition over a ROAS-as-winner default.

Each rule is scoped, named, and short. The full text lives in `user-md-sentinels/runneth-classic.md`.

## Both Meta and TikTok

The pack supports either platform. Setup's connection check looks at both. The orchestrator's per-theme chains branch by what's connected. Competitor research stays on Meta Ad Library because that's the source. Creative work (hooks, concepts, briefs) is platform-agnostic.

## Brain organization after install

Three-tier model under `/agent/brain/runneth-classic/`:

- **Static** (pack-owned, same for everyone): `chains/`, `strategy/`, `reference/`.
- **Per-workspace** (written by setup, lives for the workspace lifetime): `workspaces/<slug>/` with winner-definition, surface preference, customer-voice intent, watched brands, dossiers.
- **Per-conversation** (runtime-written for long threads): `conversation-anchors/`.

The orchestrator's Step 0 re-anchor reads from all three on every chain run.

## Status

Experimental. Promote to `proven` after five or more orgs validate.
