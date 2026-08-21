/**
 * Creative chart with independent per-series scales. Renders SVG client-side
 * inside a <creative-chart> custom element with no framework dependency.
 *
 * Astro / HTML:
 *   <creative-chart
 *     type="bar"
 *     data={JSON.stringify(rows)}
 *     series={JSON.stringify([{ key: 'spend', label: 'Spend' }])}
 *     x-key="id"
 *   />
 * Browser TypeScript:
 *   chart.data = rows; chart.series = series; chart.xKey = "id"
 */

import { formatPercentPoints } from './internal/number-format';
import {
	BuildethElement,
	defineElement,
	installConfigProperties,
	readBooleanAttribute,
	readJsonAttribute,
	readNumberAttribute,
	readStringAttribute,
} from './internal/runtime';
import { SCAFFOLD_ELEMENT_ATTRIBUTES } from './scaffold-contracts';

import './creative-chart.css';

const CREATIVE_CHART_NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 5, 10] as const;
const PLOT_MARGIN = { top: 16, right: 2, bottom: 0, left: 2 };
const BAR_CATEGORY_GAP = 0.34;
const VALUE_LABEL_OFFSET = 6;
const VALUE_LABEL_COLLISION_PADDING = 2;
const Y_TICK_MARGIN = 12;
const TOOLTIP_OFFSET = 12;
const IMAGE_OFFSET = 8;
const IMAGE_BORDER_WIDTH = 2;
const CORNER_RADIUS_FALLBACK = 4;
const LABEL_OFFSET = 16;
const LINE_AXIS_HEIGHT = 28;
const BAR_AXIS_HEIGHT = 108;
const BAR_CATEGORY_MIN_WIDTH_PADDING = 16;
const LINE_CATEGORY_MIN_WIDTH = 48;

type ChartFormat = 'number' | 'compact' | 'currency' | 'percent';
type ChartType = 'bar' | 'line' | 'area';

export interface ChartSeries {
	readonly key: string;
	readonly label?: string;
	readonly color?: string;
	/** `percent` values are percentage points: 3.73 represents 3.73%. */
	readonly format?: ChartFormat;
	readonly currency?: string;
	readonly decimals?: number;
}

interface SerializedSeries {
	readonly key: string;
	readonly label: string;
	readonly color: string;
	readonly format?: ChartFormat;
	readonly currency?: string;
	readonly decimals?: number;
}

interface ChartPayload {
	readonly type: ChartType;
	readonly data: Record<string, unknown>[];
	readonly series: SerializedSeries[];
	readonly xKey: string;
	readonly labelKey: string;
	readonly imageKey?: string;
	readonly imageAltKey?: string;
	readonly height: number;
	readonly minWidth: number | 'auto';
	readonly gridLines: number;
	readonly showGrid: boolean;
	readonly showTooltip: boolean;
	readonly showLegend: boolean;
	readonly showMetricHeader: boolean;
	readonly showMetricAxes: boolean;
	readonly showValueLabels: boolean;
	readonly imageSize: number;
	readonly labelMaxLength: number;
}

interface MetricAxis {
	readonly key: string;
	readonly domainMax: number;
	readonly ticks: number[];
}

interface BarGeometry {
	readonly barGap: number;
	readonly barSize: number;
}

interface CategoryLayout {
	readonly index: number;
	readonly centerX: number;
	readonly groupLeft: number;
	readonly groupWidth: number;
}

interface LabelRect {
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
	readonly height: number;
}

const readMinWidthAttribute = (
	element: HTMLElement,
): number | 'auto' | undefined => {
	const raw = element.getAttribute('min-width');
	if (raw === null || raw.trim() === '') {
		return undefined;
	}
	if (raw === 'auto') {
		return 'auto';
	}
	const value = Number(raw);
	if (!Number.isFinite(value)) {
		throw new Error(
			`<${element.tagName.toLowerCase()}> attribute "min-width" must be a finite number or "auto", received "${raw}".`,
		);
	}
	return value;
};

const getLabelRect = (label: SVGTextElement): LabelRect => {
	const box = label.getBBox();
	return {
		top: box.y,
		right: box.x + box.width,
		bottom: box.y + box.height,
		left: box.x,
		height: box.height,
	};
};

const getPrimitiveValue = (value: unknown): string | undefined =>
	typeof value === 'number' || typeof value === 'string'
		? String(value)
		: undefined;

const getNumericValue = (value: unknown): number | undefined => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
};

const getSeriesUnitKey = (series: SerializedSeries): string => {
	const format = series.format ?? 'number';
	return format === 'currency'
		? `currency:${series.currency ?? 'USD'}`
		: format;
};

const roundTick = (value: number): number => Number(value.toFixed(6));

const getNiceMax = (maxValue: number, tickCount: number): number => {
	if (!Number.isFinite(maxValue) || maxValue <= 0) {
		return 1;
	}

	const stepCount = Math.max(1, Math.floor(tickCount) - 1);
	const roughStep = maxValue / stepCount;
	const magnitude = 10 ** Math.floor(Math.log10(roughStep));
	const residual = roughStep / magnitude;
	const niceResidual =
		CREATIVE_CHART_NICE_STEPS.find((step) => residual <= step) ??
		CREATIVE_CHART_NICE_STEPS[CREATIVE_CHART_NICE_STEPS.length - 1];

	return niceResidual * magnitude * stepCount;
};

