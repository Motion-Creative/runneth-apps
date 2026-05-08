# Integration snippet

The auth plugin is a Fastify plugin. Register it on the existing Fastify instance, before any of the app's own routes, so the gating `onRequest` hook fires for every request the app might serve.

The plugin file lives outside `server/src/` so `tsc` does not compile it. Load it via dynamic `import()` and register it during the same async bootstrap your backend already uses.

## Standard scaffold (Fastify)

In `server/src/index.ts`, add the registration during bootstrap:

```ts
// Add near the top of bootstrap, before any fastify.get/post/put calls
const authPlugin = (await import('../auth.mjs')).default
await server.register(authPlugin, {
  basePath: '{{APP_BASE_PATH}}',
  credentialsPath: process.env.AUTH_CREDENTIALS_PATH
    ?? `${process.env.BUILDETH_APP_ROOT}/.auth/credentials.json`,
  appLabel: '{{APP_LABEL}}',
  cookieName: '{{APP_NAME}}_session',
  allowPaths: ['/api/health'],
})
```

If the backend runs the standard `app create` scaffold, this is the only change needed. The plugin owns `/setup`, `/login`, `/logout`, and gates everything else.

## ESM cache busting

The Fastify scaffold's compiled `dist/index.js` is reused across rebuilds, but child `.mjs` imports are cached by URL. If you edit `auth.mjs` after the runtime has already loaded it, append a build stamp to bust the cache:

```ts
const cacheBust = String(Date.now())
const authPlugin = (await import(`../auth.mjs?v=${cacheBust}`)).default
```

You only need this if you plan to edit `auth.mjs` in place. If you copy it once and leave it alone, the static `import('../auth.mjs')` form is fine.

## Express bridge case

If the app runs Express inside Fastify (e.g. via `light-my-request` dispatch to an Express app), the Fastify plugin still works as long as the auth routes are registered on the outer Fastify instance, before requests are dispatched into Express. The `onRequest` hook gates incoming requests before Express sees them, and the auth-owned paths (`/setup`, `/login`, `/logout`) reply directly without ever entering Express.

## Required Fastify behavior

- Body parsing: Fastify's default JSON parser must be active (it is by default). The setup and login forms post `application/json`. Do not disable the default parser.
- Cookie parsing: not required — the plugin parses cookies manually from `req.headers.cookie`.
- Hooks: the plugin adds one `onRequest` hook globally. If your app already registers `onRequest` hooks, they will all run; ordering follows registration order.
