# optimize-landing-page

Runneth audits a landing page through a CRO lens and returns the top 3 fixes ranked by expected lift x ease, plus an A/B test queue, plus a "don't touch" list of things that are already working.

Built for the workflow: creatives point to a landing page, audit the page to make sure it's actually optimized for the ads driving traffic to it. The single most decisive input is the ad copy itself, because the #1 killer of paid conversion is message-match failure between ad and hero.

Pairs with `landing-page-summary` (always invoked fresh as the evidence layer) and `brand-kit` (parallel skill).

Install time: ~15 seconds. No bootstrap needed by this skill directly. If `landing-page-summary` is installed, it provides the Playwright-backed evidence layer. If not, this skill falls back to WebFetch and notes the degraded quality.

Requires: nothing pre-installed. Strongly recommended: `landing-page-summary`.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/optimize-landing-page/SKILL.md` | Overwrite (skill upgrade) |
| INDEX.md routing entry for the saved-audits library | `/agent/INDEX.md` | Appended if not present |

The skill itself is auto-discovered via Runneth's available-skills mechanism, so no `/agent/.agents/skills/...` entry is added to `/agent/INDEX.md` (per Runneth's index rules). Only the durable library at `/agent/brain/cro-audits/` is indexed.

The skill creates `/agent/brain/cro-audits/` on first run. No seed files are needed because audits are date-stamped per page, not registered in an empty seed.

## Install in a fresh sandbox

```bash
# 1. Install the skill so Runneth auto-discovers it
mkdir -p /agent/.agents/skills/optimize-landing-page
cp SKILL.md /agent/.agents/skills/optimize-landing-page/SKILL.md

# 2. Add the global INDEX.md routing entry (skipped if already present)
grep -q "^- path: /agent/brain/cro-audits/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/cro-audits/ | aliases: cro audits, landing page audits, audit history, optimization history, conversion audits | note: CRO audit library produced by the optimize-landing-page skill. One folder per page at <slug>--<domain>/ with date-stamped audit files (YYYY-MM-DD.md, same-day re-runs get -HHMM suffix). Each audit is durable. Local routing index at _index.md. Source summaries in /agent/brain/landing-pages/. Deliverables in ./artifacts/cro-audit.<host>.<date>.md. | created: {{INSTALL_DATE}} | updated: {{INSTALL_DATE}}" >> /agent/INDEX.md
```

Note: the `optimize-landing-page` skill itself is auto-discovered by Runneth via the system prompt's available-skills mechanism, so no INDEX entry is added for the SKILL.md file. Only the saved-audits library is indexed.

```bash
# (end of install commands)
```

Replace `{{INSTALL_DATE}}` with today's date for exact provenance.

## How it works

Runneth auto-discovers the skill via the `<available_skills>` block in the system prompt. When the user asks to audit, optimize, or A/B-test a landing page, Runneth opens `SKILL.md` and runs the 8-layer diagnostic:

1. **Message match** (ad vs. hero) - the #1 killer of paid conversion
2. **5-second test** - WHAT, WHO, WHY, WHAT-NEXT from hero alone
3. **Awareness-stage alignment** - page vs. traffic temperature
4. **Positioning clarity** - Dunford frame reconstruction
5. **Scroll-job audit** - section-by-section job assignment
6. **Friction audit** - form fields, competing CTAs, scan-killers, speed
7. **Proof and risk reversal** - logos, testimonials, guarantees
8. **CTA architecture** - copy, repetition, primary/secondary balance

Output: top 3 fixes with verbatim "current -> replace with" prescriptions, plus an A/B test queue ready to ship after the fixes land.

## Freshness contract

The skill always invokes `landing-page-summary` fresh in the same conversation before running the diagnostic. It never reads a saved summary directly. This guarantees that if the user already shipped a prior fix, the next audit is against the current page state, not a stale snapshot.

## File layout after install + a few audits

```
/agent/.agents/skills/optimize-landing-page/SKILL.md
/agent/brain/cro-audits/
├── _index.md                                    ← latest audit per page
└── <slug>--<domain>/
    ├── 2026-05-13.md
    ├── 2026-05-20.md                            ← re-audit after fix shipped
    └── 2026-06-04.md
./artifacts/cro-audit.<host>.<date>.md           ← copy the user opens this turn
```

## Fallbacks

- **landing-page-summary not installed:** skill falls back to WebFetch with an exhaustive extraction prompt. Visual and form claims are weaker. Audit flags this under "Out of scope".
- **Missing `--ad-copy`:** Layer 1 (message match) is marked `INSUFFICIENT_INPUT`. Skill does not fabricate ad copy.
- **Missing `--traffic` and `--goal`:** Skill asks once in one batch before proceeding. Prescriptions diverge sharply by traffic temperature.

## Version history

See `install-config.json` changelog.
