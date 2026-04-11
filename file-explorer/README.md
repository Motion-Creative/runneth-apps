# Base App Template

This directory is the scaffold copied into each sandbox app workspace.

When you run:

```bash
app create <app-name>
```

the CLI copies this folder to:

```text
/agent/apps/<app-name>
```

Then:

- package names are rewritten to `@buildeth/<app-name>-server` and `@buildeth/<app-name>-frontend`
- a manifest file `buildeth.app.json` is created in the app root
- route defaults to `/<app-name>` (or `--route` if provided)

## CLI Workflow

Use the `app` command only:

```bash
app list
app create <app-name> [--route /custom-route]
app build <app-name>
app verify <app-name>
app remove <app-name>
```

Notes:

- `app update` does not exist.
- `app build` installs dependencies and builds both `server` and `frontend`.
- `app verify` fails unless the frontend bundle exists and the backend bundle loads with a `handleRequest` export.
- `app list` reports `needs-build` until the app passes the same runtime verification.

## Runtime Model

- There is one shared Node process (`buildeth-core`) managed by PM2.
- App backends are loaded in-process by `app_core` from each app's `server/dist/index.js`.
- Frontend is served from each app's `frontend/dist`.
- Backend API path is always under `/api`.

Example route mapping for app `hello-world`:

- frontend: `/<route>` -> `frontend/dist/index.html`
- backend: `/<route>/api/*` -> backend `handleRequest`

## Backend Contract (`server`)

The backend bundle must export:

```ts
export const handleRequest = async (request) => { ... }
```

Request shape:

- `method: string`
- `path: string` (includes `/api/...`)
- `headers: Record<string, string>`
- `body?: unknown`
- `runtime: { appRoot, workspaceId, conversationId, requestId, backendApiUrl, authToken, sandboxAgentApiUrl }`

Response shape:

- `status: number`
- `headers?: Record<string, string>`
- `body?: unknown`

Important:

- Do not call `listen()` or bind ports in app backends.
- The backend is executed through `app_core` in the same Node runtime.
- `app_core` injects request-scoped runtime context into `request.runtime`.
- The base server exports `loadBuildethMotionTools()`, `loadBuildethMemoryTools()`, `loadBuildethReminderTools()`, and `runWithBuildethToolRuntime()` from `server/src/index.ts`.
- Load the runtime tools library from backend route handlers instead of shelling out to `motion`, `memory`, or `reminder`.
- The loaded library already runs with request-scoped runtime context, including workspace, conversation, auth, and app root.
- File-producing Motion library calls such as `creativeInsights(...)` and `inspoCreatives(...)` write under `<app-root>/workdir` automatically when run through the injected runtime context.
- `execBuildethCli({ cli: 'app', ... })` is still available for app-management commands that explicitly need the `app` CLI.
- SQLite is available via Node's built-in `node:sqlite` module.
- The template includes a SQLite helper at `server/src/sqlite.ts`.
- DB file is `<app-root>/app.sqlite`.
- The helper resolves that path from the injected runtime app root, not from the staged build directory.
- `GET /api/sqlite` returns sqlite version + active database path.
- For external API calls from app code, use normal `fetch(...)` (not `secure-fetch`).
- App runtime already wraps `fetch` with the secured runtime guard layer.
- To send secrets, use authorization header placeholders resolved by the runtime guard layer, for example:
  - `Authorization: Bearer {{runneth-secret:OPENAI_API_KEY}}`

## Frontend Contract (`frontend`)

- React + Vite app.
- Build output must go to `frontend/dist`.
- Use relative asset paths (Vite `base: './'`) so apps work under route prefixes.
- Runtime route base is derived from URL pathname first segment.

## Dependencies

Each app has isolated dependencies:

- backend deps in `server/package.json`
- frontend deps in `frontend/package.json`

After changing dependencies, run:

```bash
app build <app-name>
```

## Safe Change Pattern

1. Edit backend in `server/src`.
2. Edit frontend in `frontend/src`.
3. Build with `app build <app-name>`.
4. Run `app verify <app-name>`.
5. Verify with `app list` and by opening `/<route>`.
