/** Framework-neutral DOM typings for the CSS-rendered layout tags. */

declare global {
	interface HTMLElementTagNameMap {
		'layout-cluster': HTMLElement;
		'layout-flank': HTMLElement;
		'layout-frame': HTMLElement;
		'layout-grid': HTMLElement;
		'layout-split': HTMLElement;
		'layout-stack': HTMLElement;
	}
}

export {};
