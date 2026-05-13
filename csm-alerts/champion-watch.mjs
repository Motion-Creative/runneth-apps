#!/usr/bin/env node
/**
 * Champion Job-Change Monitor — Carissa / Quinn's book
 * ─────────────────────────────────────────────────────
 * Pulls top active accounts from Quinn's book via BQ, fetches their
 * primary contacts from HubSpot, enriches each via Apollo to get
 * current title + company, and flags any changes since the last run.
 *
 * State is stored at:
 *   /agent/brain/runneth_csms/carissa/champion-watch-state.json
 *
 * First run: builds the initial state (no alerts — nothing to diff against).
 * Subsequent runs: diffs and alerts on any title or company change.
 *
 * Usage:
 *   node champion-watch.mjs [--csm-email quinn@motionapp.com] [--dry-run]
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const emailIdx = args.indexOf("--csm-email");
const CSM_EMAIL = emailIdx !== -1 ? args[emailIdx + 1] : "quinn@motionapp.com";

const CHANNEL    = "C05G2BZ5G5V"; // #customer-success
const MY_SLACK   = "<@U04H5TK9ZRA>"; // Carissa
const STATE_FILE = "/agent/brain/runneth_csms/carissa/champion-watch-state.json";
const MAX_ACCTS  = 50; // top N accounts to watch

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function hubspot(path, method = "GET", body = null) {
  const args = [
    `secure-fetch run`,
    `--url "https://api.hubspot.com${path}"`,
    `--secret-key HUBSPOT_TOKEN`,
    `--auth-header Authorization`,
    `--auth-scheme Bearer`,
    `--method ${method}`,
  ];
  if (body) {
    args.push(`--header "Content-Type: application/json"`);
    args.push(`--body ${JSON.stringify(JSON.stringify(body))}`);
  }
  const out = execSync(args.join(" "), { maxBuffer: 5 * 1024 * 1024 });
  const resp = JSON.parse(out.toString());
  if (!resp.ok) throw new Error(`HubSpot ${method} ${path} → ${resp.status}`);
  return JSON.parse(resp.body);
}

function apollo(email) {
  const out = execSync(
    `secure-fetch run --url "https://api.apollo.io/api/v1/people/match?reveal_personal_emails=false&reveal_phone_number=false" --method POST --secret-key APOLLO_API_KEY --auth-header "X-Api-Key" --auth-scheme "" --header "Content-Type: application/json" --body ${JSON.stringify(JSON.stringify({ email }))}`,
    { maxBuffer: 2 * 1024 * 1024 }
  );
  const resp = JSON.parse(out.toString());
  if (!resp.ok) return null;
  const data = JSON.parse(resp.body);
  const person = data.person;
  if (!person) return null;
  const current = person.employment_history?.find(j => j.current);
  return {
    apolloId: person.id,
    title: current?.title || person.title || null,
    company: current?.organization_name || person.organization?.name || null,
    linkedinUrl: person.linkedin_url || null,
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Step 1: Get top accounts ──────────────────────────────────────────────────
const accountSql = `
SELECT DISTINCT
  c.organization_id,
  c.OrganizationName AS org_name,
  c.HubSpotCompanyId AS hs_company_id
FROM \`motion-user-data.hubspot_cleaned.metrics_companies\` c
WHERE c.CSMEmail = '${CSM_EMAIL}'
  AND c.organization_id IS NOT NULL
  AND c.HubSpotCompanyId IS NOT NULL
ORDER BY c.OrganizationName
LIMIT ${MAX_ACCTS}
`;

console.log(`Fetching top ${MAX_ACCTS} accounts for ${CSM_EMAIL}...`);
const accounts = runBQ(accountSql);
console.log(`  ${accounts.length} accounts found.`);

// ─── Step 2: Get primary contacts from HubSpot ────────────────────────────────
console.log("Fetching primary contacts from HubSpot...");
const contactEmails = [];

for (const acct of accounts) {
  try {
    const assoc = hubspot(
      `/crm/v3/objects/companies/${acct.hs_company_id}/associations/contacts`
    );
    const contactIds = (assoc.results || []).slice(0, 2).map(r => r.id);
    if (contactIds.length === 0) continue;

    // Batch read contact properties
    const batch = hubspot(
      `/crm/v3/objects/contacts/batch/read`,
      "POST",
      {
        properties: ["email", "firstname", "lastname", "jobtitle"],
        inputs: contactIds.map(id => ({ id })),
      }
    );
    for (const c of batch.results || []) {
      const email = c.properties?.email;
      if (email) {
        contactEmails.push({
          email,
          name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(" "),
          hsTitle: c.properties.jobtitle || null,
          orgName: acct.org_name,
          orgId: acct.organization_id,
        });
      }
    }
  } catch (e) {
    console.warn(`  Skipping ${acct.org_name}: ${e.message}`);
  }
}

console.log(`  ${contactEmails.length} contacts to enrich via Apollo.`);

// ─── Step 3: Enrich via Apollo ────────────────────────────────────────────────
console.log("Enriching contacts via Apollo (may take a moment)...");
const enriched = [];

for (const contact of contactEmails) {
  try {
    const data = apollo(contact.email);
    enriched.push({
      email: contact.email,
      name: contact.name,
      orgName: contact.orgName,
      orgId: contact.orgId,
      title: data?.title || contact.hsTitle || null,
      company: data?.company || contact.orgName,
      apolloId: data?.apolloId || null,
      linkedinUrl: data?.linkedinUrl || null,
      lastChecked: new Date().toISOString(),
    });
    await sleep(200); // gentle rate limiting
  } catch (e) {
    console.warn(`  Apollo failed for ${contact.email}: ${e.message}`);
    enriched.push({
      email: contact.email,
      name: contact.name,
      orgName: contact.orgName,
      orgId: contact.orgId,
      title: contact.hsTitle || null,
      company: contact.orgName,
      apolloId: null,
      linkedinUrl: null,
      lastChecked: new Date().toISOString(),
    });
  }
}

// ─── Step 4: Diff against saved state ────────────────────────────────────────
const newState = { lastRun: new Date().toISOString(), contacts: enriched };
const changes = [];

if (existsSync(STATE_FILE)) {
  const prevState = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  const prevMap = Object.fromEntries((prevState.contacts || []).map(c => [c.email, c]));

  for (const current of enriched) {
    const prev = prevMap[current.email];
    if (!prev) continue; // new contact — no diff yet

    const titleChanged   = prev.title   && current.title   && prev.title   !== current.title;
    const companyChanged = prev.company && current.company && prev.company !== current.company;

    if (titleChanged || companyChanged) {
      changes.push({
        contact: current,
        titleChange:   titleChanged   ? { from: prev.title,   to: current.title }   : null,
        companyChange: companyChanged ? { from: prev.company, to: current.company } : null,
      });
    }
  }
  console.log(`  ${changes.length} champion change(s) detected.`);
} else {
  console.log("  First run — building initial state. No diffs yet.");
}

// ─── Step 5: Save state ───────────────────────────────────────────────────────
writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
console.log(`  State saved to ${STATE_FILE}`);

// ─── Step 6: Post to Slack ────────────────────────────────────────────────────
const dateStr = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Toronto", month: "short", day: "numeric",
});

let message;
if (changes.length === 0) {
  message = `🔍 *Champion watch — ${dateStr}* ✅ No role or company changes detected across ${CSM_EMAIL.split("@")[0]}'s ${enriched.length} watched contacts.`;
} else {
  const lines = [
    `🔍 *Champion job-change alert — ${dateStr}*`,
    `${MY_SLACK} — ${changes.length} change${changes.length !== 1 ? "s" : ""} detected in ${CSM_EMAIL.split("@")[0]}'s book:`,
  ];
  for (const c of changes) {
    lines.push(`\n*${c.contact.name}* @ *${c.contact.orgName}*`);
    if (c.companyChange)
      lines.push(`  🏢 Company: _${c.companyChange.from}_ → *${c.companyChange.to}*`);
    if (c.titleChange)
      lines.push(`  💼 Title: _${c.titleChange.from}_ → *${c.titleChange.to}*`);
    if (c.contact.linkedinUrl)
      lines.push(`  ${c.contact.linkedinUrl}`);
  }
  lines.push(`\n_Watching ${enriched.length} contacts across ${accounts.length} accounts._`);
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
