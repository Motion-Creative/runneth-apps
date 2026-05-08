# authenticate-apps

**Add a self-bootstrapping login layer to any Runneth sandbox app. The first browser visit picks a username and password; from then on the app is gated behind /login.**

No secrets pass through chat. No external dependencies beyond Node built-ins and Fastify.

**Install time:** ~3 minutes
**Requires:** A sandbox app using the standard Fastify scaffold (or an Express app dispatched from a Fastify shell). Nothing else.

---

## What this enables

Drop a single `.mjs` file into a sandbox app, register one Fastify plugin, rebuild. The first visit to the public URL routes the user to `/setup` where they pick a username and password in the browser. The password is scrypt-hashed before it touches disk; a separate random secret is generated for signing session cookies. From then on, everything outside `/api/health` is gated behind `/login`.

This is the same auth layer used by `runneth-dashboard`, packaged so any app in any sandbox can install it.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `auth.mjs` | `/agent/apps/{{APP_NAME}}/server/auth.mjs` | The Fastify plugin. Self-contained: scrypt hashing, HMAC-signed cookies, inline setup + login pages. |
| `SKILL.md` | `/agent/.agents/skills/authenticate-apps/SKILL.md` | Walks an agent through the integration steps in any future app. |

The integration step itself — adding the plugin registration to `server/src/index.ts` — is a small code patch the skill applies to the target app. See `integration-snippet.md` for the exact code.

---

## What to customize

| Token | Default | When to change |
|---|---|---|
| `{{APP_NAME}}` | — | Always required. The folder under `/agent/apps/`. |
| `{{APP_BASE_PATH}}` | — | Always required. The `route` field from `buildeth.app.json`. |
| `{{APP_LABEL}}` | `App` | Human-friendly name shown in the setup and login UI. |

The plugin itself accepts more options at registration time (`cookieName`, `credentialsPath`, `allowPaths`). See `integration-snippet.md` and the plugin's header comment.

---

## How it works

**On first visit:**
1. The plugin's `onRequest` hook checks for a credentials file at the configured path.
2. If absent, every request outside the allow-list redirects to `/setup`.
3. The setup page shows a username + password form. On submit, the password is scrypt-hashed (with a per-credential salt), a 32-byte random `cookieSecret` is generated, and the bundle is written to disk with mode `0o600`.
4. The user is signed in immediately via a 30-day HMAC-signed session cookie. No second login round-trip.

**On subsequent visits:**
1. The hook reads the credentials file (cached by mtime).
2. Verifies the session cookie's HMAC against the stored `cookieSecret`.
3. If valid, request proceeds.
4. If missing or invalid, redirect to `/login` (or 401 JSON for `/api/*` paths).

**On `/login` POST:**
1. Username compared with `timingSafeEqual`.
2. Password re-hashed with the stored salt and compared with `timingSafeEqual`.
3. On success, a fresh signed cookie is issued; user redirects to the `next` path (sanitized to require a leading `/`).

**Cookie HMAC secret is decoupled from the password.** Rotating the password does not have to invalidate sessions. To kick everyone out, delete the credentials file and re-bootstrap.

---

## Form submission

Forms POST `application/json`, not `application/x-www-form-urlencoded`. The gateway's Fastify only parses JSON by default and returns `FST_ERR_CTP_INVALID_MEDIA_TYPE` for urlencoded bodies. The plugin's setup and login pages include a small inline `fetch()` handler that converts the form data to JSON before submitting.

If you swap in your own form templates, keep that behavior.

---

## Post-install

The plugin self-registers its routes (`/setup`, `/login`, `/logout`) and a global `onRequest` hook. There is no nightly job, no external service, no third-party SDK. Once the app is built and verified, open the public URL in a browser and complete setup.

To rotate credentials, delete:

```
${BUILDETH_APP_ROOT}/.auth/credentials.json
```

The next visit will re-bootstrap.

---

## Fallbacks

- **App is pure Express, no Fastify:** Use the same logic but adapt the route handlers to Express's `(req, res, next)` signature. The hashing and cookie code in `auth.mjs` is framework-agnostic.
- **App needs a different open path:** Add it to `allowPaths` at registration time. Default is `['/api/health']`.
- **Multiple apps on the same hostname:** Give each one a distinct `cookieName` so their session cookies do not collide.
- **Forgotten password:** No recovery flow. Delete the credentials file and re-run setup.

---

## Version history

See `install-config.json` changelog.
