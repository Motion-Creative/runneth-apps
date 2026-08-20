/**
 * Creative data table built on Web Awesome's native table styles.
 *
 * Astro / HTML:
 *   <creative-table
 *     columns={JSON.stringify(columns)}
 *     data={JSON.stringify(rows)}
 *     sticky-header
 *     page-size="25"
 *   />
 * Browser TypeScript:
 *   table.columns = columns; table.data = rows; table.stickyHeader = true
 *
 * Invalid or missing columns/data logs a console error and renders nothing.
 */

import { formatPercentPoints } from './internal/number-format';
import {
	BuildethElement,
	defineElement,
	ensureWaComponentsDiscoverable,
	escapeHtml,
	installConfigProperties,
	readBooleanAttribute,
	readJsonAttribute,
	readNumberAttribute,
	readStringAttribute,
} from './internal/runtime';
import { SCAFFOLD_ELEMENT_ATTRIBUTES } from './scaffold-contracts';

import './creative-table.css';

export interface CellColor {
	/** `scale` = continuous heatmap; `steps` = discrete tint past thresholds. */
	readonly type: 'scale' | 'steps';
	/** Heatmap palette for `scale`. Defaults to brand. */
	readonly variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
	/** Domain overrides for `scale`. Default: column min/max. */
	readonly min?: number;
	readonly max?: number;
	/** `steps`: values at or past this threshold tint positive. */
	readonly good?: number;
	/** `steps`: values at or past this threshold tint negative. */
	readonly bad?: number;
	/** Lower values are better (e.g. CPA) — flips both modes. */
	readonly lowerIsBetter?: boolean;
}

export interface Column {
	/** Field in each row holding this column's value. */
	readonly key: string;
	/** Header text. Defaults to the key. */
	readonly label?: string;
	/** Defaults to `end` for formatted (numeric) columns, `start` otherwise. */
	readonly align?: 'start' | 'center' | 'end';
	/** Intl-based numeric formatting. `percent` uses percentage points. */
	readonly format?: 'number' | 'compact' | 'currency' | 'percent';
	/** ISO currency code when format is `currency`. Default 'USD'. */
	readonly currency?: string;
	/** Max fraction digits override. */
	readonly decimals?: number;
	/** Field with a thumbnail image URL rendered before the value. */
	readonly imageKey?: string;
	/** Footer aggregate over the full dataset. */
	readonly total?: 'sum' | 'avg' | 'min' | 'max' | 'count';
	/** Literal footer cell text (e.g. "42 creatives"); wins over `total`. */
	readonly totalLabel?: string;
	/** Cell coloring rule. */
	readonly color?: CellColor;
	/** Min-width for the column (any CSS length). */
	readonly width?: string;
}

export type TableRow = Record<string, unknown>;

const HEAT_MIN_MIX = 8;
const HEAT_MAX_MIX = 48;

const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));

const toNumber = (value: unknown): number | undefined => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return undefined;
};

const formatNumeric = (value: number, column: Column): string => {
	const format = column.format ?? 'number';
	const currency = column.currency ?? 'USD';
	const decimals = column.decimals;

	if (format === 'compact') {
		return new Intl.NumberFormat(undefined, {
			notation: 'compact',
			maximumFractionDigits: decimals ?? 1,
		}).format(value);
	}

	if (format === 'currency') {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			maximumFractionDigits: decimals ?? 2,
			trailingZeroDisplay: 'stripIfInteger',
		}).format(value);
	}

	if (format === 'percent') {
		return formatPercentPoints(value, decimals ?? 1);
	}

	if (decimals != null) {
		return new Intl.NumberFormat(undefined, {
			maximumFractionDigits: decimals,
		}).format(value);
	}

	const rounded =
		Math.abs(value) < 1 ? Number(value.toFixed(2)) : Number(value.toFixed(1));

	return Number.isInteger(rounded)
		? rounded.toLocaleString()
		: rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatCell = (raw: unknown, column: Column): string => {
	if (!column.format) {
		return raw == null || raw === '' ? '—' : String(raw);
	}
	const value = toNumber(raw);
	return value == null ? '—' : formatNumeric(value, column);
};

