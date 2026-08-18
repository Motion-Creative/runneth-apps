import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageRoot = new URL("../", import.meta.url);
const repositoryRoot = new URL("../../", import.meta.url);

const readPackageFile = async (relativePath) =>
  await readFile(new URL(relativePath, packageRoot), "utf8");

test("new package is consistently published as version 1", async () => {
  const manifest = JSON.parse(await readPackageFile("package.json"));
  const index = JSON.parse(
    await readFile(new URL("package-index.json", repositoryRoot), "utf8"),
  );
  const indexEntry = index.packages.find(({ id }) => id === "creator-intel");
  const hookMiningEntry = index.packages.find(
    ({ id }) => id === "hook-script-mining",
  );

  assert.equal(manifest.version, "1");
  assert.equal(manifest.installPolicy, "auto");
  assert.equal(manifest.updatePolicy, "auto");
  assert.equal(manifest.uninstallPolicy, "allowed");
  assert.equal(indexEntry?.version, manifest.version);
  assert.equal(indexEntry?.name, manifest.name);
  assert.equal(indexEntry?.description, manifest.description);
  assert.equal(indexEntry?.installPolicy, manifest.installPolicy);
  assert.equal(indexEntry?.updatePolicy, manifest.updatePolicy);
  assert.equal(indexEntry?.uninstallPolicy, manifest.uninstallPolicy);
  assert.equal(indexEntry?.packageManagerVersion, 1);
  assert.deepEqual(indexEntry?.categories, ["ai-training-club-26"]);
  assert.deepEqual(indexEntry?.categories, hookMiningEntry?.categories);
  assert.equal(indexEntry?.installPolicy, hookMiningEntry?.installPolicy);
  assert.equal(indexEntry?.updatePolicy, hookMiningEntry?.updatePolicy);
  assert.deepEqual(indexEntry?.source, {
    type: "github",
    owner: "Motion-Creative",
    repo: "runneth-apps",
    path: "creator-intel",
    ref: "main",
  });
});

test("customer-owned files have deterministic versioned envelopes", async () => {
  const contract = await readPackageFile("brain/creator-data-contract.md");
  const setup = await readPackageFile(
    "skills/setup-creator-intelligence/SKILL.md",
  );

  for (const expected of [
    '{"schemaVersion":1,"identities":[]}',
    '{"schemaVersion":1,"relationships":[]}',
    '{"schemaVersion":1,"evidence":[]}',
    '{"schemaVersion":1,"recommendations":[]}',
    '{"schemaVersion":1,"items":[]}',
  ]) {
    assert.ok(contract.includes(expected), `missing literal envelope: ${expected}`);
  }

  assert.match(contract, /"status": "never-run"/);
  assert.match(contract, /one compact JSON object per line/);
  assert.match(contract, /"action":"<action>"/);
  assert.match(setup, /never choose a different envelope/);
  assert.match(setup, /repairs missing state first/);
  assert.match(setup, /never appends a duplicate completed-setup event/);
});

test("rights are a simple per-creator field, not a separate ledger", async () => {
  const contract = await readPackageFile("brain/creator-data-contract.md");
  assert.match(contract, /Rights are a simple per-creator field, not a separate ledger/);
  assert.match(contract, /"usageScope": "none \| some \| all"/);
  assert.doesNotMatch(contract, /rights\.json/);
});

test("performance model defaults to Meta and aligns dashboard windows", async () => {
  const contract = await readPackageFile("brain/creator-data-contract.md");
  assert.match(contract, /Do not pre-create snapshot files/);
  assert.match(contract, /Northbeam is not part of the default model/);
  assert.match(contract, /30d \| 60d \| 90d \| 365d/);
  assert.match(contract, /`last_60d` is not a supported preset/);
});

test("connection state stores references, never credential values", async () => {
  const contract = await readPackageFile("brain/creator-data-contract.md");
  const setup = await readPackageFile(
    "skills/setup-creator-intelligence/SKILL.md",
  );
  const recommendation = await readPackageFile(
    "skills/recommend-creators/SKILL.md",
  );

  assert.match(contract, /"secretKeyRef"/);
  assert.match(contract, /never contain the secret value/);
  assert.match(setup, /Never store tokens, API keys, cookies/);
  assert.match(recommendation, /secure secret input/);
  assert.match(recommendation, /Persist only that secret-key reference/);
});

test("dashboard owns leaderboard routing and recommendations own casting", async () => {
  const dashboard = await readPackageFile(
    "skills/build-creator-dashboard/SKILL.md",
  );
  const recommendation = await readPackageFile(
    "skills/recommend-creators/SKILL.md",
  );

  assert.match(dashboard, /- creator leaderboard/);
  assert.match(dashboard, /- who are our best creators/);
  assert.doesNotMatch(recommendation, /- creator leaderboard/);
  assert.doesNotMatch(recommendation, /- who are our best creators/);
});

test("setup and roster building do not claim the same build trigger", async () => {
  const setup = await readPackageFile(
    "skills/setup-creator-intelligence/SKILL.md",
  );
  const roster = await readPackageFile(
    "skills/build-and-confirm-roster/SKILL.md",
  );

  assert.doesNotMatch(setup, /^    - build our creator roster$/m);
  assert.match(roster, /^    - build our creator roster$/m);
  assert.match(roster, /hand off to `setup-creator-intelligence`/);
});

