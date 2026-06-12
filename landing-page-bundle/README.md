# Landing Page Bundle — Four Use Cases

Four Runneth skills that work together to give any client a complete, self-updating understanding of their landing pages, their brand, their conversion optimization, and their experimentation backlog.

| Skill | Job | Output location |
| --- | --- | --- |
| `landing-page-summary` | Recreation-quality spec of any landing page, with in-system changelog | `/agent/brain/landing-pages/<slug>--<domain>.md` |
| `brand-kit` | Complete brand system (markdown + brand-styled HTML) extracted from landing pages | `/agent/brain/brand-kit/<slug>--brand-kit.md` + `./artifacts/<slug>--brand-kit.html` |
| `optimize-landing-page` | 8-layer CRO audit with top 3 fixes and a short test queue appendix | `/agent/brain/cro-audits/<slug>--<domain>/<YYYY-MM-DD>.md` + `./artifacts/cro-audit.<host>.<date>.md` |
| `landing-page-experiments` | Scored 10-20 test backlog grouped by element and hypothesis type | `/agent/brain/experiments/<slug>--<domain>/<YYYY-MM-DD>.md` + `./artifacts/experiments.<host>.<date>.md` |

## How they connect

```
landing-page-summary  (upstream evidence layer, refresh by re-running)
      │
      ├────► brand-kit               ─► branded outputs auto-consult the kit
      │                                (via saved-preferences instruction installed
      │                                 on first brand-kit build)
      │
      ├────► optimize-landing-page  ─► CRO audit + short test queue appendix
      │        │
      │        ▼ (audit history feeds test ideation)
      └────► landing-page-experiments ─► 10-20 scored A/B test backlog

All three downstream skills always invoke landing-page-summary fresh.
They never read a saved summary directly.
```

`landing-page-summary` is the upstream evidence layer. All three downstream skills (`brand-kit`, `optimize-landing-page`, `landing-page-experiments`) invoke it fresh on every run. They never read a saved summary directly. This is the freshness contract that prevents stale data from silently corrupting downstream brand inference, CRO audits, and experiment backlogs.

After the first brand-kit build, the brand-kit skill installs a standing instruction in the saved-preferences file so future branded outputs (HTML pages, landing pages, decks, social posts, emails, ad concepts, briefs, experiment variant copy) auto-consult the brand-kit library and feel native to the target brand. Brand kits become an active primitive, not an inert reference.

There is no scheduled routine in the bundle. Refreshing a landing page summary is on-demand: re-run `landing-page-summary` on a known URL and it re-fetches, archives the prior version to `_history/`, and notes material changes (hero headline, primary CTA, pricing, form fields, page intent). Users who want a standing weekly refresh can ask Runneth to set one up themselves.

## Recommended install order

You can install them in any order. They're independent. But recommended order:

1. **`landing-page-summary`** first. All three downstream skills lean on it. Installing it first means the others get the full headless-browser evidence layer on their first run.
2. **`brand-kit`** second. Building the first brand kit also installs the saved-preferences usage instruction so subsequent work is brand-aware (including experiment variant copy).
3. **`optimize-landing-page`** third. With summaries and brand context already wired up, CRO audits have full context. Audits build a history that experiments will read.
4. **`landing-page-experiments`** fourth. Reads everything upstream (summaries, brand kit, audit history) and generates scored test backlogs.

## Per-folder install

Each folder has a `README.md` with the exact bash commands to install that skill in a fresh sandbox. The pattern is the same in all four:

```bash
# From inside the skill folder:
# 1. Copy SKILL.md to /agent/.agents/skills/<name>/
# 2. Seed any local index files (skipped if present)
# 3. Append routing entries to /agent/INDEX.md (single-line format, guarded)
```

No tokens to substitute. No env vars to configure. Playwright auto-installs on first use of `landing-page-summary` or `brand-kit`.

## Folder structure of this bundle

```
runneth-apps/
├── README.md                                ← this file
├── landing-page-summary/
│   ├── README.md
│   ├── install-config.json
│   ├── SKILL.md
│   ├── DATA-CONTRACT.md
│   └── seed/_index.md
├── brand-kit/
│   ├── README.md
│   ├── install-config.json
│   ├── SKILL.md
│   ├── reference-example.md
│   └── seed/_index.md
├── optimize-landing-page/
│   ├── README.md
│   ├── install-config.json
│   └── SKILL.md
└── landing-page-experiments/
    ├── README.md
    ├── install-config.json
    ├── SKILL.md
    └── seed/_index.md
```

