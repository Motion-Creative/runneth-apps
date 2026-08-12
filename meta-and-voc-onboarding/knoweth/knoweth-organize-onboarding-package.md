# Knoweth V2 setup for Meta and VoC onboarding

## Goals

- Split the Brain into a few useful retrieval scopes instead of one broad global index.
- Find Meta and customer-voice evidence by both content type and Motion workspace.
- Give each verified person one private lane without exposing personal files through global.
- Keep the setup small enough to repeat for every new workspace and person.
- Preserve the package's current folders and file formats. Do not move, rewrite, or duplicate
  customer files to make retrieval work.
- Leave a direct migration path to V3 sources after V3 lands.

## The simple model

People manage folders and files. Runneth manages the Knoweth configuration underneath them.

This package uses three organizing dimensions:

1. **Workspace:** the Motion workspace that the knowledge describes.
2. **Data source:** Meta interpretation, reviews, or other customer voice inside that workspace.
3. **Person:** durable context that belongs to one verified team member.

Shared package instructions remain `global`. Cacheth keeps its existing
`project:<workspaceId>` records. The package does not ask a user to manage lane IDs, grants,
root IDs, or glob patterns.

## What we are taking from Corpus Search

Corpus Search asks for a source folder, a content `kind`, and an optional file pattern. That
is a useful setup experience because each row answers three questions: where to crawl, what
the corpus is, and which files count.

Knoweth V2 expresses the same intent differently:

| Corpus Search | Knoweth V2 equivalent | Package example |
| --- | --- | --- |
| `source` folder | One existing Brain root plus a root-relative pattern | `<workspace>/data-sources/meta/**` |
| `kind` | A stable lane family plus searchable file content | `meta:<workspaceId>` |
| `pattern` | `lane_assignments.pattern` | `<workspace>/data-sources/voc/**/review-*.md` |
| `workspace` query filter | Workspace ID encoded in the lane ID | `reviews:<workspaceId>` |
| User filter | User lane plus a matching user grant | `user:<vmUserId>` |

Corpus Search can attach typed metadata and query it directly. V2 does not add a typed `kind`
or `external_ids` field to each Brain document. It therefore uses the lane for the coarse
scope, then the existing filename and file content for the precise match. Review files already
carry both `review-<external_id>.md` and `source_type: review`, so no file-format change is
needed.

This package does not install Corpus Search's second SQLite index, embedding job, refresh
reminder, or reranker. Knoweth is the VM retrieval service, watches configured roots, and adds
lane access control. We keep Corpus Search's simple folder, kind, and pattern mental model while
using the platform service that every Runneth surface can share.

## Final V2 taxonomy

Each Brain file has exactly one indexing lane. The workspace ID is included in each shared
workspace lane so Runneth can select a content family for one workspace or the same family
across several workspaces.

| Lane | Owns | Access |
| --- | --- | --- |
| `global` | Installed package guidance and genuinely org-wide knowledge | Shared |
| `project:<workspaceId>` | General files for one workspace and the existing Cacheth project corpus | Shared |
| `meta:<workspaceId>` | Meta interpretation under that workspace | Shared |
| `voc:<workspaceId>` | VoC audit, support, community, ad comments, and other non-review VoC | Shared |
| `reviews:<workspaceId>` | Raw review files for that workspace | Shared |
| `user:<vmUserId>` | One verified person's whole Brain home | Matching user only |

`project:<workspaceId>` keeps the same workspace identity already used by Cacheth. Meta, VoC,
and reviews are separate because those are recurring retrieval scopes. Product, campaign,
platform, persona, process, and initiative stay in folders or file content; they do not become
lanes in this package.

In V2, a project is not a second tag attached to a file. `project:<workspaceId>` is itself a
lane, while `project_id` is a request identity that policy can use for authorization. Because
one file gets one lane, the workspace ID is repeated in `meta:`, `voc:`, and `reviews:` lane
IDs instead of trying to assign the same file to both a family lane and a project lane.

## Package file map

The lane shown on each line is the final V2 owner after all ordered assignments are applied.

