/**
 * Light/dark theme toggle button. Theme state lives in Base.astro, which owns
 * persistence, the no-flash boot, and system-preference sync; this element
 * only dispatches `buildeth:set-theme` and re-syncs its icon on
 * `buildeth:theme-change`. Works anywhere inside a Base page: a wa-page
 * header slot, a toolbar, or floating on headerless pages via the `floating`
 * attribute (the element owns its fixed top-corner placement; never wrap it
 * in page-authored overlay CSS).
 *
 * Astro / HTML:  <buildeth-theme-toggle />
 *                <buildeth-theme-toggle floating />
 */

import { defineElement, readBooleanAttribute } from './internal/runtime';

const isDark = (): boolean =>
	document.documentElement.classList.contains('wa-dark');

export class BuildethThemeToggle extends HTMLElement {
	static get observedAttributes(): readonly string[] {
		return ['floating'];
	}

	#onThemeChange = (): void => {
		this.#sync();
	};

	#onClick = (): void => {
		document.dispatchEvent(
			new CustomEvent('buildeth:set-theme', {
				detail: { theme: isDark() ? 'light' : 'dark' },
			}),
		);
	};

	connectedCallback(): void {
		if (this.childElementCount === 0) {
			this.innerHTML =
				'<wa-button appearance="plain" type="button" size="s">' +
				'<wa-icon name="moon" label="Toggle theme"></wa-icon>' +
				'</wa-button>';
		}
		this.#sync();
		this.#syncFloating();
		document.addEventListener('buildeth:theme-change', this.#onThemeChange);
		this.addEventListener('click', this.#onClick);
	}

	attributeChangedCallback(): void {
		this.#syncFloating();
	}

	disconnectedCallback(): void {
		document.removeEventListener(
			'buildeth:theme-change',
			this.#onThemeChange,
		);
		this.removeEventListener('click', this.#onClick);
	}

	#syncFloating(): void {
		if (readBooleanAttribute(this, 'floating', false)) {
			this.style.position = 'fixed';
			this.style.insetBlockStart = 'var(--wa-space-s)';
			this.style.insetInlineEnd = 'var(--wa-space-s)';
			return;
		}
		this.style.removeProperty('position');
		this.style.removeProperty('inset-block-start');
		this.style.removeProperty('inset-inline-end');
	}

	#sync(): void {
		const label = isDark()
			? 'Switch to light theme'
			: 'Switch to dark theme';
		const button = this.querySelector('wa-button');
		button?.setAttribute('aria-label', label);
		const icon = this.querySelector('wa-icon');
		icon?.setAttribute('name', isDark() ? 'sun' : 'moon');
		icon?.setAttribute('label', label);
	}
}

defineElement('buildeth-theme-toggle', BuildethThemeToggle);

declare global {
	interface HTMLElementTagNameMap {
		'buildeth-theme-toggle': BuildethThemeToggle;
	}
}
