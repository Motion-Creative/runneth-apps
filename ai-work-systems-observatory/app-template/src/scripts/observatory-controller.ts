type Kpi = {
  value: string;
  label: string;
  delta?: string;
  tone?: "positive" | "negative";
};

type ObservatoryData = {
  meta: {
    mode: "illustrative" | "live";
    organizationName: string;
    refreshedAt: string;
    sourceCoverage: Array<{
      sourceId: string;
      label: string;
      available: boolean;
      note?: string;
    }>;
  };
  executive: {
    summary: string;
    kpis: Kpi[];
    narrativeCards: Array<{ title: string; body: string }>;
    maturityDistribution: Array<{ level: string; label: string; systems: number }>;
  };
  teams: { rows: Array<Record<string, string | number | boolean | null>> };
  systems: { rows: Array<Record<string, string | number | boolean | null>> };
  risks: { rows: Array<Record<string, string | number | boolean | null>> };
  decisions: { rows: Array<Record<string, string | number | boolean | null>> };
  methodology: {
    sourceCoverageSummary: string;
    evidenceBoundary: string;
    methodology: string;
    privacy: string;
  };
};

type KpiStripElement = HTMLElement & { items: Kpi[] };
type ChartElement = HTMLElement & {
  data: ObservatoryData["executive"]["maturityDistribution"];
  series: Array<Record<string, unknown>>;
};
type TableElement = HTMLElement & {
  data: Array<Record<string, string | number | boolean | null>>;
  columns: Array<Record<string, unknown>>;
};

const APP_ROUTE = "/ai-work-systems-observatory";
const appBase = window.location.pathname === APP_ROUTE || window.location.pathname.startsWith(`${APP_ROUTE}/`)
  ? APP_ROUTE
  : "";
const dataUrl = `${appBase}/data/observatory.json`;

function setText(binding: string, value: string): void {
  document.querySelectorAll<HTMLElement>(`[data-bind="${binding}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function assignData(data: ObservatoryData): Promise<void> {
  setText("organizationName", data.meta.organizationName);
  setText("refreshedAt", formatTimestamp(data.meta.refreshedAt));
  setText("executiveSummary", data.executive.summary);
  setText("sourceCoverageSummary", data.methodology.sourceCoverageSummary);
  setText("evidenceBoundary", data.methodology.evidenceBoundary);
  setText("methodology", data.methodology.methodology);
  setText("privacy", data.methodology.privacy);

  data.executive.narrativeCards.slice(0, 3).forEach((card, index) => {
    setText(`narrativeTitle${index}`, card.title);
    setText(`narrativeBody${index}`, card.body);
  });

  if (data.meta.mode === "illustrative") {
    document.querySelector<HTMLElement>("#illustrative-banner")?.removeAttribute("hidden");
  }

  await Promise.all([
    customElements.whenDefined("kpi-strip"),
    customElements.whenDefined("creative-chart"),
    customElements.whenDefined("creative-table"),
  ]);

  const kpis = document.querySelector<KpiStripElement>("#executive-kpis");
  if (kpis) kpis.items = data.executive.kpis;

  const maturity = document.querySelector<ChartElement>("#maturity-chart");
  if (maturity) {
    maturity.data = data.executive.maturityDistribution;
    maturity.series = [{ key: "systems", label: "Systems", format: "number", decimals: 0 }];
  }

  const teams = document.querySelector<TableElement>("#teams-table");
  if (teams) {
    teams.data = data.teams.rows;
    teams.columns = [
      { key: "team", label: "Team", width: "14rem" },
      { key: "meaningfulWorkflows", label: "Workflows", format: "number", decimals: 0 },
      { key: "ownedCoverage", label: "Owned coverage", format: "percent", decimals: 0 },
      { key: "proactiveShare", label: "Proactive activity", format: "percent", decimals: 0 },
      { key: "highestEvidence", label: "Highest evidence", width: "10rem" },
      { key: "sourceCoverage", label: "Source coverage", format: "percent", decimals: 0 },
      { key: "note", label: "Operating note", width: "24rem" },
    ];
  }

  const systems = document.querySelector<TableElement>("#systems-table");
  if (systems) {
    systems.data = data.systems.rows;
    systems.columns = [
      { key: "name", label: "System", width: "18rem" },
      { key: "businessJob", label: "Business job", width: "22rem" },
      { key: "team", label: "Team", width: "10rem" },
      { key: "ownerStatus", label: "Owner", width: "10rem" },
      { key: "trigger", label: "Trigger", width: "12rem" },
      { key: "health", label: "Health", width: "10rem" },
      { key: "maturity", label: "Maturity", width: "10rem" },
      { key: "evidenceStage", label: "Evidence", width: "11rem" },
      { key: "humanControl", label: "Human control", width: "16rem" },
    ];
  }

  const risks = document.querySelector<TableElement>("#risks-table");
  if (risks) {
    risks.data = data.risks.rows;
    risks.columns = [
      { key: "risk", label: "Risk", width: "22rem" },
      { key: "category", label: "Category", width: "10rem" },
      { key: "severity", label: "Severity", width: "8rem" },
      { key: "affectedWorkflows", label: "Affected workflows", format: "number", decimals: 0 },
      { key: "decisionRequired", label: "Decision required", width: "24rem" },
      { key: "ownerStatus", label: "Owner", width: "10rem" },
      { key: "reviewBy", label: "Review by", width: "10rem" },
    ];
  }

  const decisions = document.querySelector<TableElement>("#decisions-table");
  if (decisions) {
    decisions.data = data.decisions.rows;
    decisions.columns = [
      { key: "decision", label: "Decision", width: "24rem" },
      { key: "whyNow", label: "Why now", width: "26rem" },
      { key: "ownerStatus", label: "Accountable owner", width: "12rem" },
      { key: "status", label: "Status", width: "10rem" },
    ];
  }

  const sourceList = document.querySelector<HTMLElement>("#source-list");
  if (sourceList) {
    sourceList.replaceChildren();
    data.meta.sourceCoverage.forEach((source) => {
      const tag = document.createElement("wa-tag");
      tag.setAttribute("size", "s");
      tag.setAttribute("appearance", "filled-outlined");
      tag.setAttribute("variant", source.available ? "success" : "warning");
      tag.textContent = `${source.label}: ${source.available ? "available" : "not available"}`;
      if (source.note) tag.setAttribute("title", source.note);
      sourceList.append(tag);
    });
  }
}

async function load(): Promise<void> {
  try {
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Dashboard data request failed with ${response.status}`);
    const data = await response.json() as ObservatoryData;
    await assignData(data);
  } catch (error) {
    console.error(error);
    document.querySelector<HTMLElement>("#load-error")?.removeAttribute("hidden");
  }
}

void load();
