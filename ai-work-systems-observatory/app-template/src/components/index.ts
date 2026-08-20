/**
 * Buildeth custom elements: framework-agnostic components usable from Astro,
 * browser TypeScript, and plain HTML. Base.astro imports this module once per
 * page, which loads all element definitions and their CSS — pages never import
 * components to register them.
 *
 * Element config contract:
 *   - Astro / HTML: kebab-case attributes; arrays/objects are JSON strings
 *     (`data={JSON.stringify(rows)}` in Astro templates).
 *   - Browser TypeScript: camelCase properties with real values
 *     (`table.data = rows`) after `customElements.whenDefined(tagName)`.
 *   - Boolean options: absent = default, the string "false" disables, any
 *     other presence enables.
 *
 * The layout-* tags in layout.css keep CSS-only rendering, with
 * validation-only registrations in layout-tag-guards.ts.
 */

import './layout.css';

import './buildeth-theme-toggle';
import './creative-chart';
import './creative-table';
import './kpi-strip';
import './layout-tag-guards';
