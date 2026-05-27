# runneth-apps

The app & skill library behind the **Runneth Use Case Library** at [runneth.motionapp.com](https://runneth.motionapp.com). Each top-level directory is a self-contained use case — a skill bundle or a sandbox app — that a Runneth user can install in a couple of clicks. The public site reads this repo's curated metadata **live** via the GitHub raw API (~60s cache), so editing the files here *is* how the site is organized.

## How a use case is structured

| File | Purpose |
|---|---|
| `use-case.json` | Card metadata the site reads: `display_title`, `pitch`, `status` (`proven`/`experimental`), `category`, `github_path` |
| `marketing.md` | Customer-facing hero / super-powers / example (frontmatter + body) |
| `README.md` | The card's "How it's built" tab + full-README expander |
| `install-config.json` | Install steps + customize tokens (optional; about half the cards have one) |
| `SKILL.md` | The skill definition, for skill-style use cases |
| `buildeth.app.json` + `frontend/` + `server/` | For sandbox-app use cases |

## The catalog — what shows, and where

The site is driven entirely by three things in this repo; there is no separate CMS:

- **`.use-case-library/catalog.json`** — `slugs[]` is the ordered list of what ships; `excluded[]` lists slugs deliberately hidden, each with a `reason`.
- **`.use-case-library/categories.json`** — the category tabs (`slug`, `title`, `order`, `blurb`).
- **each `<slug>/use-case.json`** — that card's `category` and `status`.

`status` lives **only** in `use-case.json` — the site does not read it from `marketing.md`.

### Add a use case
1. Create `<slug>/use-case.json` and `<slug>/marketing.md` (see `.use-case-library/voice-guide.md` for tone).
2. Optionally add an SVG glyph for the slug in `use-case-library-site/frontend/src/Illustration.tsx` (falls back to a generic glyph otherwise).
3. Append the slug to `.use-case-library/catalog.json` `slugs[]` in the order it should appear.
4. Commit. The site re-pulls within ~1 minute (redeploy the site only if you added a glyph).

### Hide a use case
Move its slug from `slugs[]` to `excluded[]` with a reason. Files can stay for history.

## The site
`use-case-library-site/` is the deployed app (React + Fastify) that renders this catalog — see its [README](use-case-library-site/README.md) for running and deploying it.

## Conventions
- Slugs are kebab-case and match the directory name. The landing-page bundle's sub-skills resolve under `landing-page-bundle/<slug>`.
- No committed build artifacts — keep archives out of the repo; distribute use cases through the library, not as bundles.
