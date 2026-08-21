/** Framework-neutral DOM typings for Web Awesome custom elements. */

import type { PhosphorIconName } from "./phosphor-icon-name";

export interface WaIconAttributes {
  readonly name?: PhosphorIconName;
  readonly family?: string;
  readonly label?: string;
  readonly library?: string;
  readonly variant?: string;
  readonly [attributeName: string]: unknown;
}

export interface WaIconElement extends HTMLElement {
  family: string;
  label: string;
  library: string;
  name: PhosphorIconName;
  variant: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "wa-icon": WaIconElement;
    [waTag: `wa-${string}`]: HTMLElement;
  }
}

export {};