const alignFor = (column: Column): 'start' | 'center' | 'end' =>
	column.align ?? (column.format ? 'end' : 'start');

const ALIGN_VALUES: ReadonlySet<string> = new Set(['start', 'center', 'end']);
const COLOR_VARIANT_VALUES: ReadonlySet<string> = new Set([
	'brand',
	'success',
	'warning',
	'danger',
	'neutral',
]);
const CSS_LENGTH_PATTERN = /^(0|\d*\.?\d+(px|rem|em|ch|vw|vh|vmin|vmax|%))$/;

// `align`, `color.variant`, and `width` are interpolated into HTML attributes,
// so they must be validated at runtime — the TS union is not enforced on JSON
// config parsed from attributes/properties.
const findUnsupportedColumnValue = (
	columns: readonly Column[],
): string | undefined => {
	for (const column of columns) {
		if (column.align !== undefined && !ALIGN_VALUES.has(column.align)) {
			return `align "${column.align}"`;
		}
		if (
			column.color?.variant !== undefined &&
			!COLOR_VARIANT_VALUES.has(column.color.variant)
		) {
			return `color.variant "${column.color.variant}"`;
		}
		if (column.width !== undefined && !CSS_LENGTH_PATTERN.test(column.width)) {
			return `width "${column.width}"`;
		}
	}
	return undefined;
};

const buildHeatDomains = (
	columns: readonly Column[],
	data: readonly TableRow[],
): Map<string, { min: number; max: number }> => {
	const heatDomains = new Map<string, { min: number; max: number }>();
	for (const column of columns) {
		if (column.color?.type !== 'scale') {
			continue;
		}
		const values = data
			.map((row) => toNumber(row[column.key]))
			.filter((value): value is number => value != null);
		if (!values.length) {
			continue;
		}
		heatDomains.set(column.key, {
			min: column.color.min ?? Math.min(...values),
			max: column.color.max ?? Math.max(...values),
		});
	}
	return heatDomains;
};

const heatMixFor = (
	raw: unknown,
	column: Column,
	heatDomains: ReadonlyMap<string, { min: number; max: number }>,
): number | undefined => {
	if (column.color?.type !== 'scale') {
		return undefined;
	}
	const domain = heatDomains.get(column.key);
	const value = toNumber(raw);
	if (!domain || value == null) {
		return undefined;
	}
	const span = domain.max - domain.min;
	let t = span <= 0 ? 1 : clamp((value - domain.min) / span, 0, 1);
	if (column.color.lowerIsBetter) {
		t = 1 - t;
	}
	return Math.round(HEAT_MIN_MIX + t * (HEAT_MAX_MIX - HEAT_MIN_MIX));
};

const toneFor = (
	raw: unknown,
	column: Column,
): 'positive' | 'negative' | undefined => {
	if (column.color?.type !== 'steps') {
		return undefined;
	}
	const value = toNumber(raw);
	if (value == null) {
		return undefined;
	}
	const { good, bad, lowerIsBetter } = column.color;
	if (lowerIsBetter) {
		if (bad != null && value >= bad) {
			return 'negative';
		}
		if (good != null && value <= good) {
			return 'positive';
		}
	} else {
		if (good != null && value >= good) {
			return 'positive';
		}
		if (bad != null && value <= bad) {
			return 'negative';
		}
	}
	return undefined;
};

