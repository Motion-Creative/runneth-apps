const SUPPORTED_GLOBAL_ATTRIBUTES = new Set([
	'autofocus',
	'class',
	'dir',
	'exportparts',
	'hidden',
	'id',
	'inert',
	'is',
	'lang',
	'part',
	'popover',
	'role',
	'slot',
	'style',
	'tabindex',
	'translate',
]);

const sharedLayoutAttributes = [
	'gap',
	'align-items',
	'justify-content',
] as const;

export const SCAFFOLD_ELEMENT_ATTRIBUTES = {
	'buildeth-theme-toggle': ['floating'],
	'creative-card': [
		'alt',
		'aspect-ratio',
		'badge',
		'description',
		'expandable',
		'fields',
		'fit',
		'heading',
		'media',
		'meta',
		'muted',
		'poster',
		'src',
		'stats',
		'tags',
		'text',
	],
	'creative-chart': [
		'type',
		'data',
		'series',
		'x-key',
		'label-key',
		'image-key',
		'image-alt-key',
		'max-series',
		'height',
		'min-width',
		'grid-lines',
		'show-grid',
		'show-tooltip',
		'show-legend',
		'show-metric-header',
		'show-metric-axes',
		'show-value-labels',
		'image-size',
		'label-max-length',
	],
	'creative-table': [
		'columns',
		'data',
		'sticky-first-column',
		'sticky-header',
		'max-height',
		'zebra',
		'hover-rows',
		'totals',
		'totals-label',
		'page-size',
		'page-size-options',
	],
	'kpi-strip': ['items'],
	'report-entry': ['heading', 'layout', 'description'],
	'report-figure': ['caption', 'number'],
	'report-masthead': ['kicker', 'meta', 'heading'],
	'report-page': ['colophon'],
	'report-section': ['heading'],
} as const;

export const SCAFFOLD_REQUIRED_DEFAULT_SLOT_TAGS = ['report-entry'] as const;

// kpi-strip is a page-level band: directly below report-masthead on report
// pages, or at the top of <main> on dashboards — never inside section or
// entry bodies.
export const SCAFFOLD_DISALLOWED_ANCESTOR_TAGS = {
	'kpi-strip': ['report-entry', 'report-section'],
} as const;

export const buildDisallowedAncestorMessage = (
	tagName: string,
	ancestorTagName: string,
): string =>
	`${tagName}: not allowed inside <${ancestorTagName}>. Place the page's single ${tagName} directly below <report-masthead> on report pages, or at the top of <main> on dashboards — never inside report-section or report-entry bodies.`;

// The report shell markers only exist inside <report-page>. A report built on a
// raw <main>/<wa-page> shell — masthead and sections with no report-page wrapper
// — is malformed and must fail the scan.
export const SCAFFOLD_REQUIRED_ANCESTOR_TAGS = {
	'report-masthead': 'report-page',
	'report-section': 'report-page',
} as const;

export const buildMissingRequiredAncestorMessage = (
	tagName: string,
	requiredAncestorTagName: string,
): string =>
	`${tagName}: must be inside <${requiredAncestorTagName}>. Wrap the report in <${requiredAncestorTagName}> (itself inside <wa-page class="wa-cloak">) and put ${tagName} within it. Do not build a report on a raw <main> or bare <wa-page> shell.`;

// Wrapper tags render nothing by themselves, so a default slot holding only
// these still counts as empty.
export const SCAFFOLD_TRANSPARENT_WRAPPER_TAGS = [
	'article',
	'div',
	'footer',
	'header',
	'layout-cluster',
	'layout-flank',
	'layout-frame',
	'layout-grid',
	'layout-split',
	'layout-stack',
	'main',
	'p',
	'section',
	'span',
] as const;

export const buildEmptyDefaultSlotMessage = (tagName: string): string =>
	`${tagName}: default slot is empty or holds only empty wrappers. The default slot is the entry body; "heading" and "description" render in the label column and do not replace it. Put the entry content (prose, chart, table, or cards) in the default slot.`;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const TRANSPARENT_WRAPPER_TAG_SET: ReadonlySet<string> = new Set<string>(
	SCAFFOLD_TRANSPARENT_WRAPPER_TAGS,
);

// Structural subset of DOM Node, so the browser runtime can pass real slot
// nodes while build-time checks and tests pass plain objects.
export type SlotContentNode = Readonly<{
	childNodes?: ArrayLike<SlotContentNode>;
	nodeType: number;
	tagName?: string;
	textContent?: string | null;
}>;

const nodeHasRenderableContent = (node: SlotContentNode): boolean => {
	if (node.nodeType === TEXT_NODE) {
		return (node.textContent ?? '').trim() !== '';
	}
	if (node.nodeType !== ELEMENT_NODE) {
		return false;
	}
	if (!TRANSPARENT_WRAPPER_TAG_SET.has((node.tagName ?? '').toLowerCase())) {
		return true;
	}
	return Array.from(node.childNodes ?? []).some(nodeHasRenderableContent);
};

