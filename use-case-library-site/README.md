# Runneth Library site

The deployed React and Fastify site for the Runneth Library.

The frontend currently shows a rebuilding page while the repository migrates
from use cases to OS packages. Revamp mode is enabled by default and does not
request catalog data.

## Architecture

```text
use-case-library-site/
├── frontend/   React 19 and Vite
├── server/     Fastify API and static frontend
├── Dockerfile
└── package.json
```

The server also hosts the standalone one-pager, brain-building guide, reviews,
and brain-submission routes. Those surfaces are independent of the retired
catalog.

## Running locally

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The server listens on `http://localhost:3000` by default.

For hot reload, run these in separate terminals:

```bash
pnpm dev:server
pnpm dev:frontend
```

## Archived catalog mode

The old catalog frontend remains in the codebase as migration reference. To
render it locally:

```bash
RUNNETH_APPS_REF=pre-cleanup-2026-07-21-with-aligned-onboarding pnpm dev:server
VITE_REVAMP_MODE=false pnpm dev:frontend
```

The server defaults catalog requests to the immutable
`pre-cleanup-2026-07-21-with-aligned-onboarding` tag, so the retired metadata
is not expected on `main`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `RUNNETH_APPS_REF` | `pre-cleanup-2026-07-21-with-aligned-onboarding` | Archived catalog source ref |
| `VITE_REVAMP_MODE` | enabled | Set to `false` only for archived catalog development |
| `LOG_LEVEL` | `info` | Fastify log level |
| `REVIEWS_DB_PATH` | `./reviews.db` locally | SQLite review database |
| `BRAIN_SUBMISSIONS_DB_PATH` | `./brain-submissions.db` locally | SQLite brain-submission database |
| `RESEND_API_KEY` | unset | Flag-email transport |
| `FLAG_TO_EMAIL` | `support@motionapp.com` | Flag recipient |
| `FLAG_FROM_EMAIL` | `onboarding@resend.dev` | Flag sender |
| `IP_HASH_SECRET` | random per boot | Reviewer rate-limit salt |
| `BRAIN_DASHBOARD_TOKEN` | unset | Protects brain-submission routes |
| `TRUST_PROXY_HOPS` | `0` | Reverse-proxy hops trusted when resolving client IPs |

The authenticated brain-submission routes enforce per-client, per-instance
request limits using bounded in-memory storage. Set `TRUST_PROXY_HOPS=1` for
the standard Railway deployment so limits use the forwarded client address
instead of grouping all traffic under the proxy. Keep the default `0` when
the server is exposed directly.

## Deploying

Build from `use-case-library-site/Dockerfile` and expose port `3000`.
`GET /api/health` is the container health endpoint.

For Railway or another persistent deployment, mount `/data` for the reviews
and brain-submissions SQLite databases.

## Restoring the library

The complete historical library is preserved on
[`archive/full-library`](https://github.com/Motion-Creative/runneth-apps/tree/archive/full-library)
and by the `pre-cleanup-2026-07-21-with-aligned-onboarding` tag.

The catalog should only be relaunched publicly after it has been rebuilt
against `package-index.json`; archived catalog mode is not the new package
discovery implementation.
