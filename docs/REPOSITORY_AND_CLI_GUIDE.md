# Runneth Apps Repository and CLI Guide

This is the durable engineering map for `Motion-Creative/runneth-apps`. Use it when
adding packages, changing the public use-case library, building sandbox apps, or
writing skills that invoke Runneth platform commands.

The repository contains many command examples but does not implement most of the
Runneth platform CLI. This guide separates:

- **Implemented here**: code and parsers in this repository.
- **External, consumed here**: Runneth/Motion commands invoked by skills and workflows.
- **Documentary or conflicted**: examples whose current platform contract cannot be
  established from this repository alone.

Generic shell, Git, package-manager, and media utility commands are summarized rather
than listing every incidental invocation.

## Repository map

The repository has two independent distribution systems.

### Runneth package manager

| Surface | Location | Role |
|---|---|---|
| Registry | `package-index.json` | Advertises installable packages and sync policy |
| Package source | selected by `source.path` | Installer manifests and package resources; current examples use `packages/<id>/` |
| Validator | `scripts/validate-runneth-package-index.mjs` | Enforces the checked-in package contract |
| CI | `.github/workflows/validate-catalog.yml` | Runs package validation on PRs and `main` |

The checked-out cumulative feature branch contains three package candidates:

1. `context-kit`: brand knowledge, a board app, and an agent-mode refresh skill.
2. `ad-naming`: naming decoder, KPI map, query contract, and agent-mode refresh.
3. `creative-corpus`: durable full-ID per-creative files and agent-mode daily refresh.

At the time this guide was written, `origin/main` still had an empty package index and
none of these package directories. They are not released through the main registry
until their stacked PRs merge in order: Context Kit #150, Ad Naming #156, then Creative
Corpus #157. Always inspect `origin/main`, not only the working tree, when deciding
whether a package is released.

Install order is documented behavior, not a schema-level dependency:

```text
Context Kit -> Ad Naming -> Creative Corpus
```

### Public use-case library (legacy contract, active surface)

| Surface | Location | Role |
|---|---|---|
| Ordered catalog | `.use-case-library/catalog.json` | Controls which use cases are public |
| Categories | `.use-case-library/categories.json` | Controls public site tabs |
| Use cases | top-level or `landing-page-bundle/<slug>/` | Skills, metadata, and sandbox app source |
| Validator | `scripts/validate-catalog.mjs` | Enforces the catalog contract |
| Site | `use-case-library-site/` | React/Vite frontend and Fastify server |

The package validator deliberately ignores use-case directories unless the package
index references them. The package registry and public use-case catalog are not
interchangeable. The catalog currently publishes 10 cards and deliberately retains
24 additional excluded cards with reasons. Most standalone sandbox app roots are
excluded, not public.

For a public card:

- `use-case.json` owns card metadata, category, and status;
- `marketing.md` owns customer-facing copy;
- `README.md` owns the “How it is built” content;
- `install-config.json` optionally owns installation steps and customization tokens;
- `SKILL.md` contains skill behavior when applicable.

Status is read only from `use-case.json`. The catalog validator applies stricter
requirements to shown cards than excluded cards, and validates install-config version
and changelog structure globally. Post-install intros are specified in
`.use-case-library/post-install-intro-spec.md` but are not fully CI-enforced.

### Other significant areas

- `corpus-search/`: the repository's most complete locally implemented CLI.
- `building-integrations/`: integration-generation guidance and templates.
- `brain-onboard/`, `runneth-classic/`, `paid-strategy-audit/`: broad examples of
  Motion CLI consumption.
- App roots such as `conversation-manager/`, `brief-qa/`, `video-qa/`,
  `file-explorer/`, and `creative-qa/`: independent frontend/server projects.
- `scripts/`: zero-dependency repository validators.

There is no root npm or pnpm workspace. The public site is a pnpm workspace; most
other apps have independent manifests and lockfiles.

The public site reads catalog content from GitHub with an approximately 60-second
cache. Its server also persists reviews and brain submissions in SQLite, so production
deployments require durable mounted storage; it is not only a stateless catalog proxy.
See `use-case-library-site/server/src/github.ts`,
`use-case-library-site/server/src/db.ts`, and
`use-case-library-site/server/src/brain-submissions-db.ts`.