## Filesystem layout these skills create

```
/agent/.agents/skills/
├── landing-page-summary/SKILL.md
├── brand-kit/
│   ├── SKILL.md
│   └── reference-example.md
├── optimize-landing-page/SKILL.md
└── landing-page-experiments/SKILL.md

/agent/brain/
├── landing-pages/
│   ├── _index.md
│   ├── <slug>--<domain>.md                  ← current summary, overwritten on re-fetch
│   └── _history/<slug>--<domain>/<ts>.md    ← changelog of prior versions
├── brand-kit/
│   ├── _index.md
│   ├── <slug>--brand-kit.md                 ← current markdown source of truth
│   └── _history/<slug>/<ts>.md              ← changelog of prior brand-kit versions
├── cro-audits/
│   ├── _index.md
│   └── <slug>--<domain>/
│       └── <YYYY-MM-DD>.md                  ← one file per audit
└── experiments/
    ├── _index.md
    └── <slug>--<domain>/
        └── <YYYY-MM-DD>.md                  ← one file per backlog

/agent/INDEX.md                              ← four library roots indexed at install
                                               (landing-pages/, brand-kit/, cro-audits/,
                                                experiments/) plus one entry per saved
                                               file at runtime. Skills themselves are NOT
                                               indexed; they are auto-discovered via the
                                               available-skills mechanism in Runneth's
                                               system prompt.
/agent/user.md                               ← brand-kit usage instruction installed
                                               after first brand-kit build (sentinel-guarded)

./artifacts/
├── <slug>--brand-kit.html                   ← brand-styled HTML deliverable
├── cro-audit.<host>.<date>.md               ← latest audit, copy the user opens this turn
└── experiments.<host>.<date>.md             ← latest test backlog, copy the user opens this turn
```

## Design principles enforced across all four skills

- **Always re-fetch.** No downstream skill reads a saved landing page summary directly. `brand-kit`, `optimize-landing-page`, and `landing-page-experiments` all invoke `landing-page-summary` fresh in the same conversation. Stale data silently corrupts downstream outputs; the freshness gate prevents that.
- **Filename never carries a timestamp.** One stable path per page, brand, or audit-per-day. Prior versions move to a `_history/` folder before being overwritten. The history folder is the in-system changelog without any git dependency. CRO audits and experiment backlogs are dated files (audits and backlogs accumulate; they don't overwrite).
- **Computed DOM, not raw stylesheet extraction.** This is brand-kit's load-bearing rule. Webflow, Framer, and similar frameworks declare every token (including unused defaults) in their stylesheets, so raw CSS values lie. Brand-kit verifies every visual value against the live DOM and against screenshots. The landing-page-summary's § 12 carries the same warning so other consumers don't trust those values blind.
- **No hardcoded sandbox paths.** Playwright location is discovered dynamically. No `_npx/<hash>` cache hashes, no per-account brand examples, no conversation-id-specific references.
- **All scripts in `./workdir/`.** Never `/tmp/`. The sandbox doesn't allow writes there.
- **Two indexes, always updated together.** Every durable save updates the local topic `_index.md` (human-friendly per-area routing) and the global `/agent/INDEX.md` (Runneth's routing surface). On every save. Without exception.
- **Single-line `|`-separated INDEX format.** Per Runneth's index rules. Multi-line YAML entries break the convention. Skills themselves are intentionally NOT indexed (auto-discovery handles that).
- **Brand kits are active, not inert.** Once a brand kit exists, the saved-preferences usage instruction makes Runneth consult it on every future branded output without the user having to ask. Experiment variant copy obeys the kit automatically.
- **No scheduled routines.** Nothing in the bundle installs reminders or recurring jobs. Refresh is on-demand: re-run `landing-page-summary` on a known URL and the archive-before-overwrite history shows what changed.

## Versioning

Each skill folder has its own `install-config.json` with a changelog. The bundle as a whole tracks at the folder level.

This is initial release v1.0.0 across all four skills.
