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
    '{"schemaVersion":1,"rights":[]}',
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

const behavioralContracts = [
  {
    name: "install remains inactive",
    file: "instructions/behavior.md",
    required: [
      /Installation leaves Creator Intel inactive/,
      /Do not create `\/agent\/brain\/creator-intel\/workspaces/,
      /Do not create a routine during install/,
    ],
  },
  {
    name: "setup remains progressive and idempotent",
    file: "skills/setup-creator-intelligence/SKILL.md",
    required: [
      /Ask one setup question at a time/,
      /Setup is idempotent/,
      /never pulls creator data/,
      /Write or update `workspace\.json` last/,
      /workspace_setup/,
    ],
  },
  {
    name: "recognition writes pending proposals and an audit event",
    file: "skills/recognize-creators/SKILL.md",
    required: [
      /pending-review\.json\.items\[\]/,
      /identity_proposals_created/,
      /before showing the review bundle/,
    ],
  },
  {
    name: "human review changes only named candidates",
    file: "skills/review-creator-identities/SKILL.md",
    required: [
      /Silence changes nothing/,
      /Partial answers affect only the named candidates/,
      /append one canonical event for each decision type/,
    ],
  },
  {
    name: "standalone casting persists a linkable recommendation",
    file: "skills/suggest-creators/SKILL.md",
    required: [
      /recommendations\.json\.recommendations\[\]/,
      /recommendation_created/,
      /Include the same `recommendationId` in the visible recommendation/,
      /pure creator-performance lookup.*do not create a recommendation record/,
    ],
  },
  {
    name: "combined brief and casting persists the same visible id",
    file: "skills/brief-and-cast/SKILL.md",
    required: [
      /recommendations\.json\.recommendations\[\]/,
      /recommendation_created/,
      /include the same recommendation id in the visible brief/,
    ],
  },
  {
    name: "refresh records partial source failures without mutating trust",
    file: "skills/refresh-creator-corpus/SKILL.md",
    required: [
      /must never silently create or change trusted identities/,
      /one canonical append-only audit event per source attempt/,
      /If one source fails, record the failure on that source only/,
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

  assert.ok(numberedCases.length >= 42);
  assert.match(evals, /Recommendation outcome guard/);
  assert.match(evals, /Scheduled partial failure/);
  assert.match(evals, /One-question progressive setup/);
});