const aggregate = (column: Column, data: readonly TableRow[]): string => {
	if (column.totalLabel) {
		return column.totalLabel;
	}
	if (!column.total) {
		return '';
	}
	// `count` counts non-empty cells, so it works on non-numeric columns too.
	if (column.total === 'count') {
		const count = data.filter((row) => {
			const value = row[column.key];
			return value != null && value !== '';
		}).length;
		return count.toLocaleString();
	}
	const values = data
		.map((row) => toNumber(row[column.key]))
		.filter((value): value is number => value != null);
	if (!values.length) {
		return '—';
	}
	const sum = values.reduce((acc, value) => acc + value, 0);
	const result =
		column.total === 'sum'
			? sum
			: column.total === 'avg'
				? sum / values.length
				: column.total === 'min'
					? Math.min(...values)
					: Math.max(...values);
	return formatNumeric(result, column);
};

/** Numbered pagination with ellipsis gaps. */
const buildPageItems = (current: number, total: number): (number | '…')[] => {
	if (total <= 7) {
		return Array.from({ length: total }, (_, index) => index + 1);
	}
	let start = Math.max(2, current - 1);
	let end = Math.min(total - 1, current + 1);
	if (current <= 3) {
		start = 2;
		end = 3;
	}
	if (current >= total - 2) {
		start = total - 2;
		end = total - 1;
	}
	const items: (number | '…')[] = [1];
	if (start > 2) {
		items.push('…');
	}
	for (let page = start; page <= end; page++) {
		items.push(page);
	}
	if (end < total - 1) {
		items.push('…');
	}
	items.push(total);
	return items;
};

const renderCellContent = (
	raw: unknown,
	column: Column,
	row: TableRow,
): string => {
	const display = escapeHtml(formatCell(raw, column));
	const image = column.imageKey ? row[column.imageKey] : undefined;
	if (typeof image === 'string') {
		return `<span class="ct-media"><img src="${escapeHtml(
			image,
		)}" alt="" loading="lazy" /><span>${display}</span></span>`;
	}
	return display;
};

const renderBodyCell = (
	raw: unknown,
	column: Column,
	colIndex: number,
	row: TableRow,
	stickyFirstColumn: boolean,
	heatDomains: ReadonlyMap<string, { min: number; max: number }>,
): string => {
	const tone = toneFor(raw, column);
	const mix = heatMixFor(raw, column, heatDomains);
	const isPin = stickyFirstColumn && colIndex === 0;
	const tag = colIndex === 0 ? 'th' : 'td';
	const scope = colIndex === 0 ? ' scope="row"' : '';
	const classes = [isPin ? 'ct-pin' : '', mix != null ? 'ct-heat' : '']
		.filter(Boolean)
		.join(' ');
	const classAttr = classes ? ` class="${classes}"` : '';
	const toneAttr = tone ? ` data-tone="${tone}"` : '';
	const scaleAttr =
		mix != null ? ` data-scale="${column.color?.variant ?? 'brand'}"` : '';
	const styleAttr = mix != null ? ` style="--ct-mix: ${String(mix)}%;"` : '';
	return `<${tag}${scope}${classAttr} data-align="${alignFor(column)}"${toneAttr}${scaleAttr}${styleAttr}>${renderCellContent(
		raw,
		column,
		row,
	)}</${tag}>`;
};