test("top creator similarity ranks overlap without making it an eligibility gate", async () => {
  const recommendation = await readPackageFile(
    "skills/recommend-creators/SKILL.md",
  );
  const actors = await readPackageFile("brain/apify-actors.md");

  assert.match(recommendation, /6 to 10 genuinely relevant seeds/);
  assert.match(recommendation, /ranking boost, never an eligibility gate/);
  assert.match(recommendation, /cap it at 100 unique accounts/);
  assert.match(recommendation, /batches of at most 25 candidate handles/);
  assert.match(recommendation, /verified following-graph actor is Instagram-only/);
  assert.match(recommendation, /never send a TikTok handle to the Instagram actor/);
  assert.doesNotMatch(
    recommendation,
    /keep the accounts followed by two or more seeds as candidates/i,
  );
  assert.match(actors, /at most 10 calls/);
  assert.match(actors, /Every queued account receives its own target-specific topical-fit evaluation/);
});

test("method C uses an approved bounded async TikTok content search", async () => {
  const recommendation = await readPackageFile(
    "skills/recommend-creators/SKILL.md",
  );
  const actors = await readPackageFile("brain/apify-actors.md");
  const contract = await readPackageFile("brain/creator-data-contract.md");

  for (const expected of [
    /exactly five default keywords/,
    /one problem phrase, one category phrase, one why\/root-cause phrase, and two micro-persona phrases/,
    /estimated at roughly \$0\.50–\$1/,
    /clockworks\/tiktok-scraper/,
    /async start → poll → dataset-fetch recipe/,
    /fields=authorMeta,text,createTimeISO,webVideoUrl,searchQuery,playCount/,
    /apply the approved start\/end dates locally/,
    /out-of-window count/,
    /accounts with fewer than 10 videos/,
    /at most 10 total keywords/,
    /at most 10 videos per keyword/,
    /never start a second paid run/,
  ]) {
    assert.match(recommendation, expected);
  }

  assert.match(actors, /Never use this actor's `run-sync-get-dataset-items` endpoint/);
  assert.match(actors, /cap the full Method C run at 10 minutes/);
  assert.match(actors, /\^\[A-Za-z0-9_-\]\+\$/);
  assert.match(contract, /c-tiktok-content-search/);
  assert.match(contract, /resume that run instead of starting another/);
  assert.match(contract, /never store the credential, raw provider body, or unbounded dataset/);
  assert.doesNotMatch(contract, /c-reviews-gap/);
});

const behavioralContracts = [
  {
    name: "install stages files and a fresh session offers gated setup",
    file: "instructions/behavior.md",
    required: [
      /Package installation delivers files only/,
      /fresh session/,
      /at most once per conversation/,
      /wait for an explicit yes/,
      /if the account has exactly one workspace, use it and say so/i,
      /Never ask about Northbeam/,
    ],
  },
  {
    name: "setup is progressive, idempotent, and grounds the hiring lens",
    file: "skills/setup-creator-intelligence/SKILL.md",
    required: [
      /Setup is idempotent/,
      /resumable/,
      /never pulls creator performance/,
      /Account Context/,
      /Write the final `workspace\.json` update last/,
      /map how they hire onto signals already living in their ads/,
      /workspace_setup/,
      /Never store tokens, API keys, cookies/,
    ],
  },
  {
    name: "roster building keeps one complete table and bounded review pages",
    file: "skills/build-and-confirm-roster/SKILL.md",
    required: [
      /one canonical table of every creator/,
      /pages of at most 25 rows/,
      /omitted count/,
      /human confirmation gate/,
      /Silence changes nothing/,
      /pending-review\.json\.items\[\]/,
      /not done until it has walked every open item/,
    ],
  },
  {
    name: "recommendation is gap-first with a three-method ladder",
    file: "skills/recommend-creators/SKILL.md",
    required: [
      /Start with the gap/,
      /three-method ladder/,
      /Motion-context baseline/,
      /secret-collection/,
      /secure-fetch run/,
      /bodyTruncated/,
      /at most 10 seed profiles/,
      /12 minutes wall-clock/,
      /review-derived TikTok content search/,
      /run-sync-get-dataset-items/,
      /recommendations\.json\.recommendations\[\]/,
      /recommendation_created/,
      /pure creator-performance lookup.*do not create a recommendation record/,
    ],
  },
  {
    name: "dashboard has two core tabs, aligned windows, and conditional ROI",
    file: "skills/build-creator-dashboard/SKILL.md",
    required: [
      /two core tabs plus an optional ROI tab/,
      /Appears only when both are true/,
      /Keep OAuth protection enabled by default/,
      /Leaderboard/,
      /30\/60\/90\/365/,
      /never send the unsupported `last_60d` preset/,
      /refresh-creator-corpus/,
    ],
  },
  {
    name: "refresh records partial failures without mutating trust",
    file: "skills/refresh-creator-corpus/SKILL.md",
    required: [
      /must never silently create or change trusted identities/,
      /one canonical append-only audit event per source attempt/,
      /If one source fails, record the failure on that source only/,
      /Do not ask about Northbeam/,
      /explicit inclusive `--start-date` and `--end-date`/,
      /never send `last_60d`/,
    ],
  },
];

for (const contractCase of behavioralContracts) {
  test(`behavioral contract: ${contractCase.name}`, async () => {
    const content = await readPackageFile(contractCase.file);
    for (const required of contractCase.required) {
      assert.match(content, required);
    }
  });
}

test("the documented eval suite retains broad scenario coverage", async () => {
  const evals = await readPackageFile("brain/evals.md");
  const numberedCases = evals.match(/^\d+\. \*\*/gm) ?? [];

  assert.ok(numberedCases.length >= 50);
  assert.match(evals, /Gap first/);
  assert.match(evals, /Top creator similarity/);
  assert.match(evals, /ROI page conditional/);
  assert.match(evals, /Complete table, bounded pages/);
  assert.match(evals, /Fresh-session offer/);
  assert.match(evals, /Recommendation outcome guard/);
  assert.match(evals, /Scheduled partial failure/);
});
