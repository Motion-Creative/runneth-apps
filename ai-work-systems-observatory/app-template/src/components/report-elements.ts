/**
 * Editorial report layout elements: masthead, section, entry, figure, and page
 * shell. Shadow DOM owns structure; slotted children stay in the light DOM.
 *
 * Astro / HTML:
 *   <report-page colophon="...">
 *     <report-masthead kicker="Status report" meta="Q3 2026" heading="...">
 *       <p>Lede copy.</p>
 *     </report-masthead>
 *     <report-section heading="I. Shipped this week">
 *       <span slot="kicker">Week 12</span>
 *       <report-entry heading="1. Feature" description="...">
 *         <p>Required entry body content goes in the default slot.</p>
 *       </report-entry>
 *     </report-section>
 *   </report-page>
 *
 * Browser TypeScript uses camelCase properties (heading, not title).
 */

import {
	BuildethElement,
	defineElement,
	escapeHtml,
	installConfigProperties,
	readNumberAttribute,
	readStringAttribute,
} from './internal/runtime';
import {
	buildEmptyDefaultSlotMessage,
	SCAFFOLD_ELEMENT_ATTRIBUTES,
	slotNodesHaveRenderableContent,
} from './scaffold-contracts';

import './report-elements.css';

import reportEntryCss from './report-entry.css?inline';
import reportFigureCss from './report-figure.css?inline';
import reportMastheadCss from './report-masthead.css?inline';
import reportPageCss from './report-page.css?inline';
import reportSectionCss from './report-section.css?inline';

const createShadowSheet = (css: string): CSSStyleSheet => {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	return sheet;
};

const mastheadSheet = createShadowSheet(reportMastheadCss);
const sectionSheet = createShadowSheet(reportSectionCss);
const entrySheet = createShadowSheet(reportEntryCss);
const figureSheet = createShadowSheet(reportFigureCss);
const pageSheet = createShadowSheet(reportPageCss);

const adoptShadowSheet = (shadow: ShadowRoot, sheet: CSSStyleSheet): void => {
	shadow.adoptedStyleSheets = [sheet];
};

const assignedSlotHasContent = (slot: HTMLSlotElement | null): boolean =>
	(slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;

const reportEntryDefaultSlotHasContent = (
	slot: HTMLSlotElement | null,
): boolean =>
	slotNodesHaveRenderableContent(slot?.assignedNodes({ flatten: true }) ?? []);

const resolveFigureNumber = (element: ReportFigure): number => {
	const explicit =
		(element.configProperties['number'] as number | undefined) ??
		readNumberAttribute(element, 'number');
	if (explicit !== undefined) {
		return explicit;
	}
	const page = element.closest('report-page');
	const figures =
		page === null
			? document.querySelectorAll('report-figure')
			: page.querySelectorAll('report-figure');
	for (let index = 0; index < figures.length; index += 1) {
		if (figures[index] === element) {
			return index + 1;
		}
	}
	return 1;
};

export class ReportMasthead extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['report-masthead']];

	declare kicker: string | undefined;
	declare meta: string | undefined;
	declare heading: string | undefined;

	#shadow: ShadowRoot | null = null;
	#ledeSlot: HTMLSlotElement | null = null;
	#onLedeSlotChange = (): void => {
		this.#ledeSlot
			?.closest('.lede')
			?.classList.toggle('is-empty', !assignedSlotHasContent(this.#ledeSlot));
	};

	protected render(): void {
		const shadow = this.#ensureShadow();
		const kicker =
			this.configProperty<string>('kicker') ??
			readStringAttribute(this, 'kicker') ??
			'';
		const meta =
			this.configProperty<string>('meta') ?? readStringAttribute(this, 'meta');
		const heading =
			this.configProperty<string>('heading') ??
			readStringAttribute(this, 'heading') ??
			'';

		shadow.innerHTML = `
			<div class="kicker-row">
				<span>${escapeHtml(kicker)}</span>
				${meta === undefined ? '' : `<span>${escapeHtml(meta)}</span>`}
			</div>
			<h1>${escapeHtml(heading)}</h1>
			<div class="lede"><slot></slot></div>
		`;

		this.#ledeSlot = shadow.querySelector('slot');
		this.#ledeSlot?.addEventListener('slotchange', this.#onLedeSlotChange);
		this.#onLedeSlotChange();
	}

	#ensureShadow(): ShadowRoot {
		if (this.#shadow === null) {
			this.#shadow = this.attachShadow({ mode: 'open' });
			adoptShadowSheet(this.#shadow, mastheadSheet);
		}
		return this.#shadow;
	}
}

export class ReportSection extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['report-section']];

	declare heading: string | undefined;

	#shadow: ShadowRoot | null = null;
	#kickerSlot: HTMLSlotElement | null = null;
	#onKickerSlotChange = (): void => {
		this.#kickerSlot
			?.closest('.section-kicker')
			?.classList.toggle(
				'is-empty',
				!assignedSlotHasContent(this.#kickerSlot),
			);
	};

	protected render(): void {
		const shadow = this.#ensureShadow();
		const heading =
			this.configProperty<string>('heading') ??
			readStringAttribute(this, 'heading') ??
			'';

		shadow.innerHTML = `
			<div class="section-kicker"><slot name="kicker"></slot></div>
			<h2 class="section-title">${escapeHtml(heading)}</h2>
			<slot></slot>
		`;

		this.#kickerSlot = shadow.querySelector('slot[name="kicker"]');
		this.#kickerSlot?.addEventListener('slotchange', this.#onKickerSlotChange);
		this.#onKickerSlotChange();
	}

	#ensureShadow(): ShadowRoot {
		if (this.#shadow === null) {
			this.#shadow = this.attachShadow({ mode: 'open' });
			adoptShadowSheet(this.#shadow, sectionSheet);
		}
		return this.#shadow;
	}
}