export class CreativeTable extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['creative-table']];

	declare columns: readonly Column[] | undefined;
	declare data: readonly TableRow[] | undefined;
	declare stickyFirstColumn: boolean | undefined;
	declare stickyHeader: boolean | undefined;
	declare maxHeight: number | undefined;
	declare zebra: boolean | undefined;
	declare hoverRows: boolean | undefined;
	declare totals: boolean | undefined;
	declare totalsLabel: string | undefined;
	declare pageSize: number | undefined;
	declare pageSizeOptions: readonly number[] | undefined;

	#abortController: AbortController | null = null;
	#resizeObserver: ResizeObserver | null = null;
	#currentPage = 0;
	#activePageSize = 0;

	disconnectedCallback(): void {
		this.#teardown();
	}

	protected render(): void {
		this.#teardown();

		let columns: readonly Column[] | undefined;
		let data: readonly TableRow[] | undefined;
		let pageSizeOptions: readonly number[] | undefined;

		try {
			columns =
				this.configProperty<readonly Column[]>('columns') ??
				readJsonAttribute<readonly Column[]>(this, 'columns');
			data =
				this.configProperty<readonly TableRow[]>('data') ??
				readJsonAttribute<readonly TableRow[]>(this, 'data');
			pageSizeOptions =
				this.configProperty<readonly number[]>('pageSizeOptions') ??
				readJsonAttribute<readonly number[]>(this, 'page-size-options');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'invalid JSON config';
			console.error(`creative-table received invalid JSON: ${message}.`);
			this.#clearHostState();
			this.innerHTML = '';
			return;
		}

		if (!Array.isArray(columns) || !columns.length) {
			console.error('creative-table expects a non-empty columns array.');
			this.#clearHostState();
			this.innerHTML = '';
			return;
		}

		if (!Array.isArray(data)) {
			console.error('creative-table expects a data array.');
			this.#clearHostState();
			this.innerHTML = '';
			return;
		}

		const unsupportedColumnValue = findUnsupportedColumnValue(columns);
		if (unsupportedColumnValue !== undefined) {
			console.error(
				`creative-table received an unsupported column ${unsupportedColumnValue}.`,
			);
			this.#clearHostState();
			this.innerHTML = '';
			return;
		}

		let stickyFirstColumn: boolean;
		let stickyHeader: boolean;
		let maxHeight: number | undefined;
		let zebra: boolean;
		let hoverRows: boolean;
		let totalsLabel: string;
		let showTotals: boolean;
		let resolvedPageSize: number | undefined;

		try {
			stickyFirstColumn =
				this.configProperty<boolean>('stickyFirstColumn') ??
				readBooleanAttribute(this, 'sticky-first-column', false);
			stickyHeader =
				this.configProperty<boolean>('stickyHeader') ??
				readBooleanAttribute(this, 'sticky-header', false);
			maxHeight =
				this.configProperty<number>('maxHeight') ??
				readNumberAttribute(this, 'max-height');
			zebra =
				this.configProperty<boolean>('zebra') ??
				readBooleanAttribute(this, 'zebra', false);
			hoverRows =
				this.configProperty<boolean>('hoverRows') ??
				readBooleanAttribute(this, 'hover-rows', true);
			totalsLabel =
				this.configProperty<string>('totalsLabel') ??
				readStringAttribute(this, 'totals-label') ??
				'Total';

			const totalsProperty = this.configProperty<boolean>('totals');
			const totalsAttribute = this.getAttribute('totals');
			showTotals =
				totalsProperty !== undefined
					? totalsProperty
					: totalsAttribute !== null
						? readBooleanAttribute(this, 'totals', true)
						: columns.some((column) => column.total || column.totalLabel);

			const pageSizeProperty = this.configProperty<number>('pageSize');
			const pageSizeAttribute = readNumberAttribute(this, 'page-size');
			resolvedPageSize =
				pageSizeProperty ?? pageSizeAttribute ?? pageSizeOptions?.[0];
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'invalid attribute value';
			console.error(`creative-table received invalid config: ${message}.`);
			this.#clearHostState();
			this.innerHTML = '';
			return;
		}
		const activePageSize =
			resolvedPageSize != null && resolvedPageSize > 0 ? resolvedPageSize : 0;
		const hasPagination = activePageSize > 0;
		const totalRows = data.length;
		const pageCount = hasPagination
			? Math.max(1, Math.ceil(totalRows / activePageSize))
			: 1;
		this.#currentPage = clamp(this.#currentPage, 0, pageCount - 1);
		this.#activePageSize = activePageSize;

		const heatDomains = buildHeatDomains(columns, data);

		this.toggleAttribute('data-sticky-col', stickyFirstColumn);
		this.toggleAttribute('data-sticky-header', stickyHeader);
		this.toggleAttribute('data-zebra', zebra);
		this.toggleAttribute('data-hover', hoverRows);
		this.removeAttribute('data-scroll-x');
		this.removeAttribute('data-scroll-y');
		this.removeAttribute('data-pin-disabled');
		if (hasPagination) {
			this.dataset.pageSize = String(activePageSize);
		} else {
			delete this.dataset.pageSize;
		}

		const scrollStyle = maxHeight
			? ` style="--ct-max-height: ${String(maxHeight)}px;"`
			: '';

		const headerCells = columns
			.map((column, colIndex) => {
				const pinClass =
					stickyFirstColumn && colIndex === 0 ? ' class="ct-pin"' : '';
				const widthStyle = column.width
					? ` style="min-width: ${escapeHtml(column.width)};"`
					: '';
				return `<th scope="col"${pinClass} data-align="${alignFor(column)}"${widthStyle}>${escapeHtml(
					column.label ?? column.key,
				)}</th>`;
			})
			.join('');

		const pageStart = hasPagination ? this.#currentPage * activePageSize : 0;
		const pageEnd = hasPagination
			? Math.min(totalRows, pageStart + activePageSize)
			: totalRows;

		let visibleAlt = false;
		const bodyRows = data
			.map((row, rowIndex) => {
				const visible =
					!hasPagination ||
					(rowIndex >= pageStart && rowIndex < pageEnd);
				const hiddenAttr = visible ? '' : ' hidden';
				let altAttr = '';
				if (visible) {
					if (visibleAlt) {
						altAttr = ' data-alt';
					}
					visibleAlt = !visibleAlt;
				}
				const cells = columns
					.map((column, colIndex) =>
						renderBodyCell(
							row[column.key],
							column,
							colIndex,
							row,
							stickyFirstColumn,
							heatDomains,
						),
					)
					.join('');
				return `<tr${hiddenAttr}${altAttr}>${cells}</tr>`;
			})
			.join('');

		const footerRow =
			showTotals &&
			`<tfoot><tr>${columns
				.map((column, colIndex) => {
					const value =
						colIndex === 0 && !column.total && !column.totalLabel
							? totalsLabel
							: aggregate(column, data);
					const tag = colIndex === 0 ? 'th' : 'td';
					const scope = colIndex === 0 ? ' scope="row"' : '';
					const pinClass =
						stickyFirstColumn && colIndex === 0 ? ' class="ct-pin"' : '';
					return `<${tag}${scope}${pinClass} data-align="${alignFor(
						column,
					)}">${escapeHtml(value)}</${tag}>`;
				})
				.join('')}</tr></tfoot>`;

		const start = pageStart;
		const end = pageEnd;
		const initialPageItems = buildPageItems(
			this.#currentPage + 1,
			pageCount,
		);

		const pagination =
			hasPagination &&
			`<div class="ct-pagination"><div class="ct-meta">${
				pageSizeOptions?.length
					? `<select class="wa-size-s ct-size-select" aria-label="Results per page">${pageSizeOptions
							.map(
								(option) =>
									`<option value="${String(option)}"${
										option === activePageSize ? ' selected' : ''
									}>${escapeHtml(`${String(option)} results`)}</option>`,
							)
							.join('')}</select>`
					: ''
			}<div class="ct-info">${
				totalRows === 0
					? 'No rows'
					: escapeHtml(`${String(start + 1)} - ${String(end)} of ${String(totalRows)}`)
			}</div></div><div class="ct-controls"${pageCount <= 1 ? ' hidden' : ''}><span class="ct-pages">${initialPageItems
				.map((item) =>
					item === '…'
						? '<span class="ct-ellipsis">…</span>'
						: `<button type="button" class="wa-plain wa-size-xs ct-page-btn" data-page="${String(
								item,
							)}" aria-label="Page ${String(item)}"${
								item === this.#currentPage + 1
									? ' aria-current="page"'
									: ''
							}>${String(item)}</button>`,
				)
				.join('')}</span><button type="button" class="wa-plain wa-size-xs ct-prev" aria-label="Previous page"${
				this.#currentPage === 0 ? ' disabled' : ''
			}><wa-icon name="arrow-left"></wa-icon></button><button type="button" class="wa-plain wa-size-xs ct-next" aria-label="Next page"${
				pageCount <= 1 || this.#currentPage >= pageCount - 1
					? ' disabled'
					: ''
			}><wa-icon name="arrow-right"></wa-icon></button></div></div>`;

		this.innerHTML = `<div class="ct-scroll"${scrollStyle}><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody>${footerRow || ''}</table></div>${pagination || ''}`;

		if (hasPagination) {
			ensureWaComponentsDiscoverable(['wa-icon']);
		}

		this.#setupScrollShadows();
		this.#setupStickyGuard(stickyFirstColumn);
		if (hasPagination) {
			this.#setupPagination();
		}
	}

	#clearHostState(): void {
		this.removeAttribute('data-sticky-col');
		this.removeAttribute('data-sticky-header');
		this.removeAttribute('data-zebra');
		this.removeAttribute('data-hover');
		this.removeAttribute('data-scroll-x');
		this.removeAttribute('data-scroll-y');
		this.removeAttribute('data-pin-disabled');
		delete this.dataset.pageSize;
	}

	#teardown(): void {
		this.#abortController?.abort();
		this.#abortController = null;
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}

	#setupScrollShadows(): void {
		const scroll = this.querySelector<HTMLElement>('.ct-scroll');
		if (!scroll) {
			return;
		}

		this.#abortController = new AbortController();
		const { signal } = this.#abortController;

		const update = (): void => {
			this.toggleAttribute('data-scroll-x', scroll.scrollLeft > 0);
			this.toggleAttribute('data-scroll-y', scroll.scrollTop > 0);
		};

		scroll.addEventListener('scroll', update, { passive: true, signal });
		update();
	}

	#setupStickyGuard(stickyFirstColumn: boolean): void {
		if (!stickyFirstColumn) {
			return;
		}

		const scroll = this.querySelector<HTMLElement>('.ct-scroll');
		const pin = this.querySelector<HTMLElement>('.ct-pin');
		if (!scroll || !pin) {
			return;
		}

		const update = (): void => {
			this.toggleAttribute(
				'data-pin-disabled',
				pin.offsetWidth > scroll.clientWidth / 2,
			);
		};

		this.#resizeObserver = new ResizeObserver(update);
		this.#resizeObserver.observe(scroll);
		update();
	}

	#setupPagination(): void {
		const rows = Array.from(
			this.querySelectorAll<HTMLTableRowElement>('tbody tr'),
		);
		const info = this.querySelector<HTMLElement>('.ct-info');
		const pages = this.querySelector<HTMLElement>('.ct-pages');
		const prev = this.querySelector<HTMLButtonElement>('.ct-prev');
		const next = this.querySelector<HTMLButtonElement>('.ct-next');
		const select = this.querySelector<HTMLSelectElement>('.ct-size-select');

		const signal = this.#abortController?.signal;
		if (!signal) {
			return;
		}

		prev?.addEventListener(
			'click',
			() => {
				this.#currentPage -= 1;
				this.#updatePaginationView(rows, info, pages, prev, next);
			},
			{ signal },
		);

		next?.addEventListener(
			'click',
			() => {
				this.#currentPage += 1;
				this.#updatePaginationView(rows, info, pages, prev, next);
			},
			{ signal },
		);

		select?.addEventListener(
			'change',
			() => {
				const nextSize = Number(select.value);
				if (!nextSize || nextSize === this.#activePageSize) {
					return;
				}
				const firstVisible = this.#currentPage * this.#activePageSize;
				this.#activePageSize = nextSize;
				this.dataset.pageSize = String(nextSize);
				this.#currentPage = Math.floor(firstVisible / nextSize);
				this.#updatePaginationView(rows, info, pages, prev, next);
			},
			{ signal },
		);

		pages
			?.querySelectorAll<HTMLButtonElement>('.ct-page-btn')
			.forEach((button) => {
				button.addEventListener(
					'click',
					() => {
						const page = Number(button.dataset.page);
						if (!Number.isFinite(page)) {
							return;
						}
						this.#currentPage = page - 1;
						this.#updatePaginationView(rows, info, pages, prev, next);
					},
					{ signal },
				);
			});

		this.#updatePaginationView(rows, info, pages, prev, next);
	}

	#updatePaginationView(
		rows: readonly HTMLTableRowElement[],
		info: HTMLElement | null,
		pages: HTMLElement | null,
		prev: HTMLButtonElement | null,
		next: HTMLButtonElement | null,
	): void {
		const total = rows.length;
		const pageSize = this.#activePageSize;
		const pagesCount = Math.max(1, Math.ceil(total / pageSize));
		this.#currentPage = clamp(this.#currentPage, 0, pagesCount - 1);
		const start = this.#currentPage * pageSize;
		const end = Math.min(total, start + pageSize);

		let alt = false;
		rows.forEach((row, index) => {
			const visible = index >= start && index < end;
			row.toggleAttribute('hidden', !visible);
			if (visible) {
				row.toggleAttribute('data-alt', alt);
				alt = !alt;
			} else {
				row.removeAttribute('data-alt');
			}
		});

		if (info) {
			info.textContent =
				total === 0 ? 'No rows' : `${String(start + 1)} - ${String(end)} of ${String(total)}`;
		}

		const controls = this.querySelector<HTMLElement>('.ct-controls');
		controls?.toggleAttribute('hidden', pagesCount <= 1);
		if (pagesCount <= 1) {
			return;
		}

		this.#renderPageButtons(pages, pagesCount);
		if (prev) {
			prev.disabled = this.#currentPage === 0;
		}
		if (next) {
			next.disabled = this.#currentPage >= pagesCount - 1;
		}
	}

	#renderPageButtons(
		holder: HTMLElement | null,
		pages: number,
	): void {
		if (!holder) {
			return;
		}

		const signal = this.#abortController?.signal;
		holder.replaceChildren();

		for (const item of buildPageItems(this.#currentPage + 1, pages)) {
			if (item === '…') {
				const ellipsis = document.createElement('span');
				ellipsis.className = 'ct-ellipsis';
				ellipsis.textContent = '…';
				holder.appendChild(ellipsis);
				continue;
			}

			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'wa-plain wa-size-xs ct-page-btn';
			button.textContent = String(item);
			button.dataset.page = String(item);
			button.setAttribute('aria-label', `Page ${String(item)}`);
			if (item === this.#currentPage + 1) {
				button.setAttribute('aria-current', 'page');
			}
			button.addEventListener(
				'click',
				() => {
					this.#currentPage = item - 1;
					const rows = Array.from(
						this.querySelectorAll<HTMLTableRowElement>('tbody tr'),
					);
					const info = this.querySelector<HTMLElement>('.ct-info');
					const pagesEl = this.querySelector<HTMLElement>('.ct-pages');
					const prev = this.querySelector<HTMLButtonElement>('.ct-prev');
					const next = this.querySelector<HTMLButtonElement>('.ct-next');
					this.#updatePaginationView(
						rows,
						info,
						pagesEl,
						prev,
						next,
					);
				},
				signal ? { signal } : undefined,
			);
			holder.appendChild(button);
		}
	}
}

installConfigProperties(CreativeTable, [
	'columns',
	'data',
	'stickyFirstColumn',
	'stickyHeader',
	'maxHeight',
	'zebra',
	'hoverRows',
	'totals',
	'totalsLabel',
	'pageSize',
	'pageSizeOptions',
]);
defineElement('creative-table', CreativeTable);

declare global {
	interface HTMLElementTagNameMap {
		'creative-table': CreativeTable;
	}
}