## Package contract

### Transitional three-file contract

A package currently participates in three contracts:

1. `package-index.json`: registry metadata and source location.
2. `packages/<id>/package.json`: read by the VM installer.
3. `packages/<id>/runneth-package.json`: read by the checked-in repository validator.

The Context Kit README documents this temporary split explicitly. Runtime
`package.json` is canonical for installation; `runneth-package.json` is a compatibility
copy for the current CI validator. Keep shared metadata and resource lists semantically
aligned, but do not make the files byte-identical:

- Runtime `package.json` currently includes `installPolicy`.
- The checked-in validator rejects `installPolicy` in `runneth-package.json`.

Treat `scripts/validate-runneth-package-index.mjs` as the authority for current CI
and the runtime installer response as the authority for installation behavior.
This is transitional, not a permanent recommendation.

### Checked-in validator index requirements

`package-index.json` has exactly these top-level keys:

```json
{
  "schemaVersion": 1,
  "indexRevision": "non-empty-string",
  "packages": []
}
```

Each entry has exactly:

```json
{
  "id": "package-id",
  "name": "Package Name",
  "description": "Exact manifest description.",
  "version": "1.2.3",
  "categories": ["non-empty"],
  "packageManagerVersion": 1,
  "source": {
    "type": "github",
    "owner": "Motion-Creative",
    "repo": "runneth-apps",
    "ref": "main",
    "path": "packages/package-id"
  },
  "updatePolicy": "manual",
  "uninstallPolicy": "allowed"
}
```

Important checked-in constraints:

- `version` is strict numeric `X.Y.Z`.
- `categories` must be a non-empty array of non-empty strings.
- `indexRevision` only needs to be non-empty; revision bumps are conventional.
- Package IDs and resource IDs must be unique.
- The ID regex is `[a-z0-9][a-z0-9-]*`; despite the validator's “kebab-case”
  message, consecutive and trailing hyphens currently pass.
- `updatePolicy` is `auto` or `manual`; `uninstallPolicy` is `allowed` or `protected`.
- Empty package and resource arrays are accepted.
- Categories are not checked against the public catalog taxonomy and may duplicate.
- Source type must be `github`.
- Owner, repository, and ref must be exactly `Motion-Creative`, `runneth-apps`,
  and `main`.
- Index and validator manifest must match on ID, name, description, version,
  update policy, and uninstall policy.
- Objects use strict key sets; unsupported extra keys fail validation.

Registry source refs remain `main` even while testing a package from a feature branch.
The validator resolves manifests from the local checkout; it does not verify that
`source.ref: main` currently contains the path.

The checked-in validator rejects `installPolicy` in index entries, while newer
managed-sync behavior has required it in runtime-facing metadata. The current branch
cannot express one index entry that proves both contracts. Direct branch installation,
when supported by the live package CLI, reads runtime `package.json` and bypasses this
index conflict.

### Current validator manifest

`runneth-package.json` has exactly:

```json
{
  "schemaVersion": 1,
  "id": "package-id",
  "name": "Package Name",
  "description": "Exact index description.",
  "version": "1.2.3",
  "updatePolicy": "manual",
  "uninstallPolicy": "allowed",
  "resources": []
}
```

Allowed resource types:

| Type | Required fields | Meaning |
|---|---|---|
| `package_instruction` | `id`, `type`, `sourcePath` | Installs package-owned prompt instructions |
| `file` | `id`, `type`, `sourcePath`, `target`, `executable` | Installs one file |
| `directory` | `id`, `type`, `sourcePath`, `target`, `executablePaths` | Recursively installs a directory |

Allowed target roots:

- `agent_apps`
- `agent_brain`
- `agent_skills`
- `agent_tools`

Current package layout conventions:

- `instructions/behavior.md` is declared as `package_instruction`;
- `skills/` is installed as an `agent_skills` directory;
- files under `brain/` are mapped explicitly into `agent_brain`;
- app source under `apps/<id>/` is installed as an `agent_apps` directory;
- when a v1 package intentionally ships a workflow or script, it is an ordinary file
  resource staged into a target path; the current three-package series avoids
  workflow/script Motion execution because of broker scoping.

