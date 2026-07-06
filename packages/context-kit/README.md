# Context Kit package

Builds the institutional knowledge that makes every Runneth answer sharper: brain scaffolds, a board app
(read-only mirror of completeness), and the "build my Context Kit" skill.

## App build gotchas (learned in staging — read before editing the app)

- **`buildeth.app.json` must be v3** with `conversationId`, `workspaceId`, `oauthEnabled: true`,
  `data: { "dir": "data" }`, `static: { "dist": "dist", "index": "index.html" }`. It ships as a template
  with `__CONVERSATION_ID__` / `__WORKSPACE_ID__` tokens the skill substitutes before `app build`.
- **`astro.config.mjs` must set `base: "/context-kit"`** (and `trailingSlash: "never"`). Without a base,
  Astro emits absolute `/_astro/...` asset URLs and `app build` rejects the static output.
- **Use `<style is:global>`.** Astro scopes `<style>` by default via a build-time `data-astro-cid` attribute
  that JS-created elements never get, so scoped rules (including `display:none` on panels) silently do not
  apply to dynamically rendered DOM. This board renders cards in JS, so styles must be global.
- **State is fetched at runtime, not imported at build.** `index.astro` fetches
  `/context-kit/data/context-kit-state.json` and the Bucket B `data/*.md` files on load, so brain updates
  show on refresh with no rebuild. Never go back to a static `import` of the state JSON.
- **Package sync does not run `app build`.** The skill (or an operator) builds on first run.

## Manifest note

The VM installer reads `package.json`; the runneth-apps index validator reads `runneth-package.json`.
Both are shipped with identical resource lists until that contract is reconciled.