type EntryLayout = 'split' | 'full';

export class ReportEntry extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['report-entry']];

	declare heading: string | undefined;
	declare layout: EntryLayout | undefined;
	declare description: string | undefined;

	#shadow: ShadowRoot | null = null;
	#defaultSlot: HTMLSlotElement | null = null;
	#onDefaultSlotChange = (): void => {
		if (reportEntryDefaultSlotHasContent(this.#defaultSlot)) {
			return;
		}

		console.error(buildEmptyDefaultSlotMessage('report-entry'));
	};

	protected render(): void {
		const shadow = this.#ensureShadow();
		const heading =
			this.configProperty<string>('heading') ??
			readStringAttribute(this, 'heading') ??
			'';
		const layout =
			this.configProperty<EntryLayout>('layout') ??
			(readStringAttribute(this, 'layout') as EntryLayout | undefined) ??
			'split';
		const description =
			this.configProperty<string>('description') ??
			readStringAttribute(this, 'description');

		// Reflect the resolved layout for :host([layout='full']) styling when
		// browser code set it as a property. Guarded: layout is observed, and an
		// unconditional setAttribute would re-fire attributeChangedCallback on
		// every render and loop forever.
		if (layout === 'full' && this.getAttribute('layout') !== 'full') {
			this.setAttribute('layout', 'full');
		} else if (layout !== 'full' && this.hasAttribute('layout')) {
			this.removeAttribute('layout');
		}

		shadow.innerHTML = `
			<div class="entry-aside">
				<h3>${escapeHtml(heading)}</h3>
				${
					description === undefined
						? ''
						: `<p>${escapeHtml(description)}</p>`
				}
				<slot name="aside"></slot>
			</div>
			<div class="entry-body"><slot></slot></div>
		`;

		this.#defaultSlot =
			shadow.querySelector<HTMLSlotElement>('.entry-body slot');
		this.#defaultSlot?.addEventListener(
			'slotchange',
			this.#onDefaultSlotChange,
		);
		this.#onDefaultSlotChange();
	}

	#ensureShadow(): ShadowRoot {
		if (this.#shadow === null) {
			this.#shadow = this.attachShadow({ mode: 'open' });
			adoptShadowSheet(this.#shadow, entrySheet);
		}
		return this.#shadow;
	}

}

export class ReportFigure extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['report-figure']];

	declare caption: string | undefined;
	declare number: number | undefined;

	#shadow: ShadowRoot | null = null;

	protected render(): void {
		const shadow = this.#ensureShadow();
		const caption =
			this.configProperty<string>('caption') ??
			readStringAttribute(this, 'caption');
		const figureNumber = resolveFigureNumber(this);

		shadow.innerHTML = `
			<slot></slot>
			${
				caption === undefined
					? ''
					: `<figcaption class="fig"><em class="fig-label">Fig. ${String(
							figureNumber,
						)}</em> &mdash; ${escapeHtml(caption)}</figcaption>`
			}
		`;
	}

	#ensureShadow(): ShadowRoot {
		if (this.#shadow === null) {
			this.#shadow = this.attachShadow({ mode: 'open' });
			adoptShadowSheet(this.#shadow, figureSheet);
		}
		return this.#shadow;
	}
}

export class ReportPage extends BuildethElement {
	static observedAttributes = [...SCAFFOLD_ELEMENT_ATTRIBUTES['report-page']];

	declare colophon: string | undefined;

	#shadow: ShadowRoot | null = null;

	protected render(): void {
		const shadow = this.#ensureShadow();
		const colophon =
			this.configProperty<string>('colophon') ??
			readStringAttribute(this, 'colophon');

		shadow.innerHTML = `
			<slot></slot>
			${
				colophon === undefined
					? ''
					: `<footer class="colophon">${escapeHtml(colophon)}</footer>`
			}
		`;
	}

	#ensureShadow(): ShadowRoot {
		if (this.#shadow === null) {
			this.#shadow = this.attachShadow({ mode: 'open' });
			adoptShadowSheet(this.#shadow, pageSheet);
		}
		return this.#shadow;
	}
}

installConfigProperties(ReportMasthead, ['kicker', 'meta', 'heading']);
installConfigProperties(ReportSection, ['heading']);
installConfigProperties(ReportEntry, ['heading', 'layout', 'description']);
installConfigProperties(ReportFigure, ['caption', 'number']);
installConfigProperties(ReportPage, ['colophon']);

defineElement('report-masthead', ReportMasthead);
defineElement('report-section', ReportSection);
defineElement('report-entry', ReportEntry);
defineElement('report-figure', ReportFigure);
defineElement('report-page', ReportPage);

declare global {
	interface HTMLElementTagNameMap {
		'report-masthead': ReportMasthead;
		'report-section': ReportSection;
		'report-entry': ReportEntry;
		'report-figure': ReportFigure;
		'report-page': ReportPage;
	}
}