Declared resource source paths must be relative, exist, have the declared file kind,
and contain no symlink segment. `..`, leading `/`, and `//` are rejected. The validator
does not verify target existence, target writability, or target collisions.

`executable: true` and `executablePaths` are installer metadata. The source file does
not need Git executable mode. Installer chmod behavior is external and is not verified
by this repository.

### What package installation does not do

Current package instructions treat installation as staging declared resources. They
do not rely on installation to:

- build apps;
- push or register workflows;
- create tasks or routines;
- install arbitrary dependencies;
- run setup interviews;
- enforce package dependency order.

Only the “sync does not build apps” behavior is explicitly documented by the package
README. Confirm broader installer behavior against the live platform before making it
a new contract.

Activation belongs in the installed skill and package instructions. In the current
package series:

- Context Kit builds its app; build and refresh Motion calls run directly in agent turns.
- Ad Naming builds and refreshes directly in agent turns.
- Creative Corpus builds directly in the requesting agent turn, then creates an
  agent-mode refresh routine.

### Fleet approval

The current validator treats `updatePolicy: "auto"` as auto-installable and requires
the `runneth-fleet-change-approved` PR label for:

- a new auto package;
- a manual-to-auto transition;
- any fingerprint change while the base package is auto, including auto-to-manual;
- removal of an auto package.

The fingerprint contains categories, source, uninstall policy, update policy, and
version. It excludes name, description, package-manager version, index revision,
resources, and package content. The checked-in gate does not understand runtime
`installPolicy`.

All three current packages are manual, so this gate is inactive for them.

There is a known push-event defect: on a push to `main`, PR base and label context are
absent, so the current validator can treat every auto package as newly auto and cannot
observe the approval label. Adding the label also does not normally trigger the default
PR workflow by itself; rerun CI or push a new commit.

### Package validation

Run:

```bash
node --test scripts/validate-runneth-package-index.mjs
```

Also verify shared runtime and validator fields, ignoring only runtime-only
`installPolicy`:

```bash
node - <<'NODE'
const fs = require("node:fs");

for (const id of ["context-kit", "ad-naming", "creative-corpus"]) {
  const runtime = JSON.parse(fs.readFileSync(`packages/${id}/package.json`));
  const validator = JSON.parse(fs.readFileSync(`packages/${id}/runneth-package.json`));

  for (const key of [
    "schemaVersion",
    "id",
    "name",
    "description",
    "version",
    "updatePolicy",
    "uninstallPolicy",
    "resources",
  ]) {
    if (JSON.stringify(runtime[key]) !== JSON.stringify(validator[key])) {
      throw new Error(`${id}: ${key} differs`);
    }
  }
}
NODE
```

The repository validator does not compile workflow TypeScript, build packaged apps,
test installation, validate target collisions, or enforce version bumps.

### Release model

There is no package publish, archive, tag, or immutable-release CI job. Release
effectively occurs when package files and their index entry reach `main`; current index
sources are mutable `main` references.

The current rollout is stacked:

```text
Context Kit PR #150 -> Ad Naming PR #156 -> Creative Corpus PR #157
```

A successful direct feature-branch install proves runtime manifest and resource
behavior only. It does not prove registry ingestion, managed sync, fleet behavior, or
availability through the configured main ref. After merge, test `main` and package
discovery separately.

## CLI authority model

Use this order when command examples disagree:

1. A local parser or executable implementation.
2. Current platform `--help` output on a VM.
3. Current package skills and instructions.
4. Older use-case skills and README examples.

The repository implements validators, `corpus-search`, and several standalone scripts.
`package`, `motion`, `app`, `workflow`, `task`, `routine`, `conversation`, `reminder`,
`slack`, and `integrations` are external platform commands.

Primary command evidence:

