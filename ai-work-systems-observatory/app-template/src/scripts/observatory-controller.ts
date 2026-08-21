type JsonRecord = Record<string, any>;

type KpiElement = HTMLElement & { items?: readonly JsonRecord[] };
type TableElement = HTMLElement & { columns?: readonly JsonRecord[]; data?: readonly JsonRecord[]; pageSize?: number; stickyHeader?: boolean };

const reportPage = document.querySelector<HTMLElement>("#observatory-report");
const loading = document.querySelector<HTMLElement>("#report-loading");
const errorState = document.querySelector<HTMLElement>("#report-error");

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
};

const customElement = (tag: string, attributes: Record<string, string> = {}, text?: string): HTMLElement => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
};

const paragraph = (text: string, className?: string): HTMLParagraphElement => {
  const node = element("p", className ? { class: className } : {}, text);
  return node;
};

const list = (items: readonly string[]): HTMLUListElement => {
  const node = element("ul");
  for (const item of items) node.append(element("li", {}, item));
  return node;
};

const label = (text: string, variant = "neutral"): HTMLElement => customElement("wa-badge", { variant }, text);

const card = (heading: string, badgeText: string | undefined, body: readonly (HTMLElement | string)[]): HTMLElement => {
  const node = customElement("wa-card", { class: "report-card" });
  const stack = customElement("layout-stack", { gap: "s" });
  const header = customElement("layout-cluster", { gap: "xs", "align-items": "center" });
  header.append(element("h4", {}, heading));
  if (badgeText) header.append(label(badgeText));
  stack.append(header);
  for (const item of body) stack.append(typeof item === "string" ? paragraph(item) : item);
  node.append(stack);
  return node;
};

const section = (heading: string, kicker: string): HTMLElement => {
  const node = customElement("report-section", { heading });
  node.append(element("span", { slot: "kicker" }, kicker));
  return node;
};

const entry = (heading: string, description: string, full = false): HTMLElement => {
  const attributes: Record<string, string> = { heading, description };
  if (full) attributes.layout = "full";
  return customElement("report-entry", attributes);
};

const figure = (caption: string): HTMLElement => customElement("report-figure", { caption });

