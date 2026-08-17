import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageRoot = new URL("../", import.meta.url);
const repositoryRoot = new URL("../../../", import.meta.url);

const readPackageFile = async (relativePath) =>
  await readFile(new URL(relativePath, packageRoot), "utf8");

test("new package is consistently published as version 1", async () => {
  const manifest = JSON.parse(await readPackageFile("package.json"));
  const legacyManifest = JSON.parse(
    await readPackageFile("runneth-package.json"),
  );
  const index = JSON.parse(
    await readFile(new URL("package-index.json", repositoryRoot), "utf8"),
  );
  const indexEntry = index.packages.find(({ id }) => id === "creator-intel");

  assert.equal(manifest.version, "1");
  assert.deepEqual(legacyManifest, manifest);
  assert.equal(indexEntry?.version, manifest.version);
  assert.equal(indexEntry?.name, manifest.name);
  assert.equal(indexEntry?.description, manifest.description);
  assert.equal(indexEntry?.installPolicy, manifest.installPolicy);
  assert.equal(indexEntry?.updatePolicy, manifest.updatePolicy);
  assert.equal(indexEntry?.uninstallPolicy, manifest.uninstallPolicy);
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
    assert.match(contract, new RegExp(expected.replace(/[{}[\]]/g, "\\$&")));
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

test("performance model defaults to Meta with no snapshot matrix", async () => {
  const contract = await readPackageFile("brain/creator-data-contract.md");
  assert.match(contract, /Do not pre-create snapshot files/);
  assert.match(contract, /Northbeam is not part of the default model/);
});

const behavioralContracts = [
  {
    name: "setup runs at install with workspace skip and no Northbeam",
    file: "instructions/behavior.md",
    required: [
      /Setup runs at install time/,
      /If the account has exactly one workspace, use it and say so/,
      /Never ask about Northbeam/,
    ],
  },
  {
    name: "setup is progressive, idempotent, and grounds the hiring lens",
    file: "skills/setup-creator-intelligence/SKILL.md",
    required: [
      /Setup is idempotent/,
      /never pulls creator performance/,
      /Account Context/,
      /Write or update `workspace\.json` last/,
      /map how they hire onto signals already living in their ads/,
      /workspace_setup/,
    ],
  },
  {
    name: "roster building is one table that drives to zero",
    file: "skills/build-and-confirm-roster/SKILL.md",
    required: [
      /one table of every creator/,
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
      /Motion-context, always available/,
      /Apify/,
      /recommendations\.json\.recommendations\[\]/,
      /recommendation_created/,
      /pure creator-performance lookup.*do not create a recommendation record/,
    ],
  },
  {
    name: "dashboard is three tabs with a conditional ROI page",
    file: "skills/build-creator-dashboard/SKILL.md",
    required: [
      /Appears only when both are true/,
      /Private to the workspace by default/,
      /Leaderboard/,
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
  assert.match(evals, /Apify network walk/);
  assert.match(evals, /ROI page conditional/);
  assert.match(evals, /Recommendation outcome guard/);
  assert.match(evals, /Scheduled partial failure/);
});