| Family | Strongest repository evidence |
|---|---|
| Package schema | `scripts/validate-runneth-package-index.mjs` |
| Package runtime behavior | package READMEs/skills plus live install results; no local installer |
| Current Motion package calls | `packages/*/skills/` and runtime feedback |
| Broader/older Motion calls | `brain-onboard/`, `runneth-classic/`, `paid-strategy-audit/`, `competitor-intel/` |
| App lifecycle | app README files and package skills; no local app CLI parser |
| Workflow/task/routine | `packages/*/skills/SKILL.md`; external platform CLIs |
| Slack/integrations | onboarding, health-alert, competitor, and permissions skills |
| Corpus Search | `corpus-search/bin/corpus_search_cli.py` |
| Standalone Python/shell tools | each script's parser, usage string, or source |

## Repository and build commands

### Local CI checks

```bash
node --test scripts/validate-catalog.mjs
node --test scripts/validate-runneth-package-index.mjs

cd use-case-library-site
pnpm install --frozen-lockfile
pnpm build
```

The GitHub workflow uses Node 20 and pnpm 9.
Package validation checks out full history so it can compare the base index. A normal
local run lacks `GITHUB_BASE_REF`, the PR event payload, and labels, so it does not
exercise fleet approval exactly as CI does. The site build covers only
`use-case-library-site`; it does not build the packaged Context Kit app.

### Public site

From `use-case-library-site/`:

```bash
pnpm install:all
pnpm build
pnpm start
pnpm dev:server
pnpm dev:frontend
PORT=8080 pnpm start
```

Read `use-case-library-site/package.json` and its README before assuming these scripts
apply to another app.

### Context Kit app source

`packages/context-kit/apps/context-kit/` is an Astro project. Its local npm scripts
compile only the source project; the external `app` CLI performs VM registration and
deployment.

## External `package` CLI

No package CLI implementation or complete command schema lives in this repository.
Package PRs have used the following direct-install form, but it is external evidence,
not a locally implemented or parsed contract. Confirm it with live package help:

```bash
package install "github:Motion-Creative/runneth-apps/packages/<id>#<ref>"
```

One exact PR example is:

```bash
package install \
  "github:Motion-Creative/runneth-apps/packages/context-kit#context-kit-package"
```

When supported, direct installation reads runtime `package.json`; it does not test
`package-index.json`, `runneth-package.json`, fleet approval, managed sync, or whether
the configured registry `main` ref contains the package. After merge, separately test
the main ref and registry/managed-sync path.

Do not invent `package list`, `package uninstall`, or package-sync syntax from this
repository; confirm those with platform help.

## External `motion` CLI

Current package skills treat the Motion data commands they invoke as returning an
envelope on stdout:

```bash
ENVELOPE=$(motion ...)
FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
jq '...' "$FILE"
```

For those calls, do not assume the envelope itself is the data payload. This is not a
universal Motion rule: `motion analyze-media` consumers parse stdout directly.

### Workspace and account context

```bash
motion workspaces
motion workspace-goal
motion spend-threshold
motion reports
motion ai-glossary
motion creative-trends
motion benchmark-compare
motion cache search-summaries
```

Observed brand-context queries:

```bash
motion brand-context --data-query "summary"
motion brand-context --data-query brand_identity
motion brand-context --data-query "strategy positioning customer audience product"
motion brand-context --data-query \
  "brand foundations, fundamentals, product information, competitors, customer voice analysis"
```

### Meta creative and performance data

Common current forms:

```bash
motion meta insights \
  --date-range last_7d \
  --sort topSpend \
  --include-metrics \
  --limit 500

motion meta insights \
  --date-range last_30d \
  --sort topSpend \
  --include-metrics \
  --limit 500

motion meta insights \
  --start-date "$START" \
  --end-date "$END" \
  --sort topSpend \
  --include-metrics \
  --limit 500

motion meta insights \
  --scope creative-asset-id \
  --creative-asset-id <id> \
  --date-range last_365d \
  --include-metrics \
  --glossary-category intended-audience \
  --glossary-category messaging-angle \
  --glossary-category hook-tactic \
  --glossary-category visual-format \
  --glossary-category asset-type \
  --glossary-category offer-type \
  --glossary-category seasonality \
  --summary-sections hookOrHeadline \
  --summary-sections creativeBreakdown \
  --summary-sections messagingAndPositioning \
  --summary-sections emotionalAndAudienceInsight \
  --summary-sections adDescription

motion meta insights \
  --date-range last_30d \
  --sort topSpend \
  --limit 100 \
  --glossary-category intended-audience \
  --glossary-category messaging-angle \
  --glossary-category hook-tactic

motion meta insights \
  --date-range last_30d \
  --sort topSpend \
  --limit 1 \
  --table-kpi thumbstop_rate
```

