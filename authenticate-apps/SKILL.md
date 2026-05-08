# Skill: authenticate-apps

**Purpose:** Add a self-bootstrapping login layer to a sandbox app. The user picks credentials in their browser on the first visit; from then on the app is gated behind `/login`. No secrets pass through chat. No external dependencies beyond Node built-ins and Fastify.

---

## When To Run This Skill

When a user wants to password-protect a sandbox app they already have running, or when they want every new app of theirs to ship with auth wired in.

Do not run this skill to add auth to apps the agent does not own (e.g. third-party hosted services). This is for sandbox apps under `/agent/apps/`.

---

## Prerequisites

- The target app exists. Run `app list` to confirm and read its `route`.
- The target app uses the standard Fastify scaffold from `app create`, OR runs an Express app dispatched from a Fastify shell (the bridge case).
- The agent has read the target app's `buildeth.app.json` to know its `route` and `backend.entry`.

If the target app is pure Express with no Fastify in front, ask before proceeding — this plugin assumes Fastify is registering the routes.

---

## Step 1 — Resolve the target app

Read these from the target app:

```bash
app list
cat /agent/apps/<app-name>/buildeth.app.json
```

Capture:

- `APP_NAME` — folder under `/agent/apps/`
- `APP_BASE_PATH` — the `route` field from the manifest (e.g. `/my-app`)
- `APP_LABEL` — human-friendly app name to show in setup/login UI. Ask the user if it is not obvious from the folder name.

Also pick a credentials path. Default: `${BUILDETH_APP_ROOT}/.auth/credentials.json`, which keeps credentials inside the app dir and out of source. If the user wants credentials to survive an `app remove`, place them in the workspace config tree instead:

```
/agent/workspaces/<workspaceId>/config/<APP_NAME>/credentials.json
```

Resolve the workspaceId from `buildeth.app.json` if you need that path.

---

## Step 2 — Copy the auth plugin into the app

Copy `auth.mjs` from this package to:

```
/agent/apps/<APP_NAME>/server/auth.mjs
```

Sibling to `src/`, `dist/`, `package.json`. Do not place it inside `src/`. The plugin is plain ES modules and is loaded by the compiled `dist/index.js` via dynamic import; placing it inside `src/` would expose it to `tsc` and is not necessary.

---

## Step 3 — Register the plugin in the backend entrypoint

Open the target app's `server/src/index.ts`. Find the bootstrap block where Fastify routes get registered. The standard scaffold has either an immediate IIFE or a deferred `bootstrap()` function with the registrations inside.

Add the auth plugin registration **before any of the app's own routes are added**, so the gating `onRequest` hook fires for every request:

```ts
const authPlugin = (await import('../auth.mjs')).default
await server.register(authPlugin, {
  basePath: '<APP_BASE_PATH>',
  credentialsPath: process.env.AUTH_CREDENTIALS_PATH
    ?? `${process.env.BUILDETH_APP_ROOT}/.auth/credentials.json`,
  appLabel: '<APP_LABEL>',
  cookieName: '<APP_NAME>_session',
  allowPaths: ['/api/health'],
})
```

Notes:

- Fill in `<APP_BASE_PATH>`, `<APP_LABEL>`, and `<APP_NAME>` from Step 1. The cookie name should be unique per app to avoid collisions when multiple apps share the same hostname.
- `allowPaths` is the list of paths that bypass auth. Keep `/api/health` open for uptime probes. Add others only if there is a real reason.
- If the target app uses dynamic-import cache-busting elsewhere (e.g. `import('../something.mjs?v=...')`), apply the same pattern here. Otherwise the static form is fine.

Do not add new dependencies. The plugin uses only `node:crypto`, `node:fs`, and Fastify itself.

---

## Step 4 — Build and verify

```bash
app build <APP_NAME>
app verify <APP_NAME>
app list
```

Confirm `status=ready`.

---

## Step 5 — First-time setup in the browser

Hand the public app URL back through the active surface. Tell the user:

> The first visit will route you to `/setup`. Pick a username and password (8+ characters), confirm the password, and save. You will be signed in immediately.

Do not ask the user to type the password into chat. Setup happens entirely in the browser; the password is scrypt-hashed before it touches disk.

---

## Step 6 — Confirm gating works

After the user has completed setup, sanity-check that auth is enforced:

```bash
curl -si http://${SPAWNETH_HOST}<APP_BASE_PATH>/ | head -5
# expect: HTTP/1.1 303 See Other  ·  location: <APP_BASE_PATH>/login
```

Health endpoint should still be open:

```bash
curl -s http://${SPAWNETH_HOST}<APP_BASE_PATH>/api/health
```

---

## Common adjustments

| Need | What to change |
|---|---|
| Rotate the password | Delete the credentials file. The next visit re-bootstraps via `/setup`. |
| Change session cookie lifetime | Edit `MAX_AGE_MS` in `auth.mjs`. |
| Open another endpoint to public access | Add it to `allowPaths` at registration time. |
| Mount auth under a non-root backend prefix | Set `basePath` to match the app's public route. The plugin uses it for redirects only; route registration stays at `/setup`, `/login`, `/logout`. |
| Multiple apps on the same host | Give each one a unique `cookieName`. |

---

## Anti-patterns to avoid

- **Do not collect the user's chosen password through chat.** Setup happens in the browser via the inline form. The password is hashed before it reaches disk.
- **Do not reuse the password as the cookie HMAC secret.** The plugin generates a separate random `cookieSecret` at setup time and uses it for cookie signing. Password rotation can then be decoupled from session invalidation.
- **Do not store the credentials file inside the app frontend bundle, the source tree the user might commit, or any path under `pages/` or `frontend/dist/`.** Use `${BUILDETH_APP_ROOT}/.auth/` (default) or the workspace config tree.
- **Do not parse `application/x-www-form-urlencoded` bodies in the gateway.** The plugin's forms POST as `application/json` via inline fetch. Adding urlencoded parsers is unnecessary and increases attack surface.
- **Do not gate `/api/health`.** Uptime probes need a stable open path.

---

## Fallbacks

- **Plugin file in wrong place:** If `dist/index.js` cannot resolve `../auth.mjs`, confirm `auth.mjs` is sibling to `src/`, not inside it.
- **Edits not taking effect:** ESM caches modules by URL. Use the cache-busting dynamic import form (`import('../auth.mjs?v=' + Date.now())`) if you plan to edit `auth.mjs` in place during development.
- **`FST_ERR_CTP_INVALID_MEDIA_TYPE` on form submit:** The form must POST `application/json`. The shipped templates do this via inline fetch. If you replace the templates, keep that behavior.
- **Setup never appears:** Check that the `onRequest` hook is registered before the app's own catch-all handlers. If the app already responds to `/`, register the auth plugin earlier in bootstrap.
