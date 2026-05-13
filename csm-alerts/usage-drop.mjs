#!/usr/bin/env node
/**
 * Usage Drop Alert — Carissa / Quinn's book
 * ─────────────────────────────────────────────
 * Queries BQ for last 3 weeks of Runneth + Analytics + Inspo events
 * across the monitored CSM's book. Flags significant drops and posts
 * a grouped summary to #customer-success.
 *
 * Alert types:
 *   👻 Gone dark  — went to 0 events this week after ≥3 last week
 *   🚨 Cliff drop — current week < 50% of prior week (prior had ≥5 events)
 *   📉 Fading     — 3-week consistent decline (each week ≤75% of prior)
 *
 * Usage:
 *   node usage-drop.mjs [--csm-email quinn@motionapp.com] [--dry-run]
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const emailIdx = args.indexOf("--csm-email");
// Default to Quinn's book since Carissa is taking over
const CSM_EMAIL = emailIdx !== -1 ? args[emailIdx + 1] : "quinn@motionapp.com";

const CHANNEL = "C05G2BZ5G5V"; // #customer-success
const MY_SLACK = "<@U04H5TK9ZRA>"; // Carissa

// ─── BQ query ─────────────────────────────────────────────────────────────────
const sql = `
WITH csm_orgs AS (
  SELECT DISTINCT organization_id, OrganizationName AS org_name
  FROM \`motion-user-data.hubspot_cleaned.metrics_companies\`
  WHERE CSMEmail = '${CSM_EMAIL}'
    AND organization_id IS NOT NULL
),
events AS (
  SELECT organization_id, created AS ts
  FROM \`motion-user-data.ai_costs.agent_conversations\`
  WHERE created >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 21 DAY)
    AND NOT COALESCE(is_motion_internal, FALSE)

  UNION ALL

  SELECT organization_id, event_timestamp AS ts
  FROM \`motion-user-data.segment_cleaned.events_analytics\`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 21 DAY)

  UNION ALL

  SELECT organization_id, event_timestamp AS ts
  FROM \`motion-user-data.segment_cleaned.events_research\`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 21 DAY)
),
windowed AS (
  SELECT
    organization_id,
    COUNTIF(ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY))  AS w0,
    COUNTIF(ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
          AND ts < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY))  AS w1,
    COUNTIF(ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 21 DAY)
          AND ts < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)) AS w2
  FROM events
  GROUP BY organization_id
)
SELECT
  c.organization_id,
  c.org_name,
  COALESCE(w.w0, 0) AS w0,
  COALESCE(w.w1, 0) AS w1,
  COALESCE(w.w2, 0) AS w2
FROM csm_orgs c
LEFT JOIN windowed w USING (organization_id)
WHERE COALESCE(w.w1, 0) >= 3
ORDER BY (COALESCE(w.w0,0) - COALESCE(w.w1,0))
`;

function runBQ(query) {
  const script = `
    const { query } = await import('/agent/apps/runneth-dashboard/server/dashboard/server/lib/bigquery-v3.mjs');
    const rows = await query(\`${query.replace(/`/g, "\\`")}\`);
    process.stdout.write(JSON.stringify(rows));
  `;
  const out = execSync(`node --input-type=module`, {
    input: script,
    env: { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: "/agent/tools/bigquery/service-account.json" },
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(out.toString());
}

function classify(r) {
  const { w0, w1, w2 } = r;
  if (w1 >= 3 && w0 === 0)              return { type: "ghost", label: "👻 Gone dark" };
  if (w1 >= 5 && w0 < w1 * 0.5)        return { type: "cliff", label: "🚨 Cliff drop" };
  if (w2 >= 5 && w1 < w2 * 0.75 && w0 < w1 * 0.75)
                                         return { type: "fade",  label: "📉 Fading (3wk)" };
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(`Checking usage drops for ${CSM_EMAIL}...`);
const rows = runBQ(sql);
console.log(`  ${rows.length} orgs had ≥3 events last week.`);

const flagged = rows.map(r => ({ ...r, alert: classify(r) })).filter(r => r.alert !== null);
console.log(`  ${flagged.length} flagged for drops.`);

const dateStr = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Toronto", month: "short", day: "numeric",
});

let message;
if (flagged.length === 0) {
  message = `📊 *Usage check — ${dateStr}* ✅ All clear across ${CSM_EMAIL.split("@")[0]}'s book. No significant drops this week.`;
} else {
  const lines = [
    `📊 *Weekly usage drop alert — ${dateStr}*`,
    `${MY_SLACK} — ${flagged.length} account${flagged.length !== 1 ? "s" : ""} flagged in ${CSM_EMAIL.split("@")[0]}'s book:`,
  ];
  for (const a of flagged) {
    const pct = a.w1 > 0 ? Math.round(((a.w0 - a.w1) / a.w1) * 100) : -100;
    const pctStr = pct <= -100 ? "→ 0" : `${pct}% WoW`;
    const vacNote = a.alert.type === "cliff" ? " _(first drop — may be vacation)_" : "";
    lines.push(`  • ${a.alert.label} · *${a.org_name}* · ${a.w0} events vs ${a.w1} prior wk (${pctStr})${vacNote}`);
  }
  lines.push(`\n_Thresholds: gone-dark ≥3→0 events, cliff <50% WoW w/ ≥5 prior, fading 3-week ≤75%/step._`);
  message = lines.join("\n");
}

console.log("\n─── Message ──────────────────────────────────────────────────");
console.log(message);
console.log("──────────────────────────────────────────────────────────────\n");

if (!DRY_RUN) {
  execSync(`slack send --channel ${CHANNEL} --text ${JSON.stringify(message)}`, { stdio: "inherit" });
  console.log("Posted to #customer-success.");
} else {
  console.log("[DRY RUN — not posted]");
}