Creative Corpus repeats `--creative-asset-id` for batches of at most 15 IDs. The
current CLI rejects `--include-glossary`, and its fast path blocks
`--include-transcript`; use the repeated category and section flags above.

Naming and conversion discovery:

```bash
motion meta ads \
  --grain adnames \
  --date-range last_90d \
  --sort-by spend \
  --sort-direction desc \
  --limit 200

motion meta custom-conversion-metrics
motion meta metric-reference --query "appointments scheduled"
motion meta age-gender
```

Workspace-specific performance examples also use:

```bash
motion meta insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort topSpend \
  --include-metrics \
  --group-by creative \
  --chart-kpi "<event-id>_count" \
  --chart-kpi "<event-id>_cost"
```

Other observed flags include `--group-by name`, `--include-northbeam`,
`--click-attribution-window`, and `--view-attribution-window`.

### TikTok

```bash
motion tiktok insights --date-range last_30d --include-metrics
motion tiktok insights --grain ads

motion tiktok insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 1000 \
  --sort-by spend \
  --sort-direction desc \
  --grain ads \
  --include-metrics
```

### Competitor and inspiration data

```bash
motion search-brands --search-term "<name-or-domain>" --limit 5 --with-brand-context
motion search-brands --search-term "<workspace-name>" --limit 5

motion inspo-creatives \
  --brand-id <id> \
  --status active \
  --sort newestLaunchDate \
  --limit 150

motion inspo-creatives \
  --brand-id <id> \
  --status active \
  --sort oldestLaunchDate \
  --limit 150

motion inspo-creatives \
  --brand-id <id> \
  --status inactive \
  --sort newestLaunchDate \
  --limit 150

motion inspo-creatives --brand-id <id> --include-glossary --limit 50
motion inspo-context --brand-id <id>
motion meta competitor-ad-insights \
  --ad-library-creative-id <id> \
  --include-glossary \
  --with-summary
```

### Older or generic Motion forms

Older use cases contain forms such as:

```bash
motion creative-insights \
  --workspace-id <workspace-id> \
  --date-range last_30d \
  --limit 150 \
  --sort topSpend \
  --summary-sections adDescription \
  --summary-sections hookOrHeadline \
  --include-metrics

# Documentary partial form; confirm section names and required IDs with live help.
motion creative-insights \
  --scope creative-asset-id \
  --summary-sections <section>

motion custom-conversion-metrics
motion age-gender-breakdown
motion analyze-media --filename <filename> --prompt <prompt>
```

Do not automatically substitute these for the current namespaced Meta/TikTok commands.
Command naming has drifted, so check live help when maintaining legacy skills.

## External `app` CLI

Observed forms:

```bash
app create <name>
app create <name> --route <route>
app build <name>
app verify <name>
app list
```

For a newly created app, examples require:

1. Run `app create <name>` or the route form.
2. Populate its source and `buildeth.app.json`.
3. Run `app build <name>`.
4. Run `app verify <name>`.
5. Run `app list` to obtain the route/URL.

Package-staged apps such as Context Kit already include source/config templates and
start from runtime placeholder replacement plus `app build`.

`app remove` is mentioned in prose but no complete syntax is established here.

## External workflow, task, and routine CLIs

### Workflow registration

The external platform exposes forms such as:

```bash
workflow push <workflow-file.ts> --name <workflow-name>
```

### Workflow-backed tasks

```bash
task add --kind workflow --workflow-id <id> --name "<task-name>"
task run --id <task-id>
task wait --run <run-id>
```

