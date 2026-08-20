// A static import keeps this module ahead of the sibling webawesome.loader.js
// script tag: browsers run module scripts in document order, so the loader
// cannot define <wa-icon> before Phosphor replaces the default library.
// (Top-level await would release that ordering — an async module only blocks
// its importers, not sibling scripts.) The namespace form matters too: the app
// verify render check answers external requests with empty 204 bodies, so
// this CDN module can evaluate without exports there. Icon registration is a
// Web Awesome enhancement: skip it when the runtime is absent, the same way
// undefined wa-* elements stay inert.
import * as webAwesome from "https://ka-f.webawesome.com/webawesome@3.10.0/webawesome.js";

const { registerIconLibrary } = webAwesome;

const PHOSPHOR_CDN =
  "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets";
const weights = new Set(["thin", "light", "bold", "fill", "duotone"]);

if (typeof registerIconLibrary === "function") {
  registerIconLibrary("default", {
    resolver: (name, _family, variant) => {
      const weight = weights.has(variant) ? variant : "regular";

      return weight === "regular"
        ? `${PHOSPHOR_CDN}/regular/${name}.svg`
        : `${PHOSPHOR_CDN}/${weight}/${name}-${weight}.svg`;
    },
    mutator: (svg) => svg.setAttribute("fill", "currentColor"),
  });
}
