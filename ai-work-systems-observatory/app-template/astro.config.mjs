import { readFileSync } from "node:fs";

import { defineConfig } from "astro/config";

import { buildethFavicon } from "./buildeth.favicon.mjs";
import { buildethFaviconPlugin } from "./buildeth-favicon/plugin.mjs";

// public/scripts/phosphor-icons.js is served statically and cannot read
// package.json, so its pinned CDN versions are verified against the
// package manifest here and every build fails fast on skew.
const templatePackage = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);
const phosphorIconsScript = readFileSync(
  new URL("./public/scripts/phosphor-icons.js", import.meta.url),
  "utf8",
);
const webawesomeVersion = templatePackage.buildeth.webawesomeVersion;
const phosphorVersion = templatePackage.dependencies["@phosphor-icons/core"];
if (!phosphorIconsScript.includes(`webawesome@${webawesomeVersion}/`)) {
  throw new Error(
    `public/scripts/phosphor-icons.js does not pin webawesome@${webawesomeVersion}; align it with package.json buildeth.webawesomeVersion.`,
  );
}
if (!phosphorIconsScript.includes(`@phosphor-icons/core@${phosphorVersion}/`)) {
  throw new Error(
    `public/scripts/phosphor-icons.js does not pin @phosphor-icons/core@${phosphorVersion}; align it with the package.json dependency.`,
  );
}

export default defineConfig({
  output: "static",
  vite: {
    plugins: [buildethFaviconPlugin(buildethFavicon)],
  },
});
