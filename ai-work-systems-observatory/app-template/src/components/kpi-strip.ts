/**
 * KPI strip: 2–4 headline metrics in a single bordered container. Each item
 * is value on top, label below, and an optional small delta line (usually
 * the value variance) under that.
 *
 * Astro / HTML:
 *   <kpi-strip items={JSON.stringify([{ value: "$128.4K", label: "Spend", delta: "+22% QoQ", tone: "positive" }, ...])} />
 * Browser TypeScript:
 *   strip.items = [{ value: "$128.4K", label: "Spend" }]
 *
 * Anything other than 2–4 items logs a console error and renders nothing.
 * Layout and dividers live in kpi-strip.css (light DOM).
 */

import {
	BuildethElement,
	defineElement,
	escapeHtml,
	installConfigProperties,
	readJsonAttribute,
	toDisplayString,
} from './internal/runtime';
import { SCAFFOLD_ELEMENT_ATTRIBUTES } from './scaffold-contracts';

import './kpi-strip.css';

export interface KpiItem {
	/** Headline number, e.g. "$128.4K" or "3.4x". */
	readonly value: string;
	/** Legend under the number. */
	readonly label: string;
	/** Small supporting line, usually the variance, e.g. "+22% QoQ". */
	readonly delta?: string;
	/** Tints the delta. Omit for quiet neutral text. */
	readonly tone?: 'positive' | 'negative';
}

// Item values are interpolated into HTML, so non-renderable JSON config is
// sanitized instead of crashing the render: numbers become strings, invalid
// tones fall back to neutral, and items without a usable value and label are
// dropped.
const sanitizeItems = (items: readonly KpiItem[]): KpiItem[] => {
	const sanitized: KpiItem[] = [];
	for (const item of items) {
		const value = toDisplayString(item?.value);
		const label = toDisplayString(item?.label);
		if (value === undefined || label === undefined) {
			continue;
		}
		sanitized.push({
			value,
			label,
			delta: toDisplayString(item.delta),
			tone:
				item.tone === 'positive' || item.tone === 'negative'
					? item.tone
					: undefined,
		});
	}
	if (sanitized.length < items.length) {
		console.warn(
			`kpi-strip dropped ${String(items.length - sanitized.length)} item(s) without a usable value and label.`,
		);
	}
	return sanitized;
};

export class KpiStrip extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['kpi-strip']];

	declare items: readonly KpiItem[] | undefined;

	protected render(): void {
		const items =
			this.configProperty<readonly KpiItem[]>('items') ??
			readJsonAttribute<readonly KpiItem[]>(this, 'items');

		if (!Array.isArray(items) || items.length < 2 || items.length > 4) {
			console.error(
				`kpi-strip expects between 2 and 4 items, received ${
					Array.isArray(items) ? String(items.length) : 'none'
				}.`,
			);
			this.removeAttribute('data-count');
			this.innerHTML = '';
			return;
		}

		const sanitizedItems = sanitizeItems(items);
		if (sanitizedItems.length === 0) {
			this.removeAttribute('data-count');
			this.innerHTML = '';
			return;
		}

		this.setAttribute('data-count', String(sanitizedItems.length));
		this.innerHTML = `<div class="kpi-grid" style="--kpi-count: ${String(
			sanitizedItems.length,
		)};">${sanitizedItems
			.map(
				(item) =>
					`<div class="kpi-item"><div class="kpi-value">${escapeHtml(
						item.value,
					)}</div><div class="kpi-label">${escapeHtml(item.label)}</div>${
						item.delta === undefined
							? ''
							: `<div class="kpi-delta"${
									item.tone === undefined
										? ''
										: ` data-tone="${escapeHtml(item.tone)}"`
								}>${escapeHtml(item.delta)}</div>`
					}</div>`,
			)
			.join('')}</div>`;
	}
}

installConfigProperties(KpiStrip, ['items']);
defineElement('kpi-strip', KpiStrip);

declare global {
	interface HTMLElementTagNameMap {
		'kpi-strip': KpiStrip;
	}
}