```text
/agent/brain/
|-- runneth.md                                       global
|-- meta-and-voc-onboarding/                         global
|   `-- ...package instructions and references
|-- <workspace>/                                    project:<workspaceId>
|   |-- _tag-vocabulary.md                          project:<workspaceId>
|   |-- _changelog.md                               project:<workspaceId>
|   `-- data-sources/
|       |-- meta/                                   meta:<workspaceId>
|       |   |-- account-context.md                  meta:<workspaceId>
|       |   |-- naming-decoder.json                 meta:<workspaceId>
|       |   |-- validation.md                       meta:<workspaceId>
|       |   `-- _changelog.md                       meta:<workspaceId>
|       `-- voc/                                    voc:<workspaceId>
|           |-- voice-of-customer-audit.md          voc:<workspaceId>
|           |-- meta-ad-comments/                   voc:<workspaceId>
|           |   `-- creative-<creativeAssetId>.md   voc:<workspaceId>
|           `-- <platform>/                         voc:<workspaceId>
|               |-- review-<externalId>.md          reviews:<workspaceId>
|               |-- ticket-<externalId>.md          voc:<workspaceId>
|               |-- post-<externalId>.md            voc:<workspaceId>
|               `-- comment-<externalId>.md         voc:<workspaceId>
`-- team/
    `-- <handle>/                                   user:<vmUserId>
        |-- user.md                                 user:<vmUserId>
        `-- ...other files that belong to that person
```

The package does not seed empty person folders. A person home is created only for a verified
team member, and everything inside that home belongs to their user lane. Global `runneth.md`
is the identity-to-home resolver: it records each verified person's stable `vmUserId`, display
name, handle, useful aliases, and canonical home path, but no personal preferences.

## Exact ordered V2 assignments

Reuse the existing `/agent/brain` root. Replace placeholders with the exact root ID,
workspace slug, Motion workspace ID, handle, and Teameth VM user ID. Do not add a nested root
for any of these paths.

```toml
[[roots]]
id = "<existing-brain-root-id>"
lane_id = "global"
path = "/agent/brain"
kind = "brain"

# Broad workspace fallback first.
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/**"
lane_id = "project:<workspaceId>"

# Data-source rules override the broad workspace rule.
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/meta/**"
lane_id = "meta:<workspaceId>"

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/voc/**"
lane_id = "voc:<workspaceId>"

# The most specific rule comes last, so review files leave voc and enter reviews.
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/voc/**/review-*.md"
lane_id = "reviews:<workspaceId>"

# Add once per verified person.
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "team/<handle>/**"
lane_id = "user:<vmUserId>"
```

V2 evaluates assignment rules in configuration order and the last matching rule wins. That is
why a review file is indexed once in `reviews:<workspaceId>`, not once in every matching lane.
Creating separate overlapping roots would index separate copies and is not this model.

## Access policy

All workspace and data-source lanes are shared within the VM. Add them to the VM's shared read
set when each workspace is onboarded. A user lane is added only through a matching user grant.

```toml
[policy]
default_read_lanes = [
  "global",
  "project:<workspaceId>",
  "meta:<workspaceId>",
  "voc:<workspaceId>",
  "reviews:<workspaceId>",
]

[[policy.lane_grants]]
id = "user-<vmUserId>"
user_id = "<vmUserId>"
read = ["user:<vmUserId>"]
write = "user:<vmUserId>"
```

The effective read set is the shared lanes plus every matching grant. A user lane protects
Knoweth retrieval; filesystem permissions are a separate control.

## Retrieval plan

Harneth must request the relevant configured lanes. Knoweth then removes any unauthorized
lanes and searches the authorized set together; it does not search global first and then fall
back to a narrower lane.

| User ask | Lanes to request | Extra query signal |
| --- | --- | --- |
| "What do we know about this workspace?" | `project`, `meta`, `voc`, `reviews`, current `user`, `global` | Workspace name and aliases |
| "Find one-star Bramblewick reviews" | `reviews:<bramblewickWorkspaceId>` | `source_type: review`, rating, product, and user wording |
| "Compare reviews across A and B" | `reviews:<A>`, `reviews:<B>` | Same review and rating terms |
| "How should Meta performance be interpreted?" | `meta:<workspaceId>`, `project:<workspaceId>`, `global` | Account, KPI, campaign, or naming terms |
| "Find Meta ads with cats across A and B" | `project:<A>`, `project:<B>` | Cacheth creative summary and platform terms |
| "What are customers saying?" | `voc:<workspaceId>`, `reviews:<workspaceId>` | Product, problem, persona, and source terms |
| "What are my defaults?" | `user:<vmUserId>` | The person's language |