Do not call trusted Motion tools from `task.bash`: task-scoped broker tokens cannot
access them. The current package series therefore performs Motion work directly in
agent turns and does not ship workflow-backed Motion tasks.

No task-listing syntax is established by the checked-in package skills. Confirm it
with platform help before making it part of a package contract.

### Routines

Current package examples:

```bash
routine list

routine add \
  --name "Creative corpus daily refresh" \
  --cron "0 5 * * *" \
  --delivery "Update corpus state only — no conversation needed unless new creatives are indexed or errors occur." \
  --prompt "Start an agent turn, read the installed creative-corpus skill, and run its refresh procedure directly with trusted Motion tools."
```

Weekly agent-mode refresh examples use:

```bash
routine add \
  --name "<name>" \
  --cron "0 9 * * 1" \
  --delivery "<delivery behavior>" \
  --prompt "<start an agent turn, read the installed skill, refresh directly, summarize>"
```

Routine prompt prose contains this conversation-delivery form:

```bash
conversation send --new
```

It is not independently corroborated by an implementation or standalone invocation.
Verify it with live help.

The Creative Corpus playbook mentions resuming a paused routine but gives no verified
`routine resume` syntax.

## ContextConfig and Knoweth

These are described as tool/API operations, not shell commands.

Current packages register:

- `context-kit-core`, `context-kit-brand`, and `context-kit-performance` lanes;
- an `ad-naming` lane for the decoder, KPI map, and query contract;
- a `creative-corpus` directory lane for per-creative files.

Creative Corpus explicitly asks for ContextConfig action `update`; the other packages
say “register” without a complete schema. No ContextConfig implementation or Knoweth
CLI is present in this repository. Use the live tool schema, not invented shell syntax.

## External Slack and integration CLIs

Observed forms:

```bash
integrations list

slack doctor
slack memberships list
slack search channels <channel-name>

slack send --channel <channel-id> --text "<text>"
slack send --channel <channel-id> --thread <thread-ts> --text "<text>"
slack send --conversation <channel> --text "<text>"

google doctor
notion doctor
```

These appear in onboarding, health alerts, competitor intelligence, permissions, and
update workflows. The thread form repairs a malformed checked-in example and remains
unverified until confirmed with live Slack CLI help.

## Legacy `reminder` CLI

The repository does not implement reminders and contains incompatible command shapes.
Only these read forms have argument syntax:

```bash
reminder list
reminder get <short-id>
```

`reminder delete` and `reminder complete` are mentioned only as command names; their
arguments are unknown.

Competing creation examples include:

```bash
reminder add \
  --name "<name>" \
  --cron "<cron>" \
  --timezone "<timezone>" \
  --content "<content>"
```

```bash
reminder add \
  --title "<title>" \
  --description "<description>" \
  --schedule "<natural-language schedule>"
```

Other files substitute `--body`, or use `--recurrence`, `--message`, and
`--conversation-id`. `reminder update` is explicitly described as unavailable.

Treat all reminder creation syntax as legacy until verified on a current VM. New package
work uses routines.

## Locally implemented `corpus-search` CLI

Implementation:

- Wrapper: `corpus-search/corpus-search.sh`
- Parser: `corpus-search/bin/corpus_search_cli.py`

First-time installation:

```bash
bash /agent/tools/corpus-search/install.sh
```

Invocation after installation:

```bash
bash /agent/tools/corpus-search/corpus-search.sh <command>
```

Exact parser surface:

```text
corpus-search init
corpus-search status
corpus-search check-endpoint

corpus-search index markdown
  --source <directory>
  --kind <free-form-tag>
  [--tenant <tenant>]
  [--pattern <glob>]
  [--limit <integer>]
  [--quiet]

corpus-search embed
  [--model <model>]
  [--dim <integer>]
  [--batch-size <integer>]
  [--max-chunks <integer>]
  [--quiet]

corpus-search query <query>
  [--top <integer>]
  [--kind <kind>]
  [--role <role>]
  [--workspace <workspace>]
  [--user <user>]
  [--since <ISO-date>]
  [--until <ISO-date>]
  [--pool <integer>]
  [--no-vector]
  [--rerank | --no-rerank]
  [--rerank-pool <integer>]
  [--format human|json]

corpus-search refresh [--no-embed] [--quiet]
corpus-search demo [--queries <query> ...]
```

