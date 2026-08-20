/**
 * Shared runtime for the Buildeth custom elements: an idempotent registrar,
 * attribute readers, config property plumbing, and a base class that batches
 * renders behind a microtask.
 *
 * Config contract (see src/components/index.ts):
 *   - In Astro pages and plain HTML, every option is a kebab-case attribute
 *     (`x-key`, `page-size`). Complex options (arrays/objects) are JSON
 *     strings (`data={JSON.stringify(rows)}` in Astro).
 *   - In browser TypeScript, every option is a camelCase property (`xKey`,
 *     `pageSize`, `data`). Elements install a property accessor per option via
 *     `installConfigProperties`; await `customElements.whenDefined(tagName)`
 *     before assigning runtime values.
 *   - Effective config resolution: property if set, else attribute, else
 *     the element default.
 *   - Boolean attributes: absent uses the default, the literal string
 *     "false" disables, any other presence (including empty) enables.
 */

import {
	buildUnsupportedAttributeMessage,
	findUnsupportedAttributes,
} from '../scaffold-contracts';

export const defineElement = (
	tagName: string,
	elementClass: CustomElementConstructor,
): void => {
	if (customElements.get(tagName) === undefined) {
		customElements.define(tagName, elementClass);
	}
};

export const readJsonAttribute = <Value>(
	element: HTMLElement,
	name: string,
): Value | undefined => {
	const raw = element.getAttribute(name);
	if (raw === null || raw.trim() === '') {
		return undefined;
	}
	return JSON.parse(raw) as Value;
};

export const readStringAttribute = (
	element: HTMLElement,
	name: string,
): string | undefined => {
	const raw = element.getAttribute(name);
	return raw === null || raw === '' ? undefined : raw;
};

export const readNumberAttribute = (
	element: HTMLElement,
	name: string,
): number | undefined => {
	const raw = element.getAttribute(name);
	if (raw === null || raw.trim() === '') {
		return undefined;
	}
	const value = Number(raw);
	if (!Number.isFinite(value)) {
		throw new Error(
			`<${element.tagName.toLowerCase()}> attribute "${name}" must be a finite number, received "${raw}".`,
		);
	}
	return value;
};

export const readBooleanAttribute = (
	element: HTMLElement,
	name: string,
	defaultValue: boolean,
): boolean => {
	const raw = element.getAttribute(name);
	if (raw === null) {
		return defaultValue;
	}
	return raw !== 'false';
};

/**
 * The Web Awesome CDN autoloader only discovers `wa-*` tags in the light
 * DOM (querySelectorAll does not pierce shadow roots). Elements that render
 * `wa-*` components inside a shadow root call this with the tags they use:
 * for each not-yet-defined tag it plants a hidden light-DOM seed node for
 * the autoloader to find, then removes it once the definition lands —
 * `customElements.define` upgrades shadow-root instances globally.
 */
export const ensureWaComponentsDiscoverable = (
	tagNames: readonly string[],
): void => {
	for (const tagName of tagNames) {
		if (customElements.get(tagName) !== undefined) {
			continue;
		}
		const existingSeed = document.querySelector(
			`[data-wa-autoload-seed="${tagName}"]`,
		);
		if (existingSeed !== null) {
			continue;
		}
		const seed = document.createElement(tagName);
		seed.setAttribute('data-wa-autoload-seed', tagName);
		seed.hidden = true;
		seed.style.display = 'none';
		document.body.append(seed);
		void customElements.whenDefined(tagName).then(() => {
			seed.remove();
		});
	}
};

export const escapeHtml = (value: string): string =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

// JSON config parsed from attributes/properties is not type-checked, so
// interpolated values may arrive as raw numbers instead of the declared
// pre-formatted strings.
export const toDisplayString = (value: unknown): string | undefined =>
	typeof value === 'string'
		? value
		: typeof value === 'number' && Number.isFinite(value)
			? String(value)
			: undefined;

type ConfigCarrier = {
	configProperties: Record<string, unknown>;
	scheduleRender: () => void;
};

type ConfigConstructor = CustomElementConstructor & {
	configPropertyNames?: readonly string[];
	observedAttributes?: readonly string[];
};

/**
 * Installs a camelCase property accessor per config option on the element
 * prototype. Setting a property stores the value and schedules a render.
 * Call once right after the class declaration, then add matching `declare`
 * members to the class for framework-neutral DOM typing:
 *
 *   installConfigProperties(CreativeChart, ['data', 'series', 'xKey']);
 */
export const installConfigProperties = (
	elementClass: ConfigConstructor,
	names: readonly string[],
): void => {
	elementClass.configPropertyNames = names;
	for (const name of names) {
		Object.defineProperty(elementClass.prototype, name, {
			configurable: true,
			enumerable: true,
			get(this: ConfigCarrier) {
				return this.configProperties[name];
			},
			set(this: ConfigCarrier, value: unknown) {
				this.configProperties[name] = value;
				this.scheduleRender();
			},
		});
	}
};

/**
 * Base class for config-driven elements. Subclasses declare
 * `static observedAttributes`, implement `render()`, and resolve options
 * with `configProperty()` falling back to attribute readers. Renders are
 * coalesced into a single microtask so setting several properties
 * re-renders once.
 */
export abstract class BuildethElement extends HTMLElement {
	configProperties: Record<string, unknown> = {};

	#renderScheduled = false;

	connectedCallback(): void {
		this.#upgradeConfigProperties();
		this.scheduleRender();
	}

	attributeChangedCallback(): void {
		this.scheduleRender();
	}

	scheduleRender(): void {
		if (this.#renderScheduled) {
			return;
		}
		this.#renderScheduled = true;
		queueMicrotask(() => {
			this.#renderScheduled = false;
			if (this.isConnected) {
				const supported =
					(this.constructor as ConfigConstructor).observedAttributes ?? [];
				const unsupported = findUnsupportedAttributes(
					this.getAttributeNames(),
					supported,
				);
				if (unsupported.length > 0) {
					console.error(
						buildUnsupportedAttributeMessage(
							this.tagName.toLowerCase(),
							unsupported,
							supported,
						),
					);
				}
				this.render();
			}
		});
	}

	protected configProperty<Value>(name: string): Value | undefined {
		return this.configProperties[name] as Value | undefined;
	}

	protected abstract render(): void;

	/**
	 * Values assigned before custom-element upgrade land as own properties that
	 * shadow the prototype accessors. Re-route them through the accessors.
	 */
	#upgradeConfigProperties(): void {
		const names = (this.constructor as ConfigConstructor)
			.configPropertyNames;
		if (names === undefined) {
			return;
		}
		const record = this as unknown as Record<string, unknown>;
		for (const name of names) {
			if (Object.hasOwn(this, name)) {
				const value = record[name];
				delete record[name];
				record[name] = value;
			}
		}
	}

}