For Meta performance work, `meta:<workspaceId>` supplies account interpretation while the
existing Cacheth `project:<workspaceId>` corpus supplies current creative summaries. Current
metrics still come from the Motion CLI. The package does not copy Cacheth records or metrics
into Brain files.

## Workspace onboarding

For each newly onboarded workspace:

1. Resolve the exact workspace name and ID from the conversation's Motion context.
2. Create or reuse `/agent/brain/<workspace>/`; never infer it from another workspace.
3. Add the four ordered workspace assignments: project, Meta, VoC, then reviews.
4. Add those shared lanes to the readable set.
5. Reindex once after the complete patch.
6. Verify representative project, Meta, review, and broader VoC queries.
7. Verify that every generated file reports one lane and no stale global copy remains.

If the deployed ContextConfig tool cannot submit arbitrary lanes and ordered assignments,
leave the current global index intact and report `Knoweth V2 map: pending runtime support`.
Do not create nested lane roots as a workaround. The Agent Builder follow-up must expand the
tool and Harneth lane selection before this map is activated on customer VMs.

The Agent Builder follow-up must provide four capabilities as one release:

1. ContextConfig can upsert arbitrary V2 lane IDs and root-relative assignments, including
   `meta:*`, `voc:*`, `reviews:*`, and `user:*`.
2. ContextConfig can update the shared read set and create user-only grants without requiring
   an unrelated project grant.
3. Harneth selects the workspace's project, Meta, VoC, and review lanes from query intent and
   can request the same family for several explicit workspaces.
4. A configuration update completes one bounded reindex and exposes enough status to verify
   that stale global copies are gone before setup is marked complete.

## New team member setup

When Teameth verifies a new person:

1. Use the stable `vmUserId`; never derive identity from a display name.
2. Choose one stable, human-readable handle and one home at
   `/agent/brain/team/<handle>/`.
3. Create `user.md` only when there is verified identity or durable personal context to save.
4. Add or update that person's identity-to-home entry in global `/agent/brain/runneth.md`.
5. Put confirmed communication style, working preferences, app-display preferences, recurring
   personal defaults, role, and canonical-home metadata in that file. Do not copy shared
   workspace facts into it.
6. Assign the whole `team/<handle>/**` path to `user:<vmUserId>` and add the matching user
   grant before saving private content there.
7. Reindex and verify that the matching user can retrieve the file while another user cannot.

## What stays out of V2

- V2 has no V3 `sources`, `kind`, `collections`, `external_ids`, or per-source context budget.
- Review external IDs remain searchable text in V2; V3 can register them as typed external IDs.
- Search mode and ranking profile are runtime retrieval controls, not package taxonomy.
- The package does not create a generic folder skeleton or reorganize unrelated customer files.

## V3 migration

The folder structure and three organizing dimensions stay the same. V3 changes the authoring
model from roots, assignments, and grants to named sources plus audiences:

```toml
[[sources]]
name = "reviews-<workspaceId>"
path = "/agent/brain/<workspace>/data-sources/voc"
kind = "review"
include = ["**/review-*.md"]
collections = ["voc", "reviews", "workspace:<workspaceId>"]
external_ids = { review = "external_id" }
```

Knoweth will generate the internal lane and access policy from that source. V3 should be a
configuration migration and reindex, not a Brain file migration.

## Broader VM extension

The package configures only paths it owns. Existing VM folders stay in place and remain global
until a stable, useful corpus boundary is observed. Motion's mature VM suggests later shared
corpora such as `customers/**`, `conversations/**`, `meetings/**`, `email-corpus/**`, and
`help-center/**`. Each can use the same rule: one stable corpus name, one real folder pattern,
shared access, and no empty scaffold. Department folders remain human organization; only a
whole verified person home becomes a user lane.

## Validation

- A workspace review query returns review files from that workspace, not support tickets or
  another workspace's reviews.
- A cross-workspace review query returns the explicitly selected review lanes.
- A Meta query can combine account interpretation with the matching Cacheth project corpus.
- A broad customer-voice query searches both VoC and review lanes.
- A person can retrieve their whole home; another person cannot retrieve any file from it.
- Every package-generated Brain file has one indexed owner.
- Package guidance remains retrievable from `global`.