Known documentation defects:

- `runneth-classic/SKILL.md` uses unsupported `search --query`; the parser uses
  `query <query>`.
- `corpus-search/README.md` shows unsupported `--brand`; remove it or add parser
  support. Use `--workspace` only when the indexed workspace field intentionally
  represents the desired scope.
- The README and example config disagree on the default embedding batch size; parser and
  loaded config behavior are authoritative.
- `corpus-search/lib/rerank.py` says reranking is off by default, while current parser
  and example config behavior make it on by default.

## Other locally implemented entrypoints

### Import from AI

```bash
python3 import-from-ai/lib/parse.py \
  --input <file-zip-or-directory> \
  --output <manifest.json> \
  --user-handle <handle> \
  --home-base <directory> \
  --provider chatgpt|claude|gemini \
  --import-id <id>

python3 import-from-ai/lib/render-review.py \
  --manifest <manifest.json> \
  --output <review.html> \
  [--design-system <design-system.json>]
```

### Review processor

```bash
python3 review-library/scripts/process_reviews.py \
  --config <config.json> \
  [--cache-output <path>]
```

### Video asset pipeline

```text
python3 video-asset-search/scripts/run_pipeline.py
  --drive-url <url> [--folder-name <name>] [--uploads-dir <path>]
python3 video-asset-search/scripts/fetch_drive.py
  <drive-url> [--dest <directory>]
python3 video-asset-search/scripts/process_video.py
  <video-path> [--folder-name <name>] [--uploads-dir <path>]
  [--object-taxonomy <text>]
python3 video-asset-search/scripts/query_shots.py
  <query> [--limit <integer>] [--threshold <float>] [--cut-clips]
python3 video-asset-search/scripts/asset_db.py
python3 video-asset-search/scripts/embed_onnx.py [text]
```

The checked-in video scripts contain installer placeholders such as `{{BRAIN_PATH}}`.
They are templates and are not runnable unchanged from the repository.

### Identity resolvers

```bash
bash /agent/brain/admin/slack-whoami.sh <slack-user-id> [display-name]
bash /agent/brain/admin/motion-whoami.sh [display-name]
```

`team-member-memory` and `add-roles-permissions` contain different generations of these
scripts. Determine which package installed the active resolver before relying on path
or failure semantics.

`import-from-ai/SKILL.md` passes an email positionally to `motion-whoami.sh`, but the
implemented resolver interprets that position as a display name and resolves email
itself. Treat that invocation as stale; it can provision an incorrect handle.

### Migration scripts

```bash
bash competitor-intel/migration-helper.sh
bash team-member-memory/migration-helper.sh
```

## Supporting external utilities

Skills and scripts also consume:

- `secure-fetch run` for authenticated HTTP without exposing secrets;
- `secret env` in current Git examples;
- `secret run` in gated/stale integration examples; current guidance warns that it
  requires platform-controlled command allowlisting;
- `sqlite3` for local corpus storage;
- `ffmpeg` and `ffprobe` for media processing;
- `gdown` for Google Drive downloads;
- `fly launch` and `fly deploy` in deployment guidance;
- `jq`, `rg`, `curl`, Node, Python, pnpm, and standard shell utilities.

These tools are dependencies, not repository-owned CLIs. Read the invoking file and
the tool's live help before copying options into a new package.

## Known cross-repository inconsistencies

Check these before reusing an old example:

1. Package runtime and validator manifests are temporarily split.
2. The package registry and public use-case catalog are independent.
3. Current package instructions assume resource staging and explicitly say app builds
   are separate; broader installer activation behavior requires live confirmation.
4. Package dependency order exists only in prose.
5. Motion command naming has drifted between generic and channel-namespaced forms.
6. `motion inspo brands` has only one repository example.
7. Age/gender guidance conflicts: some skills invoke it while Brain Onboard prohibits it.
8. Reminder creation syntax has four incompatible shapes.
9. ContextConfig registration semantics are incomplete.
10. Corpus Search has stale command examples.
11. Some local scripts are installer templates with unresolved placeholders.
12. CI does not type-check package workflows or build packaged apps.
13. A feature branch can validate locally even while its registry source points to files
    not yet present on `main`.