const getAxisTicks = (maxValue: number, tickCount: number): number[] => {
	const stepCount = Math.max(1, Math.floor(tickCount) - 1);
	const step = maxValue / stepCount;

	return Array.from({ length: stepCount + 1 }, (_, index) =>
		roundTick(step * index),
	);
};

const truncateLabel = (
	label: string | undefined,
	maxLength: number,
): string | undefined => {
	if (!label || label.length <= maxLength) {
		return label;
	}

	return `${label.slice(0, Math.max(0, maxLength - 1))}…`;
};

const formatSeriesValue = (
	value: number,
	series: SerializedSeries,
): string => {
	const { format = 'number', currency = 'USD', decimals } = series;

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
		Math.abs(value) < 1
			? Number(value.toFixed(2))
			: Number(value.toFixed(1));

	return Number.isInteger(rounded)
		? rounded.toLocaleString()
		: rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatAxisTick = (value: number, series: SerializedSeries): string =>
	formatSeriesValue(value, series);

const getBarGeometry = (
	imageSize: number,
	seriesCount: number,
): BarGeometry => {
	const metricCount = Math.max(1, Math.min(seriesCount, 4));
	const barGap = metricCount > 3 ? 4 : imageSize <= 48 ? 2 : 8;
	const maxBarSize = metricCount > 2 ? 20 : 28;
	const availableBarSize =
		(imageSize - (metricCount - 1) * barGap) / metricCount;
	const barSize = Math.max(4, Math.min(availableBarSize, maxBarSize));

	return { barGap, barSize };
};

const roundedTopRectPath = (
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
): string => {
	const r = Math.min(radius, width / 2, height);
	return [
		`M ${x} ${y + height}`,
		`L ${x} ${y + r}`,
		`Q ${x} ${y} ${x + r} ${y}`,
		`L ${x + width - r} ${y}`,
		`Q ${x + width} ${y} ${x + width} ${y + r}`,
		`L ${x + width} ${y + height}`,
		'Z',
	].join(' ');
};

const rectsOverlap = (first: LabelRect, second: LabelRect): boolean =>
	!(
		second.left > first.right ||
		second.right < first.left ||
		second.top > first.bottom ||
		second.bottom < first.top
	);

const getFirstOverlappingPair = (
	items: { index: number; rect: LabelRect }[],
): readonly [{ index: number; rect: LabelRect }, { index: number; rect: LabelRect }] | undefined => {
	for (let i = 0; i < items.length - 1; i++) {
		for (let j = i + 1; j < items.length; j++) {
			if (rectsOverlap(items[i].rect, items[j].rect)) {
				return [items[i], items[j]] as const;
			}
		}
	}

	return undefined;
};

const fixOverlappingLabels = (
	labels: SVGTextElement[],
	maxBottomY: number,
	padding: number,
): void => {
	if (labels.length < 2) {
		return;
	}

	const indexedRects = new Map(
		labels.map((item, index) => [item, { index, rect: getLabelRect(item) }]),
	);

	let iteration = 0;
	let pair = getFirstOverlappingPair(Array.from(indexedRects.values()));

	while (pair && iteration < 20) {
		const [firstItem, secondItem] = pair;
		const firstLabel = labels[firstItem.index];
		const secondLabel = labels[secondItem.index];
		const firstY = Number(firstLabel.getAttribute('y'));
		const offset = firstItem.rect.height + padding;
		const shouldPushUp =
			firstY + offset + secondItem.rect.height > maxBottomY;

		secondLabel.setAttribute(
			'y',
			String(firstY + (shouldPushUp ? -offset : offset)),
		);
		indexedRects.set(secondLabel, {
			...indexedRects.get(secondLabel)!,
			rect: getLabelRect(secondLabel),
		});

		iteration++;
		pair = getFirstOverlappingPair(Array.from(indexedRects.values()));
	}
};

const fixValueLabelCollisions = (
	root: HTMLElement,
	plotBottomY: number,
	padding: number,
): void => {
	const labels = Array.from(
		root.querySelectorAll<SVGTextElement>('[data-chart-value-label]'),
	);

	if (!labels.length) {
		return;
	}

	fixOverlappingLabels(labels, plotBottomY, padding);
};

const measureAxisWidth = (
	host: HTMLElement,
	ticks: number[],
	series: SerializedSeries,
): number => {
	const probe = document.createElement('span');
	probe.style.position = 'absolute';
	probe.style.visibility = 'hidden';
	probe.style.whiteSpace = 'pre';
	probe.style.fontSize = 'var(--wa-font-size-2xs)';
	host.appendChild(probe);

	let maxWidth = 0;
	for (const tick of ticks) {
		probe.textContent = formatAxisTick(tick, series);
		maxWidth = Math.max(maxWidth, probe.getBoundingClientRect().width);
	}

	probe.remove();
	return Math.ceil(maxWidth) + Y_TICK_MARGIN;
};

const resolveCornerRadius = (host: HTMLElement): number => {
	if (!getComputedStyle(host).getPropertyValue('--wa-border-radius-s')) {
		return CORNER_RADIUS_FALLBACK;
	}

	const probe = document.createElement('div');
	probe.style.position = 'absolute';
	probe.style.visibility = 'hidden';
	probe.style.width = 'var(--wa-border-radius-s)';
	host.appendChild(probe);
	const radius = probe.getBoundingClientRect().width;
	probe.remove();

	return Number.isFinite(radius) ? radius : CORNER_RADIUS_FALLBACK;
};

export class CreativeChart extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['creative-chart']];

	declare type: ChartType | undefined;
	declare data: readonly Record<string, unknown>[] | undefined;
	declare series: readonly ChartSeries[] | undefined;
	declare xKey: string | undefined;
	declare labelKey: string | undefined;
	declare imageKey: string | undefined;
	declare imageAltKey: string | undefined;
	declare maxSeries: number | undefined;
	declare height: number | undefined;
	declare minWidth: number | 'auto' | undefined;
	declare gridLines: number | undefined;
	declare showGrid: boolean | undefined;
	declare showTooltip: boolean | undefined;
	declare showLegend: boolean | undefined;
	declare showMetricHeader: boolean | undefined;
	declare showMetricAxes: boolean | undefined;
	declare showValueLabels: boolean | undefined;
	declare imageSize: number | undefined;
	declare labelMaxLength: number | undefined;

	#payload: ChartPayload | null = null;
	#scroll: HTMLElement | null = null;
	#mount: HTMLElement | null = null;
	#resizeObserver: ResizeObserver | null = null;
	#resizeRaf = 0;
	#labelFixRaf = 0;
	#width = 0;

	disconnectedCallback(): void {
		this.#teardown();
	}

	protected render(): void {
		this.#teardown();

		let payload: ChartPayload;
		try {
			const resolved = this.#resolvePayload();
			if (resolved.error !== undefined) {
				console.error(resolved.error);
				this.innerHTML = '';
				return;
			}
			payload = resolved.payload;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Invalid chart configuration.';
			console.error(message);
			this.innerHTML = '';
			return;
		}

		this.#payload = payload;
		this.innerHTML =
			'<div class="ccx-scroll"><div class="ccx-mount"></div></div>';
		this.#scroll = this.querySelector('.ccx-scroll');
		this.#mount = this.querySelector('.ccx-mount');

		if (this.#scroll === null || this.#mount === null) {
			return;
		}

		this.#width = Math.round(this.#scroll.clientWidth);

		this.#resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			const nextWidth = Math.round(entry.contentRect.width);
			if (nextWidth === this.#width) {
				return;
			}

			this.#width = nextWidth;
			cancelAnimationFrame(this.#resizeRaf);
			this.#resizeRaf = requestAnimationFrame(() => {
				this.#renderChart();
			});
		});

		this.#resizeObserver.observe(this.#scroll);
		this.#renderChart();
	}

	#teardown(): void {
		cancelAnimationFrame(this.#resizeRaf);
		cancelAnimationFrame(this.#labelFixRaf);
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#scroll = null;
		this.#mount = null;
		this.#payload = null;
	}

	#readBooleanConfig(
		propertyName: string,
		attributeName: string,
		defaultValue: boolean,
	): boolean {
		const propertyValue = this.configProperty<boolean>(propertyName);
		if (propertyValue !== undefined) {
			return propertyValue;
		}
		return readBooleanAttribute(this, attributeName, defaultValue);
	}

	#resolvePayload():
		| { readonly payload: ChartPayload; readonly error?: undefined }
		| { readonly error: string; readonly payload?: undefined } {
		const type =
			this.configProperty<ChartType>('type') ??
			(readStringAttribute(this, 'type') as ChartType | undefined) ??
			'bar';

		if (type !== 'bar' && type !== 'line' && type !== 'area') {
			return {
				error: `creative-chart attribute "type" must be "bar", "line", or "area", received "${type}".`,
			};
		}

		const data =
			this.configProperty<readonly Record<string, unknown>[]>('data') ??
			readJsonAttribute<readonly Record<string, unknown>[]>(this, 'data');

		const seriesInput =
			this.configProperty<readonly ChartSeries[]>('series') ??
			readJsonAttribute<readonly ChartSeries[]>(this, 'series');

		const xKey =
			this.configProperty<string>('xKey') ??
			readStringAttribute(this, 'x-key');

		if (!Array.isArray(data) || data.length === 0) {
			return { error: 'creative-chart requires a non-empty data array.' };
		}

		if (!Array.isArray(seriesInput) || seriesInput.length === 0) {
			return { error: 'creative-chart requires a non-empty series array.' };
		}

		if (xKey === undefined || xKey === '') {
			return { error: 'creative-chart requires an x-key attribute or xKey property.' };
		}

		const maxSeries =
			this.configProperty<number>('maxSeries') ??
			readNumberAttribute(this, 'max-series') ??
			4;

		const resolvedLabelKey =
			this.configProperty<string>('labelKey') ??
			readStringAttribute(this, 'label-key') ??
			xKey;

		const visibleSeries = seriesInput
			.slice(0, maxSeries)
			.map((item, index) => ({
				key: item.key,
				label: item.label ?? item.key,
				color: item.color ?? `var(--chart-${(index % 4) + 1})`,
				format: item.format,
				currency: item.currency ?? 'USD',
				decimals: item.decimals,
			}));

		// Axes are zero-based: the domain runs 0…max and bars/points sit on a
		// bottom baseline, so negative values cannot render truthfully. Drop
		// them like missing values instead of failing the whole chart.
		let droppedNegatives = 0;
		const sanitizedData = data.map((datum) => {
			const negativeSeries = visibleSeries.filter((series) => {
				const value = getNumericValue(datum[series.key]);
				return value !== undefined && value < 0;
			});
			if (negativeSeries.length === 0) {
				return datum;
			}
			droppedNegatives += negativeSeries.length;
			const sanitized = { ...datum };
			for (const series of negativeSeries) {
				delete sanitized[series.key];
			}
			return sanitized;
		});
		if (droppedNegatives > 0) {
			console.warn(
				`creative-chart axes are zero-based; dropped ${String(droppedNegatives)} negative value(s). Present negative data in a creative-table instead.`,
			);
		}

		const showValueLabelsProp = this.configProperty<boolean>('showValueLabels');
		const resolvedShowValueLabels =
			showValueLabelsProp !== undefined
				? showValueLabelsProp
				: this.hasAttribute('show-value-labels')
					? readBooleanAttribute(this, 'show-value-labels', true)
					: type === 'bar';

		const seriesCount = visibleSeries.length;
		const showMetricHeader = this.#readBooleanConfig(
			'showMetricHeader',
			'show-metric-header',
			true,
		);
		const showMetricAxes = this.#readBooleanConfig(
			'showMetricAxes',
			'show-metric-axes',
			true,
		);

		return {
			payload: {
				type,
				data: sanitizedData,
				series: visibleSeries,
				xKey,
				labelKey: resolvedLabelKey,
				imageKey:
					this.configProperty<string>('imageKey') ??
					readStringAttribute(this, 'image-key'),
				imageAltKey:
					this.configProperty<string>('imageAltKey') ??
					readStringAttribute(this, 'image-alt-key'),
				height:
					this.configProperty<number>('height') ??
					readNumberAttribute(this, 'height') ??
					360,
				minWidth:
					this.configProperty<number | 'auto'>('minWidth') ??
					readMinWidthAttribute(this) ??
					'auto',
				gridLines:
					this.configProperty<number>('gridLines') ??
					readNumberAttribute(this, 'grid-lines') ??
					6,
				showGrid: this.#readBooleanConfig('showGrid', 'show-grid', true),
				showTooltip: this.#readBooleanConfig(
					'showTooltip',
					'show-tooltip',
					true,
				),
				showLegend: this.#readBooleanConfig(
					'showLegend',
					'show-legend',
					false,
				),
				showMetricHeader:
					showMetricHeader && seriesCount > 0 && seriesCount <= 2,
				showMetricAxes:
					showMetricAxes && seriesCount > 0 && seriesCount <= 2,
				showValueLabels: resolvedShowValueLabels,
				imageSize:
					this.configProperty<number>('imageSize') ??
					readNumberAttribute(this, 'image-size') ??
					64,
				labelMaxLength:
					this.configProperty<number>('labelMaxLength') ??
					readNumberAttribute(this, 'label-max-length') ??
					22,
			},
		};
	}

	#seriesShareUnit(): boolean {
		const series = this.#payload?.series ?? [];
		if (series.length !== 2) {
			return false;
		}

		return getSeriesUnitKey(series[0]) === getSeriesUnitKey(series[1]);
	}

	#getMetricAxes(): MetricAxis[] {
		const payload = this.#payload;
		if (!payload) {
			return [];
		}

		const seriesMaxes = payload.series.map((series) =>
			payload.data.reduce((max, datum) => {
				const value = getNumericValue(datum[series.key]);
				return value == null ? max : Math.max(max, value);
			}, 0),
		);

		const sharedMax = this.#seriesShareUnit()
			? Math.max(...seriesMaxes)
			: null;

		return payload.series.map((series, index) => {
			const maxValue = sharedMax ?? seriesMaxes[index];
			const domainMax = getNiceMax(maxValue, payload.gridLines);
			const ticks = getAxisTicks(domainMax, payload.gridLines);

			return { key: series.key, domainMax, ticks };
		});
	}

	#getCategoryLayouts(
		plotLeft: number,
		plotWidth: number,
		count: number,
		groupWidth: number,
	): CategoryLayout[] {
		if (count <= 0) {
			return [];
		}

		const slotWidth = plotWidth / count;

		return Array.from({ length: count }, (_, index) => {
			const slotLeft = plotLeft + index * slotWidth;
			const gap = slotWidth * BAR_CATEGORY_GAP;
			const bandWidth = slotWidth - gap;
			const resolvedGroupWidth = Math.min(groupWidth, bandWidth);
			const centerX = slotLeft + slotWidth / 2;
			const groupLeft = centerX - resolvedGroupWidth / 2;

			return {
				index,
				centerX,
				groupLeft,
				groupWidth: resolvedGroupWidth,
			};
		});
	}

	#valueToY(
		value: number | undefined,
		domainMax: number,
		plotTop: number,
		plotHeight: number,
	): number {
		const baseline = plotTop + plotHeight;
		if (value == null || value <= 0 || domainMax <= 0) {
			return baseline;
		}

		const ratio = Math.min(value / domainMax, 1);
		return baseline - ratio * plotHeight;
	}

	#scheduleLabelCollisionFix(plotBottomY: number): void {
		cancelAnimationFrame(this.#labelFixRaf);

		const run = (): void => {
			const root = this.#mount?.querySelector('.ccx-root');
			if (root instanceof HTMLElement) {
				fixValueLabelCollisions(
					root,
					plotBottomY,
					VALUE_LABEL_COLLISION_PADDING,
				);
			}
		};

		this.#labelFixRaf = requestAnimationFrame(() => {
			run();
			requestAnimationFrame(run);
		});
	}

	#renderChart(): void {
		const payload = this.#payload;
		const mount = this.#mount;

		if (!payload || !mount || this.#width <= 0) {
			return;
		}

		const {
			type,
			data,
			series,
			labelKey,
			imageKey,
			imageAltKey,
			height,
			showGrid,
			showTooltip,
			showLegend,
			showMetricHeader,
			showMetricAxes,
			showValueLabels,
			imageSize,
			labelMaxLength,
			gridLines,
		} = payload;

		const showImages = type === 'bar' && imageKey !== undefined;
		const axisHeight = showImages ? BAR_AXIS_HEIGHT : LINE_AXIS_HEIGHT;
		const plotTop = PLOT_MARGIN.top;
		const plotHeight = height - axisHeight - plotTop;
		const plotBottom = plotTop + plotHeight;
		const metricAxes = this.#getMetricAxes();
		const barGeometry =
			type === 'bar' ? getBarGeometry(imageSize, series.length) : null;

		const cornerRadius = resolveCornerRadius(this);

		const sharedScale = this.#seriesShareUnit();

		let leftAxisWidth = 0;
		let rightAxisWidth = 0;

		if (showMetricAxes && series.length >= 1) {
			leftAxisWidth = measureAxisWidth(this, metricAxes[0].ticks, series[0]);
		}

		if (showMetricAxes && series.length >= 2 && !sharedScale) {
			rightAxisWidth = measureAxisWidth(this, metricAxes[1].ticks, series[1]);
		}

		const categoryMinWidth =
			showImages
				? imageSize + BAR_CATEGORY_MIN_WIDTH_PADDING
				: LINE_CATEGORY_MIN_WIDTH;
		const autoMinWidth = Math.ceil(
			PLOT_MARGIN.left +
				PLOT_MARGIN.right +
				leftAxisWidth +
				rightAxisWidth +
				data.length * categoryMinWidth,
		);
		const minWidth =
			payload.minWidth === 'auto' ? autoMinWidth : payload.minWidth;
		const chartWidth = Math.max(this.#width, minWidth);
		const plotLeft = PLOT_MARGIN.left + leftAxisWidth;
		const plotRight = chartWidth - PLOT_MARGIN.right - rightAxisWidth;
		const plotWidth = Math.max(0, plotRight - plotLeft);
		const categoryLayouts = this.#getCategoryLayouts(
			plotLeft,
			plotWidth,
			data.length,
			imageSize,
		);

		const typeName =
			type === 'bar'
				? 'Bar chart'
				: type === 'line'
					? 'Line chart'
					: 'Area chart';
		const ariaLabel = `${typeName} of ${series
			.map((item) => item.label)
			.join(', ')} across ${data.length} categories`;
		const svgNs = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNs, 'svg');
		svg.setAttribute('class', 'ccx-chart-svg');
		svg.setAttribute('width', String(chartWidth));
		svg.setAttribute('height', String(height));
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', ariaLabel);

		const defs = document.createElementNS(svgNs, 'defs');
		svg.appendChild(defs);

		if (showGrid && gridLines > 1) {
			const stepCount = Math.max(1, gridLines - 1);
			for (let i = 0; i <= stepCount; i++) {
				const y = plotTop + (plotHeight / stepCount) * i;
				const line = document.createElementNS(svgNs, 'line');
				line.setAttribute('x1', String(plotLeft));
				line.setAttribute('x2', String(plotRight));
				line.setAttribute('y1', String(y));
				line.setAttribute('y2', String(y));
				line.setAttribute('stroke', 'var(--wa-color-surface-border)');
				line.setAttribute('stroke-dasharray', '3 3');
				svg.appendChild(line);
			}
		}

		const plotGroup = document.createElementNS(svgNs, 'g');
		plotGroup.setAttribute('class', 'ccx-plot');
		svg.appendChild(plotGroup);

		const labelsGroup = document.createElementNS(svgNs, 'g');
		labelsGroup.setAttribute('class', 'ccx-value-labels');
		svg.appendChild(labelsGroup);

		if (type === 'bar' && barGeometry) {
			for (const layout of categoryLayouts) {
				const datum = data[layout.index];
				const group = document.createElementNS(svgNs, 'g');
				group.setAttribute('class', 'ccx-bar-group');
				group.setAttribute('data-category-index', String(layout.index));

				const totalBarsWidth =
					series.length * barGeometry.barSize +
					(series.length - 1) * barGeometry.barGap;
				let barLeft =
					layout.groupLeft + (layout.groupWidth - totalBarsWidth) / 2;

				series.forEach((item, seriesIndex) => {
					const axis = metricAxes[seriesIndex];
					const value = getNumericValue(datum[item.key]);
					const barTop = this.#valueToY(
						value,
						axis.domainMax,
						plotTop,
						plotHeight,
					);
					let barHeight = plotBottom - barTop;

					if (value != null && value > 0) {
						barHeight = Math.max(barHeight, 3);
					} else {
						barHeight = 0;
					}

					if (barHeight > 0) {
						const path = document.createElementNS(svgNs, 'path');
						path.setAttribute(
							'd',
							roundedTopRectPath(
								barLeft,
								plotBottom - barHeight,
								barGeometry.barSize,
								barHeight,
								cornerRadius,
							),
						);
						path.setAttribute('fill', item.color);
						group.appendChild(path);

						if (showValueLabels && value != null) {
							const label = document.createElementNS(svgNs, 'text');
							label.setAttribute('class', 'ccx-value-label');
							label.setAttribute('data-chart-value-label', '');
							label.setAttribute('text-anchor', 'middle');
							label.setAttribute(
								'x',
								String(barLeft + barGeometry.barSize / 2),
							);
							label.setAttribute(
								'y',
								String(plotBottom - barHeight - VALUE_LABEL_OFFSET),
							);
							label.textContent = formatSeriesValue(value, item);
							labelsGroup.appendChild(label);
						}
					}

					barLeft += barGeometry.barSize + barGeometry.barGap;
				});

				plotGroup.appendChild(group);
			}
		}

		if (type === 'line' || type === 'area') {
			series.forEach((item, seriesIndex) => {
				const axis = metricAxes[seriesIndex];
				const points = categoryLayouts.map((layout) => {
					const value = getNumericValue(data[layout.index][item.key]);
					return {
						x: layout.centerX,
						y: this.#valueToY(
							value,
							axis.domainMax,
							plotTop,
							plotHeight,
						),
						value,
					};
				});

				if (type === 'area' && points.length > 1) {
					const areaPath = document.createElementNS(svgNs, 'path');
					const baseline = plotBottom;
					const d = [
						`M ${points[0].x} ${baseline}`,
						`L ${points[0].x} ${points[0].y}`,
						...points.slice(1).map((point) => `L ${point.x} ${point.y}`),
						`L ${points[points.length - 1].x} ${baseline}`,
						'Z',
					].join(' ');
					areaPath.setAttribute('d', d);
					areaPath.setAttribute(
						'fill',
						`color-mix(in oklab, ${item.color} 20%, transparent)`,
					);
					plotGroup.appendChild(areaPath);
				}

				if (points.length > 1) {
					const polyline = document.createElementNS(svgNs, 'polyline');
					polyline.setAttribute(
						'points',
						points.map((point) => `${point.x},${point.y}`).join(' '),
					);
					polyline.setAttribute('fill', 'none');
					polyline.setAttribute('stroke', item.color);
					polyline.setAttribute('stroke-width', '2');
					polyline.setAttribute('stroke-linecap', 'round');
					polyline.setAttribute('stroke-linejoin', 'round');
					plotGroup.appendChild(polyline);
				}

				points.forEach((point) => {
					if (point.value == null) {
						return;
					}

					const circle = document.createElementNS(svgNs, 'circle');
					circle.setAttribute('cx', String(point.x));
					circle.setAttribute('cy', String(point.y));
					circle.setAttribute('r', '3');
					circle.setAttribute('fill', item.color);
					circle.setAttribute('stroke', 'var(--wa-color-surface-default)');
					circle.setAttribute('stroke-width', '2');
					plotGroup.appendChild(circle);

					if (showValueLabels) {
						const label = document.createElementNS(svgNs, 'text');
						label.setAttribute('class', 'ccx-value-label');
						label.setAttribute('data-chart-value-label', '');
						label.setAttribute('text-anchor', 'middle');
						label.setAttribute('x', String(point.x));
						label.setAttribute(
							'y',
							String(point.y - VALUE_LABEL_OFFSET),
						);
						label.textContent = formatSeriesValue(point.value, item);
						labelsGroup.appendChild(label);
					}
				});
			});
		}

		const xAxisGroup = document.createElementNS(svgNs, 'g');
		xAxisGroup.setAttribute('class', 'ccx-x-axis');

		const slotWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
		const fittedLabelLength = Math.min(
			labelMaxLength,
			Math.max(4, Math.floor(slotWidth / 6)),
		);

		categoryLayouts.forEach((layout) => {
			const datum = data[layout.index];
			const fullLabel = getPrimitiveValue(datum[labelKey]) ?? '';
			const label = truncateLabel(fullLabel, fittedLabelLength);
			const tick = document.createElementNS(svgNs, 'g');
			tick.setAttribute(
				'transform',
				`translate(${layout.centerX}, ${plotBottom})`,
			);

			if (fullLabel) {
				const title = document.createElementNS(svgNs, 'title');
				title.textContent = fullLabel;
				tick.appendChild(title);
			}

			if (type === 'bar') {
				if (imageKey !== undefined) {
					const imageUrl = getPrimitiveValue(datum[imageKey]);
					const imageAlt = imageAltKey
						? getPrimitiveValue(datum[imageAltKey])
						: fullLabel;
					const imageX = -imageSize / 2;
					const imageY = IMAGE_OFFSET;
					const borderRadius =
						cornerRadius > 0 ? cornerRadius + IMAGE_BORDER_WIDTH / 2 : 0;
					const clipId = `ccx-clip-${layout.index}-${Math.random().toString(36).slice(2, 9)}`;

					if (imageAlt && imageAlt !== fullLabel) {
						const altTitle = document.createElementNS(svgNs, 'title');
						altTitle.textContent = imageAlt;
						tick.appendChild(altTitle);
					}

					const clipPath = document.createElementNS(svgNs, 'clipPath');
					clipPath.setAttribute('id', clipId);
					const clipRect = document.createElementNS(svgNs, 'rect');
					clipRect.setAttribute('x', String(imageX));
					clipRect.setAttribute('y', String(imageY));
					clipRect.setAttribute('width', String(imageSize));
					clipRect.setAttribute('height', String(imageSize));
					clipRect.setAttribute('rx', String(cornerRadius));
					clipPath.appendChild(clipRect);
					defs.appendChild(clipPath);

					const border = document.createElementNS(svgNs, 'rect');
					border.setAttribute('x', String(imageX - IMAGE_BORDER_WIDTH));
					border.setAttribute('y', String(imageY - IMAGE_BORDER_WIDTH));
					border.setAttribute(
						'width',
						String(imageSize + IMAGE_BORDER_WIDTH * 2),
					);
					border.setAttribute(
						'height',
						String(imageSize + IMAGE_BORDER_WIDTH * 2),
					);
					border.setAttribute('rx', String(borderRadius));
					border.setAttribute('fill', 'var(--wa-color-surface-default)');
					border.setAttribute('stroke', 'var(--wa-color-surface-border)');
					border.setAttribute('stroke-width', String(IMAGE_BORDER_WIDTH));
					tick.appendChild(border);

					if (imageUrl) {
						const image = document.createElementNS(svgNs, 'image');
						image.setAttribute('href', imageUrl);
						image.setAttribute('x', String(imageX));
						image.setAttribute('y', String(imageY));
						image.setAttribute('width', String(imageSize));
						image.setAttribute('height', String(imageSize));
						image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
						image.setAttribute('clip-path', `url(#${clipId})`);
						tick.appendChild(image);
					} else if (fullLabel) {
						const placeholder = document.createElementNS(svgNs, 'text');
						placeholder.setAttribute('class', 'ccx-axis-tick-placeholder');
						placeholder.setAttribute('x', '0');
						placeholder.setAttribute(
							'y',
							String(imageY + imageSize / 2 + 4),
						);
						placeholder.setAttribute('text-anchor', 'middle');
						placeholder.textContent = fullLabel.slice(0, 2).toUpperCase();
						tick.appendChild(placeholder);
					}
				}

				if (label) {
					const labelText = document.createElementNS(svgNs, 'text');
					labelText.setAttribute('class', 'ccx-axis-tick-label');
					labelText.setAttribute('x', '0');
					labelText.setAttribute(
						'y',
						String(
							showImages
								? IMAGE_OFFSET + imageSize + LABEL_OFFSET
								: LABEL_OFFSET,
						),
					);
					labelText.setAttribute('text-anchor', 'middle');
					labelText.textContent = label;
					tick.appendChild(labelText);
				}
			} else if (label) {
				const labelText = document.createElementNS(svgNs, 'text');
				labelText.setAttribute('class', 'ccx-axis-tick-label');
				labelText.setAttribute('x', '0');
				labelText.setAttribute('y', String(LABEL_OFFSET));
				labelText.setAttribute('text-anchor', 'middle');
				labelText.textContent = label;
				tick.appendChild(labelText);
			}

			xAxisGroup.appendChild(tick);
		});

		svg.appendChild(xAxisGroup);

		if (showMetricAxes && series.length >= 1) {
			const leftGroup = document.createElementNS(svgNs, 'g');
			leftGroup.setAttribute('class', 'ccx-y-axis ccx-y-axis-left');

			metricAxes[0].ticks.forEach((tickValue) => {
				const y = this.#valueToY(
					tickValue,
					metricAxes[0].domainMax,
					plotTop,
					plotHeight,
				);
				const text = document.createElementNS(svgNs, 'text');
				text.setAttribute('class', 'ccx-y-tick');
				text.setAttribute('x', String(plotLeft - Y_TICK_MARGIN));
				text.setAttribute('y', String(y));
				text.setAttribute('dominant-baseline', 'middle');
				text.setAttribute('text-anchor', 'end');
				text.textContent = formatAxisTick(tickValue, series[0]);
				leftGroup.appendChild(text);
			});

			svg.appendChild(leftGroup);
		}

		if (showMetricAxes && series.length >= 2 && !sharedScale) {
			const rightGroup = document.createElementNS(svgNs, 'g');
			rightGroup.setAttribute('class', 'ccx-y-axis ccx-y-axis-right');

			metricAxes[1].ticks.forEach((tickValue) => {
				const y = this.#valueToY(
					tickValue,
					metricAxes[1].domainMax,
					plotTop,
					plotHeight,
				);
				const text = document.createElementNS(svgNs, 'text');
				text.setAttribute('class', 'ccx-y-tick');
				text.setAttribute('x', String(plotRight + Y_TICK_MARGIN));
				text.setAttribute('y', String(y));
				text.setAttribute('dominant-baseline', 'middle');
				text.setAttribute('text-anchor', 'start');
				text.textContent = formatAxisTick(tickValue, series[1]);
				rightGroup.appendChild(text);
			});

			svg.appendChild(rightGroup);
		}

		const root = document.createElement('div');
		root.className = 'ccx-root';
		root.style.setProperty('--ccx-min-width', `${minWidth}px`);
		root.style.setProperty('--ccx-height', `${height}px`);

		if (showMetricHeader) {
			const header = document.createElement('div');
			header.className = 'ccx-metric-header';
			header.setAttribute('data-count', String(series.length));

			series.forEach((item, index) => {
				const labelEl = document.createElement('div');
				labelEl.className = 'ccx-metric-label';
				if (series.length === 2 && index === 1) {
					labelEl.setAttribute('data-align', 'right');
				}
				labelEl.textContent = item.label;
				header.appendChild(labelEl);
			});

			root.appendChild(header);
		}

		const chart = document.createElement('div');
		chart.className = 'ccx-chart';
		chart.style.setProperty('--ccx-height', `${height}px`);
		chart.appendChild(svg);

		if (showTooltip) {
			const tooltip = document.createElement('div');
			tooltip.className = 'ccx-tooltip';
			tooltip.setAttribute('aria-hidden', 'true');
			chart.appendChild(tooltip);

			let cursorLine: SVGLineElement | null = null;

			if (type === 'line' || type === 'area') {
				cursorLine = document.createElementNS(svgNs, 'line');
				cursorLine.setAttribute('class', 'ccx-cursor-line');
				cursorLine.setAttribute('y1', String(plotTop));
				cursorLine.setAttribute('y2', String(plotBottom));
				svg.insertBefore(cursorLine, plotGroup);
			}

			let activeCategory = -1;

			const fillTooltip = (categoryIndex: number): void => {
				const datum = data[categoryIndex];
				const title = getPrimitiveValue(datum[labelKey]) ?? '';
				tooltip.replaceChildren();

				if (title) {
					const titleEl = document.createElement('div');
					titleEl.className = 'ccx-tooltip-title';
					titleEl.textContent = title;
					tooltip.appendChild(titleEl);
				}

				const rows = document.createElement('div');
				rows.className = 'ccx-tooltip-rows';

				series.forEach((item) => {
					const value = getNumericValue(datum[item.key]);
					if (value == null) {
						return;
					}

					const row = document.createElement('div');
					row.className = 'ccx-tooltip-row';

					const swatch = document.createElement('span');
					swatch.className = 'ccx-tooltip-swatch';
					swatch.style.backgroundColor = item.color;

					const name = document.createElement('span');
					name.textContent = item.label;

					const valueEl = document.createElement('span');
					valueEl.className = 'ccx-tooltip-value';
					valueEl.textContent = formatSeriesValue(value, item);

					row.append(swatch, name, valueEl);
					rows.appendChild(row);
				});

				tooltip.appendChild(rows);

				if (type === 'bar') {
					chart.setAttribute('data-hovering', '');
					plotGroup
						.querySelectorAll('.ccx-bar-group')
						.forEach((group) => group.removeAttribute('data-hovered'));
					const active = plotGroup.querySelector(
						`.ccx-bar-group[data-category-index="${categoryIndex}"]`,
					);
					active?.setAttribute('data-hovered', '');
				}

				if (cursorLine) {
					const centerX = categoryLayouts[categoryIndex].centerX;
					cursorLine.setAttribute('x1', String(centerX));
					cursorLine.setAttribute('x2', String(centerX));
					cursorLine.setAttribute('data-visible', '');
				}
			};

			const positionTooltip = (
				categoryIndex: number,
				pointerY: number,
			): void => {
				const chartRect = chart.getBoundingClientRect();
				const tooltipRect = tooltip.getBoundingClientRect();
				const anchorX = categoryLayouts[categoryIndex].centerX;

				const localX = anchorX - tooltipRect.width / 2;
				const localY = pointerY - tooltipRect.height - TOOLTIP_OFFSET;

				const clampedX = Math.max(
					0,
					Math.min(localX, chartRect.width - tooltipRect.width),
				);
				const clampedY = Math.max(
					0,
					Math.min(localY, chartRect.height - tooltipRect.height),
				);

				tooltip.style.left = `${clampedX}px`;
				tooltip.style.top = `${clampedY}px`;
			};

			const hideTooltip = (): void => {
				activeCategory = -1;
				tooltip.removeAttribute('data-visible');
				chart.removeAttribute('data-hovering');
				cursorLine?.removeAttribute('data-visible');
				plotGroup
					.querySelectorAll('.ccx-bar-group')
					.forEach((group) => group.removeAttribute('data-hovered'));
			};

			const findNearestCategory = (offsetX: number): number => {
				let nearest = 0;
				let nearestDistance = Number.POSITIVE_INFINITY;

				categoryLayouts.forEach((layout) => {
					const distance = Math.abs(layout.centerX - offsetX);
					if (distance < nearestDistance) {
						nearestDistance = distance;
						nearest = layout.index;
					}
				});

				return nearest;
			};

			chart.addEventListener('pointermove', (event) => {
				const svgRect = svg.getBoundingClientRect();
				const chartRect = chart.getBoundingClientRect();
				const categoryIndex = findNearestCategory(
					event.clientX - svgRect.left,
				);

				if (categoryIndex !== activeCategory) {
					activeCategory = categoryIndex;
					fillTooltip(categoryIndex);
				}

				tooltip.setAttribute('data-visible', '');
				positionTooltip(categoryIndex, event.clientY - chartRect.top);
			});

			chart.addEventListener('pointerleave', hideTooltip);
		}

		root.appendChild(chart);

		if (showLegend) {
			const legend = document.createElement('div');
			legend.className = 'ccx-legend';

			series.forEach((item) => {
				const legendItem = document.createElement('div');
				legendItem.className = 'ccx-legend-item';

				const swatch = document.createElement('span');
				swatch.className = 'ccx-legend-swatch';
				swatch.style.backgroundColor = item.color;

				const name = document.createElement('span');
				name.textContent = item.label;

				legendItem.append(swatch, name);
				legend.appendChild(legendItem);
			});

			root.appendChild(legend);
		}

		mount.replaceChildren(root);

		if (showValueLabels) {
			this.#scheduleLabelCollisionFix(plotBottom);
		}
	}
}

installConfigProperties(CreativeChart, [
	'type',
	'data',
	'series',
	'xKey',
	'labelKey',
	'imageKey',
	'imageAltKey',
	'maxSeries',
	'height',
	'minWidth',
	'gridLines',
	'showGrid',
	'showTooltip',
	'showLegend',
	'showMetricHeader',
	'showMetricAxes',
	'showValueLabels',
	'imageSize',
	'labelMaxLength',
]);

defineElement('creative-chart', CreativeChart);

declare global {
	interface HTMLElementTagNameMap {
		'creative-chart': CreativeChart;
	}
}
