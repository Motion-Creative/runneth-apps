# Knoweth V2 setup for Meta and VoC onboarding

## Purpose

This package uses one small retrieval taxonomy:

- `global` for knowledge that applies across the VM;
- `project:<workspaceId>` for knowledge about one Motion workspace; and
- `user:<vmUserId>` for one verified person's knowledge.

The folders remain the human-readable organization. V2 roots, assignments, and grants
make those folders retrievable by the right person in the right workspace.

## The complete taxonomy

| V2 lane | Human meaning | Files owned by it | Request identity that unlocks it |
| --- | --- | --- | --- |
| `global` | Applies across the VM | Installed package instructions and genuinely cross-workspace guidance | Every request |
| `project:<workspaceId>` | Applies to one Motion workspace | Everything generated under `/agent/brain/<workspace>/` | The active Motion `workspaceId` |
| `user:<vmUserId>` | Applies to one verified person | Everything under `/agent/brain/team/<handle>/` | Teameth's current `vmUserId` |

These are the only lane types this package uses. Meta, VoC, platform, product, campaign,
brand, process, and initiative are folders or searchable terms, not lanes. In this
standard, `project` always means the exact Motion workspace ID. It is never an invented
campaign or workstream ID.

Harneth already requests these three layers on a normal turn:

```text
user:<current-vmUserId> + project:<active-workspaceId> + global
```

Knoweth checks the request identities against V2 grants before it searches. Authorized
chunks from all three lanes are then searched and ranked together; this is not a
global-first or user-first sequence.

## Exactly what is configured per VM

| Configuration | Value | Where it comes from |
| --- | --- | --- |
| Brain root | Reuse the existing `/agent/brain` root with default lane `global` | Existing V2 config |
| Workspace assignment | `<workspace>/** -> project:<workspaceId>` | Workspace slug and exact ID from Motion context |
| Workspace grant | Active `workspaceId` may read its project lane and `global` | Exact Motion workspace ID |
| Person assignment | `team/<handle>/** -> user:<vmUserId>` | Verified Teameth identity plus a human-readable handle |
| Person grant | That `vmUserId` may read its user lane and `global` | Stable Teameth `vmUserId` |

That is the complete package taxonomy. Search modes, ranking profiles, tags, platforms,
brands, products, and campaigns are not configured as ownership boundaries here. V2
combines every matching grant, so a verified person in an active workspace can retrieve
their user lane, that workspace's project lane, and global guidance in one search.

## What this package installs and generates

### Global package knowledge

The installed package files remain global because they teach Runneth how to perform
onboarding for any workspace:

```text
/agent/brain/meta-and-voc-onboarding/**       -> global
/agent/brain/runneth.md                       -> global, when a person registry exists
/agent/.agents/skills/voc-data-pull/**        -> capability, not Brain knowledge
/agent/.agents/skills/voc-audit/**            -> capability, not Brain knowledge
/agent/.agents/skills/meta-ad-performance-analysis/**
/agent/.agents/skills/onboarding-walkthrough/**
/agent/.agents/skills/dashboard-design/**
```

Skill folders are activated as capabilities. They are not assigned business lanes by
this package. `/agent/brain/runneth.md` is a concise resolver from verified display
names, aliases, and `vmUserId` values to canonical person homes. It contains no personal
preferences. `/agent/user.md` remains the VM-wide instruction file used by the current
runtime; despite its name, it is not one person's profile or user lane.

### One onboarded workspace

Every persistent Brain file this package creates for a workspace belongs to that
workspace's project lane:

```text
/agent/brain/<workspace>/                     -> project:<workspaceId>
  _tag-vocabulary.md
  _changelog.md
  data-sources/
    meta/
      account-context.md
      naming-decoder.json
      validation.md
      _changelog.md
    voc/
      voice-of-customer-audit.md
      <platform>/
        <raw-item-files>
      <platform>-context.md
```

Only useful files are created. The package does not create empty platform folders,
placeholder audits, or placeholder validation files. The later skill or workflow creates
each optional file when its evidence and human gate are ready.

Cacheth is separate from this Brain assignment. Its current workspace roots are already
project-scoped by the runtime. Meta performance remains a live Motion CLI read and is not
saved to the Brain.

### A person who joins later

Each verified person receives one home when they first use the VM or an administrator adds
them with a confirmed `vmUserId`:

```text
/agent/brain/team/<handle>/                    -> user:<vmUserId>
  user.md
  <supporting-personal-files>
```

The whole person home has one owner and one lane. `user.md` contains only durable personal
defaults: communication style, working preferences, display preferences, recurring
personal defaults, and cross-workspace context. Shared role definitions and workspace
facts do not belong there.

The initial file stays small:

```markdown
# <Display name>

VM user ID: `<vmUserId>`

## Personal defaults

No personal defaults have been confirmed yet.
```

Add a preference only after that person states or confirms it. Supporting files are added
only when they contain real personal context; onboarding does not seed empty subfolders.

## The V2 configuration shape

The clean setup uses one existing Brain root. Its default is global; assignments override
that default for workspace and person paths.

```toml
[[roots]]
id = "<existing-brain-root-id>"
lane_id = "global"
path = "/agent/brain"
kind = "brain"

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/**"
lane_id = "project:<workspaceId>"

[[policy.lane_grants]]
id = "workspace-<workspaceId>"
project_id = "<workspaceId>"
read = ["project:<workspaceId>", "global"]
```

For each verified person:

```toml
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "team/<handle>/**"
lane_id = "user:<vmUserId>"

[[policy.lane_grants]]
id = "person-<vmUserId>"
user_id = "<vmUserId>"
read = ["user:<vmUserId>", "global"]
write = "user:<vmUserId>"
```

Assignments are evaluated in config order and the last matching assignment wins. The
workspace and person patterns above do not overlap. Each file is indexed once and stamped
with one lane from this root.

Use the real existing Brain `root_id`. Never guess it and never create another Brain root
for a nested workspace or person folder.

## Current V2 implementation boundary

The package manager can install files into the Brain and skills roots. It cannot edit
daemon-owned Knoweth configuration.

The current V2 `ContextConfig` endpoint can append a new lane root, but it cannot add or
change `lane_assignments`. Creating a second root for `/agent/brain/<workspace>/` or
`/agent/brain/team/<handle>/` would index the same files in both that root and the existing
global Brain root. This package must not use that workaround.

The clean taxonomy therefore needs one trusted runtime operation that can:

1. inspect the existing Brain root ID;
2. upsert the root-relative assignment and matching grant;
3. build a fresh index generation; and
4. report the resulting path, lane, and access checks.

Until that operation is available, the package may seed the folder structure and this
desired map, but it must report the V2 lane assignment as pending. It must not claim that
folder placement alone changed retrieval access.

## Workspace onboarding sequence

1. Resolve the workspace name, `workspaceId`, and folder slug from the conversation's
   Motion context. Never infer them from old folders or previous conversations.
2. Run the package's Meta and VoC setup. Persist only useful files under the workspace
   folder shown above.
3. Inspect the full V2 Knoweth config and identify the existing Brain root.
4. Upsert `<workspace>/** -> project:<workspaceId>` and the matching project grant.
5. Reindex once after the assignment is durable.
6. Verify retrieval as that workspace and from a different workspace before marking the
   Knoweth setup complete.

Onboarding another workspace repeats these steps with a different folder slug and exact
workspace ID. It never edits the first workspace's files or assignment.

Scheduled routines do not have an active workspace identity. This package pins the exact
workspace ID and output path in each routine, so routine writes still land under the right
project-owned folder. A routine that later performs a semantic Knoweth search must receive
that verified workspace ID explicitly; it cannot infer project access from its turn.

## New-person sequence

Run this when Teameth first verifies a person on the VM, or when an administrator adds a
person with a confirmed `vmUserId`:

1. Resolve the stable `vmUserId`, display name, aliases, and one collision-safe folder
   handle. The verified ID is the authority; the handle is for people browsing files.
2. Create or update global `/agent/brain/runneth.md` with that identity and the canonical
   `/agent/brain/team/<handle>/` home. Never put preferences in the resolver.
3. Create `/agent/brain/team/<handle>/user.md` without moving or combining another person's
   files.
4. Upsert `team/<handle>/** -> user:<vmUserId>` beneath the existing Brain root.
5. Add the matching user grant. Do not grant this lane to another user.
6. Reindex and run the user-isolation tests below.
7. Add future personal files inside the same home so they inherit the assignment. A move
   outside that home changes ownership and requires review.

A user lane protects Knoweth retrieval. It does not by itself make the underlying
filesystem private; filesystem permissions are a separate capability.

## Save routing after setup

| New information | Canonical home | V2 lane |
| --- | --- | --- |
| Package procedure or cross-workspace rule | `/agent/brain/meta-and-voc-onboarding/` or another shared home | `global` |
| Person identity and canonical-home pointer | `/agent/brain/runneth.md` | `global` |
| Meta account interpretation | `/agent/brain/<workspace>/data-sources/meta/` | `project:<workspaceId>` |
| Raw or compiled VoC | `/agent/brain/<workspace>/data-sources/voc/` | `project:<workspaceId>` |
| Personal recurring default | `/agent/brain/team/<handle>/` | `user:<vmUserId>` |
| One-off conversation detail | Do not persist | none |
| Current creative facts | Cacheth | existing runtime project scope |
| Current performance | Motion CLI | not persisted |

Folders describe ownership to people. Lanes enforce retrieval access. Tags, naming terms,
and file content improve findability inside an authorized lane; they are not access
boundaries.

When a human moves a workspace or person file, preserve the file and update references.
Then evaluate its new root-relative path, update the assignment only when ownership changed,
and reindex. Never solve a move by adding another overlapping root.

## Required verification

### Workspace isolation

- In workspace A, a question about its account context returns workspace A files plus global
  package guidance.
- In workspace B, the same question returns workspace B files and no workspace A files.
- A request with no workspace identity cannot retrieve either project lane through Knoweth.

### Person isolation

- As Alice, exact and paraphrased searches can retrieve Alice's `user.md` and supporting
  files.
- As Bob, Alice's lane is denied and no Alice personal result appears.
- Alice and Bob can both retrieve global package guidance and the active workspace's
  authorized project knowledge.

### Index ownership

- Every package-generated Brain file has exactly one root and one lane.
- No workspace or person path remains indexed in both `global` and a restricted lane.
- The index generation completed after the assignment change and stale global chunks were
  removed.

## V3 translation later

V3 replaces manually authored roots, assignments, and grants with sources and audiences.
The human folder taxonomy does not change:

- the shared package source remains global;
- each workspace folder becomes one project-audience source; and
- each person home becomes one user-audience source.

The broad Brain source must exclude the narrower workspace and person paths so one file
still has one indexing owner. V3 is a later migration; this package targets V2 today.