14. Current sandbox installs can fail when the external package CLI calls `chmod` on
    staged files and receives `EPERM`. This repository does not implement that staging
    operation; manual file copying is a test-only recovery that bypasses atomic install
    behavior and should not be treated as the production fix.

## Package authoring checklist

1. Start from current `origin/main` or explicitly stack dependent package branches.
2. Choose a stable lowercase kebab-case package ID.
3. Create both runtime `package.json` and validator `runneth-package.json`.
4. Keep shared metadata and resource lists aligned.
5. Add a non-empty category and strict `X.Y.Z` version to the index.
6. Keep registry `source.ref` as `main`.
7. Verify every source path and executable declaration.
8. Document activation explicitly; do not assume the installer performs it without
   live platform evidence.
9. Run both repository validators.
10. Validate workflow source using an explicitly documented compiler/runtime check;
    repository CI supplies no workflow tsconfig. A successful VM `workflow push` is
    separate runtime evidence.
11. Test script-mode entrypoints through their test gates when available.
12. Install from the feature branch on a fresh VM.
13. Confirm expected brain, skill, app, workflow, task, and routine artifacts.
14. Review CI and merge dependent PRs in order.

## Fresh-VM test template

The direct-install URI below is PR-observed external behavior, not a parser contract in
this repository. Confirm it against the VM's current package help first. Use one
cumulative ref that contains all three package paths. For the rollout described above,
that ref is `vamsi/creative-corpus-package-16a2`.

```bash
REF="vamsi/creative-corpus-package-16a2"
package install "github:Motion-Creative/runneth-apps/packages/context-kit#$REF"
package install "github:Motion-Creative/runneth-apps/packages/ad-naming#$REF"
package install "github:Motion-Creative/runneth-apps/packages/creative-corpus#$REF"
```

An `installPolicy` backend 400 means the live runtime manifest contract was not
satisfied; repository CI alone cannot detect that failure.

Confirm Motion access:

```bash
motion workspaces
motion meta insights --date-range last_7d --sort topSpend --limit 1
```

Run the package skills in order:

```text
Build my Context Kit
Build my naming decoder
Build my corpus
```

Expected durable files include:

```text
/agent/.agents/skills/context-kit/SKILL.md
/agent/.agents/skills/ad-naming/SKILL.md
/agent/.agents/skills/creative-corpus/SKILL.md
/agent/apps/context-kit/buildeth.app.json
/agent/brain/context-kit/context-kit-state.json
/agent/brain/ad-naming/ad-naming-state.json
/agent/brain/ad-naming/naming-decoder.md
/agent/brain/ad-naming/kpi-map.md
/agent/brain/ad-naming/query-contract.md
/agent/brain/meta/corpus-state.json
/agent/brain/meta/creatives/PLAYBOOK.md
```

Creative files should end in a sanitized full creative asset ID, never an eight-character
prefix. Inspect `corpus-state.json` for `filenameConventionVersion: 2`.

Check the Context Kit app through `app list`, and inspect task/routine state using only
commands confirmed by live platform help. Context Kit and Ad Naming offer weekly
routines; they do not create them automatically. Creative Corpus creates its daily
routine only after the corpus build completes.

If install fails at staging `chmod` with `EPERM`, capture the exact operation/path and
report it to the Runneth platform team. The package source cannot repair the external
installer's filesystem ownership, and manual registration should remain test-only.

After merge, separately repeat installation from `main` and test managed/index
discovery. Feature-branch installation bypasses those release surfaces.

## Maintaining this guide

When command behavior changes:

1. Update the implementation or source skill first.
2. Update this guide from parser code or live `--help`, not memory.
3. Preserve the distinction between implemented, externally consumed, and documentary.
4. Add known conflicts instead of silently choosing one unsupported syntax.
5. Re-run repository validation and link checking.
