# Voice of Customer Onboarding

The VoC-only onboarding package: it finds a workspace's reachable voice-of-customer
integrations, syncs their raw data into the workspace's brain folder on a daily routine,
and turns that corpus into durable creative-strategy insight through the human-gated Voice
of Customer Audit. It is the Voice of Customer half of the `meta-and-voc-onboarding`
package, extracted as-is and isolated from the Meta onboarding work (Account Context
Brain, Creative Attributes, Meta Validation, Knoweth organize) — with one structural
difference: nothing runs at install time. A person triggers everything.

**Meta ad comments are a VoC integration.** A connected Meta workspace always gets a
`voc-sync-<workspace>-meta-ad-comments` routine (pulled with
`motion meta creative-comments`, one file per creative) alongside the review, support, and
community platforms. That is the only Meta touchpoint in this package.

## The three parts

- **VoC Onboarding Walkthrough** (`voc-onboarding-walkthrough/`) — the entry point. A
  person says "run voice of customer onboarding" (or asks to begin, resume, or check on
  it) and the skill runs its setup phase: workspace resolution from the conversation's own
  Motion context, reachability probes across every VoC platform (OAuth connections and
  stored keys), human-confirmed account pinning, one daily `voc-sync-<workspace>-<platform>`
  routine per reachable platform with the first run kicked. Once data lands, its
  presentation phase gives the per-integration Voice of Customer summary ("Judge.me: 1,240
  reviews across 6 products, May 2025 – July 2026") and offers the audit by previewing its
  plan — split by product, score 1–5, the five buckets, personas — and inviting additions
  and reference docs. Re-invoking is always safe: existing routines are skipped, a
  mid-backfill invocation reports counts so far, an existing audit gets a rerun offer.
- **VoC Data Pull** (`voc-data-pull/`) — the sync mechanics: platform recipes, account
  pinning rules, routine templates, coverage contract (trailing 12 months, bounded pulls),
  and the standardized one-file-per-item storage format (one file per creative for Meta ad
  comments). Files land under `/agent/brain/<workspace>/data-sources/voc/<platform>/`.
  The first fully covered backfill sends one asynchronous audit offer to the setup
  conversation, previewing the audit's plan.
- **Voice of Customer Audit** (`voc-audit/`) — manual skill: separates every synced entry
  by product, scores 1–5 for usefulness, and extracts five insight buckets per product
  (pain points, trigger moments, objections before purchasing, transformations, standout
  language), plus evidence-backed personas for products with 200+ entries. Buckets 1–4 are
  numbered lists of distinct standalone findings with verbatim attributed quotes inline
  (name, rating, source file) and explicit no-signal lines for empty buckets. Saves one
  canonical compiled page at
  `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`. Runs only on a
  person's yes to an offer or an explicit request; requires at least 200 total entries and
  a completed backfill.

## File structure

```
voc-onboarding/
  package.json                          # manifest
  README.md                             # this file        -> /agent/brain/voc-onboarding/
  post-install.md                       # install announce -> /agent/brain/voc-onboarding/
  voc-onboarding-walkthrough/SKILL.md   # -> /agent/.agents/skills/voc-onboarding-walkthrough/
  voc-data-pull/                        # -> /agent/.agents/skills/voc-data-pull/
    SKILL.md
    references/platform-recipes.md
    templates/{review,support-conversation,community-post,ad-comments-creative}.md
  voc-audit/SKILL.md                    # -> /agent/.agents/skills/voc-audit/
```

Everything the package produces is workspace-scoped under `/agent/brain/<workspace>/`
(name slugged from the conversation's `Default workspace:` line): raw items under
`data-sources/voc/<platform>/`, the compiled audit beside them. A second workspace in the
same org onboards additively; folders and routines never merge.

## Install and run order

1. **Install (manual, quiet).** An agent installs the package with one explicit install
   call. Post-install announces the install and the trigger phrase — nothing else runs.
   No guards are merged; the package never touches `/agent/user.md`.
2. **A person triggers onboarding.** "Run voice of customer onboarding" invokes the
   walkthrough skill: reachability, account pinning (human-confirmed; auto-pin only for
   single-workspace orgs), routines created and kicked. The 12-month backfills run in the
   background — data is never pulled inside the conversation.
3. **Data lands; the summary and offer follow.** The first fully covered backfill sends
   one asynchronous audit offer; invoking the walkthrough again presents the
   per-integration summary and the same explained offer on demand. Both log
   `voc-audit-offer` in the workspace changelog so nobody is offered twice by default.
4. **The audit runs on a yes.** The `voc-audit` skill compiles the corpus into the
   canonical audit page, honoring any requested additions and supplied reference docs.
   Reruns are also manual and regenerate the same page — never dated duplicates.

## Provenance and divergence

Extracted from `meta-and-voc-onboarding` at commit `bce9619` (August 2026). `voc-audit/`
and `voc-data-pull/` are byte-for-byte copies of that snapshot except for the
substitutions below. The two packages do not track each other automatically: a fix landing
in either package's copy of a shared file must be mirrored by hand.

Substitutions (the complete list — everything else is verbatim):

1. `voc-data-pull/SKILL.md`, "When to use," first bullet: the setup trigger names this
   package's walkthrough skill instead of the `meta-and-voc-onboarding` install, and adds
   "never at install" to the never-unprompted rule.
2. The walkthrough skill is new (`voc-onboarding-walkthrough`, its own name so it can
   never collide with the parent's `onboarding-walkthrough` at the skills root). Its setup
   phase carries the parent's post-install steps 0–2 (workspace readout, reachability, VoC
   sync setup) with install-turn phrasing adapted to invocation phrasing; its presentation
   phase carries the parent walkthrough's VoC summary and audit-offer beats with the
   Meta-sequencing preamble (account-context questions, Field 10) removed.
3. `post-install.md` and `package.json` are new, written for the trigger-phrase model:
   staged docs live under `/agent/brain/voc-onboarding/` instead of
   `/agent/brain/meta-and-voc-onboarding/`.

Deliberately absent, relative to the parent: all four guards (nothing here self-fires, so
nothing needs `/agent/user.md`), the onboarded-workspace roster, the Account Context
Brain, Creative Attributes, Meta Validation, Knoweth organize, the
`meta-ad-performance-analysis` skill, and the Meta CLI/cache references.