const formatDate = (value: string | undefined): string => {
  if (!value) return "Refresh time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};

const makeTable = async (columns: readonly JsonRecord[], data: readonly JsonRecord[]): Promise<TableElement> => {
  await customElements.whenDefined("creative-table");
  const table = customElement("creative-table") as TableElement;
  table.columns = columns;
  table.data = data;
  table.pageSize = Math.max(5, data.length);
  table.stickyHeader = true;
  return table;
};

const appendSystemLoop = (parent: HTMLElement, system: JsonRecord, proposed: boolean): void => {
  const loop = figure(proposed ? "Proposed operating-system loop" : "Observed operating-system loop");
  const grid = customElement("layout-grid", { gap: "m" });
  grid.setAttribute("style", "--min-column-size: 13rem");
  const stages: [string, string][] = proposed
    ? [
        ["Trigger", system.trigger], ["AI prepares", system.aiRole], ["Human judgment", system.humanRole],
        ["Output", system.output], ["Destination", system.destination], ["Success signal", system.successSignal],
      ]
    : [
        ["Trigger", system.trigger], ["Inputs", (system.inputs ?? []).join(", ")], ["AI prepares", system.aiRole],
        ["Output", system.output], ["Human control", system.humanControl], ["Consumption", system.consumption],
      ];
  stages.forEach(([name, value], index) => grid.append(card(`${index + 1}. ${name}`, undefined, [value || "Unknown"])));
  loop.append(grid);
  parent.append(loop);
};

const renderReport = async (report: JsonRecord): Promise<void> => {
  if (!reportPage) throw new Error("The report surface is unavailable.");
  if (report.documentType !== "executive-operating-report" || report.schemaVersion !== 2) throw new Error("The report data does not match the executive-report contract.");

  loading?.remove();
  errorState?.remove();

  const thesis = report.executiveThesis ?? {};
  const masthead = customElement("report-masthead", {
    kicker: thesis.kicker ?? "Executive operating-model review",
    meta: `${report.meta?.organizationName ?? "Organization"} · Refreshed ${formatDate(report.meta?.refreshedAt)}`,
    heading: thesis.heading ?? "AI work systems observatory",
  });
  masthead.append(paragraph(thesis.lede ?? "Observed state and proposed operating model."));
  const monday = customElement("wa-callout", { variant: "brand", class: "monday-callout" });
  monday.append(element("strong", {}, "What changes on Monday: "));
  monday.append(document.createTextNode(thesis.mondayChange ?? "No confirmed change yet."));
  masthead.append(monday);
  reportPage.append(masthead);

  await customElements.whenDefined("kpi-strip");
  const strip = customElement("kpi-strip") as KpiElement;
  strip.items = report.headlineMetrics;
  reportPage.append(strip);

  const thesisSection = section("I. Executive thesis", "The operating-model diagnosis");
  const thesisEntry = entry("The move", "Lead with the change in work, then use evidence to support it.");
  thesisEntry.append(paragraph(thesis.observedBasis ?? ""));
  thesisEntry.append(paragraph(report.meta?.adoptionDefinition ?? ""));
  thesisSection.append(thesisEntry);
  reportPage.append(thesisSection);

  const currentModel = report.currentOperatingModel ?? {};
  const operatingSection = section("II. How the team operates today", "Observed state");
  const roleEntry = entry("Roles and responsibilities", currentModel.narrative ?? "", true);
  const roleGrid = customElement("layout-grid", { gap: "m" });
  roleGrid.setAttribute("style", "--min-column-size: 16rem");
  for (const role of currentModel.roles ?? []) roleGrid.append(card(role.title, role.confidence ? `${role.confidence} confidence` : undefined, [list(role.responsibilities ?? [])]));
  roleEntry.append(roleGrid);
  operatingSection.append(roleEntry);

  const rhythmEntry = entry("Operating rhythm and handoffs", "The cadence where decisions, outputs, and manual coordination meet.", true);
  const rhythmGrid = customElement("layout-grid", { gap: "m" });
  rhythmGrid.setAttribute("style", "--min-column-size: 18rem");
  for (const rhythm of currentModel.rhythms ?? []) rhythmGrid.append(card(rhythm.name, rhythm.cadence, [paragraph(`Decisions: ${(rhythm.decisions ?? []).join(", ")}`), paragraph(`Outputs: ${(rhythm.outputs ?? []).join(", ")}`)]));
  for (const handoff of currentModel.handoffs ?? []) rhythmGrid.append(card(`${handoff.from} → ${handoff.to}`, "handoff", [paragraph(handoff.artifact), paragraph(`Friction: ${handoff.friction}`)]));
  rhythmEntry.append(rhythmGrid);
  operatingSection.append(rhythmEntry);
  reportPage.append(operatingSection);

  const currentSystems = report.currentSystems ?? {};
  const systemsSection = section("III. Current operating systems", "Qualified observed loops");
  const boundaryEntry = entry("Qualification boundary", currentSystems.narrative ?? "");
  boundaryEntry.append(paragraph("A current system needs a confirmed owner, real trigger, identifiable output, observed consumption, run-history health, and human control."));
  systemsSection.append(boundaryEntry);
  for (const system of currentSystems.systems ?? []) {
    const systemEntry = entry(system.name, `${system.businessJob} · ${system.health} · ${system.healthWindow}`, true);
    const badges = customElement("layout-cluster", { gap: "xs" });
    badges.append(label("Observed", "success"), label(system.owner), label(system.consumption));
    systemEntry.append(badges);
    appendSystemLoop(systemEntry, system, false);
    systemsSection.append(systemEntry);
  }
  const exclusions = await makeTable(
    [{ key: "name", label: "Inventory item" }, { key: "classification", label: "Correct classification" }, { key: "reason", label: "Why it is not a current system" }],
    currentSystems.excludedInventory ?? [],
  );
  const exclusionEntry = entry("What stayed outside the system count", "Availability, delivery, and incomplete setup do not prove operation.", true);
  exclusionEntry.append(exclusions);
  systemsSection.append(exclusionEntry);
  reportPage.append(systemsSection);

  const future = report.futureOperatingModel ?? {};
  const futureSection = section("IV. Alternative operating model", "Strategist recommendations");
  const futureIntro = entry("The proposed model", future.narrative ?? "");
  futureIntro.append(paragraph("Everything in this chapter is proposed. It is not evidence of current operation."));
  futureSection.append(futureIntro);
  for (const system of future.systems ?? []) {
    const systemEntry = entry(system.name, system.currentGap, true);
    const badges = customElement("layout-cluster", { gap: "xs" });
    badges.append(label("Proposed", "brand"), label(`Owner: ${system.ownerRecommendation}`));
    systemEntry.append(badges);
    appendSystemLoop(systemEntry, system, true);
    futureSection.append(systemEntry);
  }
  reportPage.append(futureSection);

  const roleChanges = report.roleAndRhythmChanges ?? {};
  const roleSection = section("V. Role and rhythm changes", "Stop, continue, start");
  const changeEntry = entry("How work changes", roleChanges.narrative ?? "", true);
  changeEntry.append(await makeTable(
    [{ key: "role", label: "Role" }, { key: "stop", label: "Stop" }, { key: "continue", label: "Continue" }, { key: "start", label: "Start" }],
    roleChanges.stopContinueStart ?? [],
  ));
  roleSection.append(changeEntry);
  const cadenceEntry = entry("The future week", "AI prepares and maintains; people review, approve, and commit.", true);
  cadenceEntry.append(await makeTable(
    [{ key: "when", label: "When" }, { key: "system", label: "System" }, { key: "ai", label: "AI does" }, { key: "human", label: "Human approves" }],
    roleChanges.weeklyCadence ?? [],
  ));
  roleSection.append(cadenceEntry);
  reportPage.append(roleSection);

  const portfolio = report.opportunityPortfolio ?? {};
  const opportunitySection = section("VI. Opportunity portfolio", "Highest-value next systems");
  const opportunityEntry = entry("Top three build opportunities", portfolio.narrative ?? "", true);
  opportunityEntry.append(await makeTable(
    [{ key: "rank", label: "Rank", format: "number" }, { key: "title", label: "Opportunity" }, { key: "value", label: "Why it matters" }, { key: "readiness", label: "Readiness" }, { key: "nextMove", label: "Next move" }],
    portfolio.topThree ?? [],
  ));
  opportunitySection.append(opportunityEntry);
  const roadmapEntry = entry("Phased build sequence", "Each phase earns the right to add the next loop.", true);
  const roadmap = customElement("layout-stack", { gap: "m" });
  for (const phase of portfolio.buildSequence ?? []) roadmap.append(card(phase.phase, phase.timing, [paragraph((phase.systems ?? []).join(", ")), paragraph(`Exit when: ${phase.exit}`)]));
  roadmapEntry.append(roadmap);
  opportunitySection.append(roadmapEntry);
  reportPage.append(opportunitySection);

  const governance = report.evidenceGovernance ?? {};
  const evidenceSection = section("VII. Evidence and governance", "Audit trail");
  const evidenceEntry = entry("Claims, recommendations, and source coverage", governance.sourceCoverageSummary ?? "", true);
  const details = customElement("wa-details", { summary: "Open the evidence and governance appendix" });
  const detailsStack = customElement("layout-stack", { gap: "l" });
  const claims = [...(governance.observedClaims ?? []), ...(governance.recommendations ?? [])].map((claim: JsonRecord) => ({ claim: claim.claim, type: claim.type, confidence: claim.confidence ?? "n/a", evidence: (claim.evidenceRefs ?? []).join(", ") || "Hypothesis or unresolved" }));
  detailsStack.append(await makeTable(
    [{ key: "claim", label: "Claim" }, { key: "type", label: "Type" }, { key: "confidence", label: "Confidence" }, { key: "evidence", label: "Evidence refs" }],
    claims,
  ));
  detailsStack.append(await makeTable(
    [{ key: "label", label: "Source" }, { key: "available", label: "Available" }, { key: "rowsObserved", label: "Rows observed", format: "number" }, { key: "limitations", label: "Limitations" }],
    governance.sourceCoverage ?? [],
  ));
  detailsStack.append(card("Unknowns", `${(governance.unknowns ?? []).length}`, [list(governance.unknowns ?? [])]));
  detailsStack.append(card("Controls", `${(governance.governance ?? []).length}`, [list(governance.governance ?? [])]));
  detailsStack.append(card("Limitations", `${(governance.limitations ?? []).length}`, [list(governance.limitations ?? [])]));
  details.append(detailsStack);
  evidenceEntry.append(details);
  evidenceSection.append(evidenceEntry);
  reportPage.append(evidenceSection);
};

const fail = (error: unknown): void => {
  loading?.remove();
  if (!errorState) return;
  errorState.hidden = false;
  errorState.textContent = `The executive report could not load. ${error instanceof Error ? error.message : "Please refresh and try again."}`;
};

if (!reportPage) {
  fail(new Error("The report surface is unavailable."));
} else {
  fetch("/data/observatory.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Report data returned ${response.status}.`);
      return response.json();
    })
    .then(renderReport)
    .catch(fail);
}
