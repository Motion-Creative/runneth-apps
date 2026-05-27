# File Explorer

A sandbox app that browses your Runneth's filesystem — the "brain" — in the same window as the chat. Navigate the tree, preview file contents, and edit in place. What you see is what your Runneth sees.

## What it does

- Browse every file, routine, and saved note under the agent's brain as a folder tree.
- Open and preview file contents inline.
- Edit files in place, without leaving the app.
- Spot stale files and dead routines at a glance, and confirm a save landed where you expected.

## How it's built

A standard Buildeth app — one frontend and one backend, served on a route:

- **Route:** `/file-explorer` (see `buildeth.app.json`)
- **`frontend/`** — React + Vite; build output in `frontend/dist`
- **`server/`** — backend bundle at `server/dist/index.js`, API under `/file-explorer/api`; reads the live filesystem through the request-scoped runtime context (it does not bind its own port)

## Build & run

```bash
app build file-explorer
app verify file-explorer
```

Then open `/file-explorer`. See the platform `app` CLI (`app list`, `app build`, `app verify`) for the full workflow.

## Note

This app reads and writes the live brain filesystem, so it's an internal/operator tool. It is intentionally **excluded from the public Use Case Library** (`.use-case-library/catalog.json`), alongside the other stateful sandbox apps.
