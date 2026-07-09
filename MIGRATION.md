# runneth-apps → "OS packages only" migration

_Owner: Kyra · For review by Giselle + Ioana · Started 2026-07-09_

**TL;DR** — This repo grew ~30 use-case directories that only the (soon-retired) library
website surfaces. We're stripping `main` down to the new OS **packages** and a holding-page
version of the site. Nothing is lost: the entire old library is preserved on the
`archive/full-library` branch and the `pre-cleanup-2026-07-09` tag.

## End state for `main`

```
runneth-default/          OS package (Ioana's, new runneth-package.json format)
creative-strategy/        OS package (converted to new format — later PR)
bootcamp/                 OS package (converted from use-case to package)
<package-index>.json      package registry
use-case-library-site/    still LIVE, but a "we're revamping" holding page
scripts/  .github/  README.md
```

Everything else → removed from `main`, preserved on `archive/full-library`.

## Safety net (already in place)

- Tag `pre-cleanup-2026-07-09` — full snapshot, pushed to origin.
- Branch `archive/full-library` — browsable full tree, pushed to origin.

Recover anything: `git checkout pre-cleanup-2026-07-09 -- <dir>`.

## The PR stack (review in this order)

| PR | Title | Branch | Depends on | Reviewer |
|----|-------|--------|-----------|----------|
| 1 | site: revamp holding page | `cleanup/1-site-revamp` | — | Kyra |
| 2 | feat: add runneth-default OS package | `cleanup/2-runneth-default` | — | Ioana |
| 3 | feat: bootcamp becomes a package | `cleanup/3-bootcamp-package` | — | Ioana / Giselle |
| 4 | chore: retire the use-case library | `cleanup/4-sweep` | PR 1 merged | Reza / Ioana |

PR 1 merges first: the site stops reading `catalog.json`, so the use-case dirs become safe
to delete in PR 4. PRs 2 and 3 are independent adds and can land any time.

### Follow-ups (separate PRs, after the stack lands)

- **creative-strategy replaces runneth-default** — `creative-strategy` (Reza's 15-skill
  branch `runneth/creative-strategy-package`) is converted to the new package format and
  supersedes `runneth-default` as the shipped default.
- **team-member-memory → package** — rebuilt clean as its own package (was mid-rework; parked
  deliberately to rebuild thoughtfully, not lost).
- **permissions → package** — `add-roles-permissions` rebuilt clean as its own package.

## What gets removed in PR 4 (all preserved on `archive/full-library`)

- **Retire `runneth-classic` + its exclusive install tree:** `runneth-classic`,
  `add-roles-permissions`, `building-integrations`, `corpus-search`, `health-alerts`,
  `integration-capabilities-library`, `plan-mode`, `self-iteration-loop`,
  `team-member-memory`, `performance-bundle`, `weekly-performance-deck`.
  (`runneth-classic` is not in the app's install menu — the website is its only surface, and
  the website goes to holding-page mode in PR 1, so nothing customer-facing breaks.)
- **Library cards + catalog:** `bootcamp`* , `competitor-intel`, `import-from-ai`,
  `brand-audit`, `paid-strategy-audit`, `creative-deep-dive`, `landing-page-bundle`,
  `.use-case-library`.  *(bootcamp is kept — it moves to a package in PR 3, not deleted.)*
- **Leaf dirs (referenced by nothing kept):** `authenticate-apps`, `brain-onboard`,
  `brief-qa`, `conversation-manager`, `creative-qa`, `file-explorer`, `meta-connect-use-case`,
  `review-library`, `routine-storage-audit`, `share-use-case`, `static-ad-gen`,
  `ugc-creator-programme`, `update-and-merge`, `video-asset-search`, `video-qa`.

## Open questions for Giselle / Ioana

1. **runneth-default vs creative-strategy** — confirmed direction: land `runneth-default`
   first, then a follow-up PR converts `creative-strategy` and makes it the default. Correct?
2. **Canonical package format** — `runneth-package.json` (schema v1) is the standard;
   `creative-strategy` currently uses the old `install-config.json` and needs converting. Agreed?
3. **Package index filename** — branches disagree: `package-index.json` vs
   `runneth-package-index.json`. Pick one before PR 2.
4. **bootcamp package shape** — bootcamp is a corpus + skill, not a skills bundle like
   runneth-default. What resource types should it declare?

## Who built what (courtesy heads-up, not a blocker)

Git shows almost everything as **Reza** because he _merges_ PRs, not builds them. Real owners:
Vamsi (creative cards + apps), Kyra (site, building-integrations), Ioana/Giselle (packages),
Reza (brain-onboard, one-pager). Everything is on `archive/full-library`, so this is just a
"want a copy in your area?" ping, not a gate.