export const slotNodesHaveRenderableContent = (
	nodes: ArrayLike<SlotContentNode>,
): boolean => Array.from(nodes).some(nodeHasRenderableContent);

export const LAYOUT_ATTRIBUTE_VALUES = {
	'align-items': ['start', 'end', 'center', 'stretch', 'baseline'],
	aspect: ['square', 'landscape', 'portrait'],
	direction: ['row', 'column'],
	gap: ['0', '3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'],
	'justify-content': [
		'start',
		'end',
		'center',
		'space-around',
		'space-between',
		'space-evenly',
	],
	position: ['start', 'end'],
	radius: ['s', 'm', 'l', 'pill', 'circle', 'square'],
	wrap: ['wrap', 'nowrap', 'wrap-reverse'],
} as const;

export const LAYOUT_TAG_SUPPORTED_ATTRIBUTES = {
	'layout-cluster': [...sharedLayoutAttributes, 'wrap'],
	'layout-flank': [...sharedLayoutAttributes, 'position'],
	'layout-frame': [...sharedLayoutAttributes, 'aspect', 'radius'],
	'layout-grid': sharedLayoutAttributes,
	'layout-split': [...sharedLayoutAttributes, 'direction'],
	'layout-stack': sharedLayoutAttributes,
} as const;

export type ScaffoldElementTagName = keyof typeof SCAFFOLD_ELEMENT_ATTRIBUTES;
export type LayoutTagName = keyof typeof LAYOUT_TAG_SUPPORTED_ATTRIBUTES;
export type LayoutValueAttribute = keyof typeof LAYOUT_ATTRIBUTE_VALUES;
export type LayoutAttributeValue<Name extends LayoutValueAttribute> =
	(typeof LAYOUT_ATTRIBUTE_VALUES)[Name][number];

export interface UnsupportedLayoutAttributeValue {
	readonly attributeName: LayoutValueAttribute;
	readonly supportedValues: readonly string[];
	readonly value: string;
}

const isSupportedGlobalAttribute = (name: string): boolean =>
	SUPPORTED_GLOBAL_ATTRIBUTES.has(name) ||
	name.startsWith('data-') ||
	name.startsWith('aria-');

const hasOwn = <Value extends object>(
	record: Value,
	key: PropertyKey,
): key is keyof Value => Object.prototype.hasOwnProperty.call(record, key);

const isLayoutValueAttribute = (
	attributeName: string,
): attributeName is LayoutValueAttribute =>
	hasOwn(LAYOUT_ATTRIBUTE_VALUES, attributeName);

export const findUnsupportedAttributes = (
	attributeNames: readonly string[],
	supported: readonly string[],
): readonly string[] => {
	const supportedAttributes = new Set(supported);
	return attributeNames.filter(
		(name) => !supportedAttributes.has(name) && !isSupportedGlobalAttribute(name),
	);
};

const quoteAttributeNames = (names: readonly string[]): string =>
	names.map((name) => `"${name}"`).join(', ');

export const buildUnsupportedAttributeMessage = (
	tagName: string,
	unsupported: readonly string[],
	supported: readonly string[],
): string => {
	const unsupportedLabel =
		unsupported.length === 1 ? 'attribute' : 'attributes';
	const supportedLabel =
		supported.length === 0 ? 'none' : supported.join(', ');
	const headingHint =
		supported.includes('heading') &&
		unsupported.some((name) => name === 'title' || name === 'subtitle')
			? ' (use "heading")'
			: '';
	return `${tagName}: unsupported ${unsupportedLabel} ${quoteAttributeNames(
		unsupported,
	)}${headingHint}. Supported attributes: ${supportedLabel}.`;
};

export const findUnsupportedLayoutAttributeValues = (
	attributeValues: Readonly<Record<string, string>>,
	supported: readonly string[],
): readonly UnsupportedLayoutAttributeValue[] => {
	const supportedAttributes = new Set(supported);
	const unsupported: UnsupportedLayoutAttributeValue[] = [];
	for (const [attributeName, value] of Object.entries(attributeValues)) {
		if (
			!supportedAttributes.has(attributeName) ||
			!isLayoutValueAttribute(attributeName)
		) {
			continue;
		}
		const supportedValues: readonly string[] =
			LAYOUT_ATTRIBUTE_VALUES[attributeName];
		if (!supportedValues.includes(value)) {
			unsupported.push({
				attributeName,
				supportedValues,
				value,
			});
		}
	}
	return unsupported;
};

export const buildUnsupportedLayoutAttributeValueMessage = (
	tagName: string,
	unsupported: readonly UnsupportedLayoutAttributeValue[],
): string => {
	const valueMessages = unsupported
		.map(
			(item) =>
				`unsupported value "${item.value}" for attribute "${item.attributeName}"`,
		)
		.join('; ');
	const supportedMessages = unsupported
		.map(
			(item) =>
				`${item.attributeName}: ${item.supportedValues.join(', ')}`,
		)
		.join('; ');
	return `${tagName}: ${valueMessages}. Supported values: ${supportedMessages}.`;
};
