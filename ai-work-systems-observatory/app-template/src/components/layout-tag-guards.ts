import {
	buildUnsupportedAttributeMessage,
	buildUnsupportedLayoutAttributeValueMessage,
	findUnsupportedAttributes,
	findUnsupportedLayoutAttributeValues,
	LAYOUT_TAG_SUPPORTED_ATTRIBUTES,
	type LayoutTagName,
} from './scaffold-contracts';

const hasOwn = <Value extends object>(
	record: Value,
	key: PropertyKey,
): key is keyof Value => Object.prototype.hasOwnProperty.call(record, key);

const isLayoutTagName = (tagName: string): tagName is LayoutTagName =>
	hasOwn(LAYOUT_TAG_SUPPORTED_ATTRIBUTES, tagName);

const getAttributeValues = (
	element: HTMLElement,
): Readonly<Record<string, string>> => {
	const values: Record<string, string> = {};
	for (const attributeName of element.getAttributeNames()) {
		const value = element.getAttribute(attributeName);
		if (value !== null) {
			values[attributeName] = value;
		}
	}
	return values;
};

if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
	const defineLayoutElement = (
		tagName: string,
		elementClass: CustomElementConstructor,
	): void => {
		if (customElements.get(tagName) === undefined) {
			customElements.define(tagName, elementClass);
		}
	};

	class LayoutTagGuard extends HTMLElement {
		connectedCallback(): void {
			const tagName = this.tagName.toLowerCase();
			if (!isLayoutTagName(tagName)) {
				return;
			}

			const supported = LAYOUT_TAG_SUPPORTED_ATTRIBUTES[tagName];
			const unsupportedAttributes = findUnsupportedAttributes(
				this.getAttributeNames(),
				supported,
			);
			const unsupportedValues = findUnsupportedLayoutAttributeValues(
				getAttributeValues(this),
				supported,
			);
			if (unsupportedAttributes.length === 0 && unsupportedValues.length === 0) {
				return;
			}

			const messages = [
				unsupportedAttributes.length === 0
					? ''
					: buildUnsupportedAttributeMessage(
							tagName,
							unsupportedAttributes,
							supported,
						),
				unsupportedValues.length === 0
					? ''
					: buildUnsupportedLayoutAttributeValueMessage(tagName, unsupportedValues),
			].filter((message) => message !== '');
			console.error(messages.join(' '));
		}
	}

	for (const tagName of Object.keys(
		LAYOUT_TAG_SUPPORTED_ATTRIBUTES,
	) as LayoutTagName[]) {
		// customElements.define rejects reusing one constructor for a second
		// tag name, so each tag gets its own subclass.
		defineLayoutElement(tagName, class extends LayoutTagGuard {});
	}
}
