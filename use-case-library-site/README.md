# Use Case Library

Public-facing template catalog of every Runneth use case Motion has shipped. A marketer browses by category, opens a card, reads an app-store-style pitch, and copies a one-click install prompt for their own Runneth.

Lives at the root of [`Motion-Creative/runneth-apps`](https://github.com/Motion-Creative/runneth-apps). The site reads its curated content directly from this same repo via the GitHub raw API, with a 60-second server-side cache. Update any `marketing.md` or `use-case.json` in the repo and the change surfaces on the site within about a minute.

## What it serves

- **Home** — hero with brand-styled tabs, filtered card grid for each category
- **All** — every use case in one grid with category and status filters
- **Detail modal** — pitch, super powers, how it works, a real example, plus a one-click "Give this to my Runneth" prompt copier
- **Source link** for every use case back to its folder in this repo

## Architecture

```
use-case-library-site/
├── frontend/         React 19 + Vite + framer-motion + marked
│   └── src/          Pages, components, illustrations, theme
├── server/           Fastify
│   └── src/
│       ├── github.ts API client + 60s in-memory cache over raw.githubusercontent.com
│       └── index.ts  Serves /api/* and the static frontend on one port
├── Dockerfile        Single-process container, ready for Fly/Render/Railway/etc.
└── package.json      pnpm workspaces root
```

### Where the content lives

The site does not store its own content. Everything comes from the parent repo:

| Repo file | Used for |
|---|---|
| `.use-case-library/catalog.json` | Slug order and which slugs ship |
| `.use-case-library/categories.json` | Categories with order + blurb |
| `.use-case-library/voice-guide.md` | Tone rules for editors |
| `<slug>/use-case.json` | Display title, pitch, status, category |
| `<slug>/marketing.md` | Customer-facing hero, super powers, example |
| `<slug>/README.md` | "How it's built" tab + full README expand |
| `<slug>/install-config.json` | Install steps and customize tokens, when present |

To add or change a use case, edit those files. No deploy is required for content changes — the running site re-pulls them within the cache TTL.

## Running locally

```bash
# 1. Install
pnpm install:all

# 2. Build the frontend (lands in server/public) and the server
pnpm build

# 3. Run the server
pnpm start

# Server listens on http://localhost:3000
#   GET  /                       static SPA
#   GET  /api/health             { ok, cache: { size, ttlMs, ref } }
#   GET  /api/catalog            assembled catalog
#   GET  /api/use-case/<slug>    detail
#   POST /api/refresh            clears cache (rate-limited to 1/30s per IP)
```

### Hot-reload during development

Run the API and the Vite dev server in two terminals:

```bash
pnpm dev:server     # Fastify on :3000, watches dist
pnpm dev:frontend   # Vite on :5173, proxies /api → :3000
```

Open `http://localhost:5173`.

## Configuration

All optional. Defaults in parentheses.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server binds. Most hosts inject this. |
| `HOST` | `0.0.0.0` | Bind address. |
| `RUNNETH_APPS_REF` | `main` | Git ref this site reads metadata from. Useful for staging. |
| `LOG_LEVEL` | `info` | Fastify log level. |

## Deploying

The container is the simplest path — one process, one port, healthcheck on `/api/health`.

### Fly.io

```bash
fly launch --dockerfile Dockerfile --no-deploy
fly deploy
```

### Render or Railway

Point at this directory, set runtime to Docker, internal port `3000`. No other config required.

### Bare Node host

```bash
pnpm install:all
pnpm build
PORT=8080 pnpm start
```

### Static + serverless

The frontend is a static SPA after `pnpm --filter use-case-library-frontend build` — the artifacts land in `server/public/`. The API is a small Fastify app; on Vercel or Netlify Functions it should be wrapped as a single function handler. The Dockerfile route is recommended for v1.

## Caching and refresh behavior

The server keeps each repo file in memory for 60 seconds. After that, the next request re-fetches from GitHub. `POST /api/refresh` clears the cache early. It is rate-limited to one call per 30 seconds per IP.

Cache state is exposed at `/api/health` so you can sanity-check the deployed ref:

```json
{ "ok": true, "cache": { "size": 25, "ttlMs": 60000, "ref": "main" } }
```

## Adding a new use case

1. Create `<slug>/use-case.json` and `<slug>/marketing.md` per the schema in `.use-case-library/voice-guide.md`.
2. Add an SVG glyph for the slug in `frontend/src/Illustration.tsx`. Skip this and the site falls back to a generic circle-and-spark glyph.
3. Append the slug to `.use-case-library/catalog.json` in the order it should appear.
4. Commit. The site refreshes within ~1 minute. Re-deploy the container only if you added a new illustration.

## Removing a use case

Remove the slug from `.use-case-library/catalog.json` and add it to the `excluded` array with a reason. Files on disk can stay for history.

## License

Internal. Motion-Creative.
