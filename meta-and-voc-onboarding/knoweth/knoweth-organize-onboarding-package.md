# Knoweth V2 setup for Meta and VoC onboarding

## Shipping boundary

This package targets Knoweth V2 on existing VMs. V2 uses roots, ordered lane assignments, and
identity grants. V3 named sources from Agent Builder #2669 are the follow-up, not a dependency.

The package defines the desired map and the setup conversation. Apply it only when the deployed
ContextConfig and Harneth surfaces can create the exact assignments, grants, reindex, and request
the resulting lanes. Otherwise preserve current indexing and report the runtime dependency.

## User-facing model

Call a durable folder a **searchable collection**, not a lane, chunk, root, or source. A Notion
database is a useful analogy: related material that grows and is found or updated as a set.

When onboarding a collection, ask:

1. Which brand or workspace is this about?
2. Who should be able to use it: everyone, a team, or one person?
3. Where does it come from: Meta, TikTok, reviews, Slack, meetings, or people adding it?
4. What kind of collection is it: ideas, briefs, reviews, customer voice, SOPs, or another team term?

Infer answers from the active workspace, verified speaker, connected integration, and folder path.
Confirm one plain-language summary and ask only about fields that remain ambiguous. Do not turn this
into a required four-question form.

Ask who owns the collection only when stewardship matters. Ownership is descriptive metadata; it
does not make the collection private. Audience determines access.

Index one collection once. Workspace, owner, origin, and category are combined when Runneth searches;
do not create a duplicate lane for every possible combination. When no integration produced the
material, say `manually added`, `Slack`, or `meetings` rather than `N/A`.

Use a distinct collection only when the folder will grow, people will retrieve it independently,
its files have one clear meaning, and its audience is consistent. Ordinary organizational
subfolders remain inside their parent collection.

## V2 model

In V2, the lane ID names the collection. The request's `project_id` and `user_id` authorize lanes
through separate grants. The value after a colon is a naming convention, not the access rule.

For example, `reviews:abc123` is the review collection for workspace `abc123`; the matching grant's
`project_id = "abc123"` is what lets that workspace read it.

One file receives one final lane. Rules are evaluated in config order and the last match wins.

## Package assignment map

Reuse the existing Brain root and apply broad rules before specific rules:

```text
/agent/brain/
|-- runneth.md                                      global
|-- meta-and-voc-onboarding/**                      global
|-- <workspace>/**                                  project:<workspaceId>
|   |-- data-sources/meta/**                        meta:<workspaceId>
|   `-- data-sources/voc/**                         voc:<workspaceId>
|       `-- <platform>/review-*.md                  reviews:<workspaceId>
`-- <verified-person-home>/**                       user:<vmUserId>
```

The specific Meta, VoC, and review assignments override the broad workspace assignment. A review
file belongs to `reviews:<workspaceId>` only. It is not duplicated in the project or VoC lanes.

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

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/meta/**"
lane_id = "meta:<workspaceId>"

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/voc/**"
lane_id = "voc:<workspaceId>"

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<workspace>/data-sources/voc/**/review-*.md"
lane_id = "reviews:<workspaceId>"
```

Add one project grant that authorizes every collection owned by the workspace:

```toml
[[policy.lane_grants]]
id = "workspace-<workspaceId>"
project_id = "<workspaceId>"
read = [
  "project:<workspaceId>",
  "meta:<workspaceId>",
  "voc:<workspaceId>",
  "reviews:<workspaceId>",
  "global",
]
```

For each Teameth-verified person, assign their approved personal home and grant it to their stable
VM user ID:

```toml
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "<verified-person-home>/**"
lane_id = "user:<vmUserId>"

[[policy.lane_grants]]
id = "user-<vmUserId>"
user_id = "<vmUserId>"
read = ["user:<vmUserId>", "global"]
write = "user:<vmUserId>"
```

User and project grants are additive when the request contains both identities. Do not create one
grant for every user/workspace pair.

## What each package collection contains

| Collection | Files | Human description |
| --- | --- | --- |
| `project:<workspaceId>` | `_tag-vocabulary.md`, `_changelog.md`, and other general workspace files | Shared workspace context |
| `meta:<workspaceId>` | account context, naming decoder, validation, Meta changelog | How to interpret the workspace's Meta account |
| `voc:<workspaceId>` | VoC audit, ad comments, support tickets, community posts and comments | Customer language and customer-side evidence |
| `reviews:<workspaceId>` | `review-<externalId>.md` across review platforms | Reviews that can be searched independently |
| `user:<vmUserId>` | `user.md` and other files owned by one verified person | Personal working and display preferences |
| `global` | package guidance and identity-to-home resolver | Shared operating guidance |

Current creative summaries remain in Cacheth's existing `project:<workspaceId>` corpus. Current
performance remains a Motion CLI read. Do not copy either into these Brain collections.

## Retrieval map

Harneth supplies `user_id`, active `project_id`, and the lane set relevant to the ask. Knoweth
authorizes first and searches only allowed lanes.

| Ask | V2 lanes to request |
| --- | --- |
| "Find one-star reviews" | `reviews:<workspaceId>` |
| "What are customers saying?" | `voc:<workspaceId>` and `reviews:<workspaceId>` |
| "How should we judge Meta performance?" | `meta:<workspaceId>`, Cacheth project corpus, and `global` |
| "Find Meta ads with cats across all my workspaces" | Fan out across each authorized Cacheth `project:<workspaceId>` corpus, then merge |
| "Find cats in Brand A ads and reviews" | Brand A's Cacheth project corpus plus `reviews:<workspaceId>` |
| "What do we know about this workspace?" | all four project-granted Brain lanes plus Cacheth and `global` |
| "What are my defaults?" | `user:<vmUserId>` |

Current Cacheth sources are project-scoped, so an all-workspace ask is a bounded fan-out over the
workspaces the person may access. Reviews can be retrieved by the same concept semantically. A
reliable claim that a review refers to the exact same product or creative requires a shared stable
ID in both records; semantic similarity alone does not prove that relationship.

Knoweth does not search global first. It searches the authorized requested lanes together and ranks
paths, filenames, headings, and content.

## New collection setup

When a person creates a durable folder such as an ideas bank:

1. Confirm it should be retrieved as a set, not merely used for visual organization.
2. Ask the four user-facing setup questions.
3. Choose the primary V2 lane name from the collection and owner.
4. Add one assignment against the existing Brain root.
5. Add the matching project or user grant, or shared read policy.
6. Reindex once and test an exact and paraphrased query.
7. Record the map in the Brain resolver without exposing low-level configuration to the user.

Examples:

```text
ideas_for_runneth/**                  -> ideas:runneth       (shared, audience to confirm)
<workspace>/ideas/**                 -> ideas:<workspaceId> (project grant)
team/<handle>/ideas/**               -> ideas:<vmUserId>    (user grant)
```

A more specific ideas assignment overrides the broader workspace or user assignment. The file still
has one final lane.

## Workspace onboarding

For each newly onboarded workspace:

1. Resolve the exact workspace name and workspace ID from Motion context.
2. Create or reuse `/agent/brain/<workspace>/`.
3. Add the four ordered workspace assignments and one project grant.
4. Apply one bounded reindex and wait for the new generation.
5. Verify every package file appears once in its final lane and no longer appears in global.
6. Test exact and paraphrased general, Meta, VoC, and review asks.
7. Verify a request for another project cannot read these lanes.

Never create overlapping nested roots as a substitute for assignments.

## New team member setup

1. Use Teameth's stable `vmUserId`; never derive identity from display name or folder name.
2. Confirm one existing or approved personal home.
3. Create `user.md` only when there is verified durable personal context to save.
4. Record the identity-to-home mapping in global `/agent/brain/runneth.md`.
5. Assign the whole home to `user:<vmUserId>` unless a durable subcollection has been intentionally
   given a narrower user-authorized lane.
6. Add the user grant, reindex, and verify cross-user denial.

## V3 source map

V3 replaces lane authoring with one source row per collection. A global source stays in `global`; a
restricted source becomes an internal `source:<name>` lane and gets generated grants.

| V2 collection | V3 source | Audience |
| --- | --- | --- |
| `project:<workspaceId>` | `workspace-<workspaceId>` | `project:<workspaceId>` |
| `meta:<workspaceId>` | `meta-context-<workspaceId>` | `project:<workspaceId>` |
| `voc:<workspaceId>` | `customer-voice-<workspaceId>` | `project:<workspaceId>` |
| `reviews:<workspaceId>` | `reviews-<workspaceId>` | `project:<workspaceId>` |
| `user:<vmUserId>` | `user-<vmUserId>` | `user:<vmUserId>` |

Example:

```toml
[[sources]]
name = "reviews-<workspaceId>"
path = "/agent/brain/<workspace>/data-sources/voc"
kind = "customer-review"
profile = "semantic"
include = ["**/review-*.md"]
collections = ["workspace:<workspaceId>", "customer-voice", "reviews"]
scope = "project:<workspaceId>"
context = "document"
```

The broad `brain` source must exclude every path promoted into a package source. The current VoC
templates put unified YAML metadata in fenced body blocks, not YAML frontmatter, so do not configure
`external_ids` or typed attribute filters until a separate file-format migration is approved.

## Runtime dependency

The V2 engine supports these collection lanes, assignments, and grants. The current agent-facing
surfaces do not consistently expose the full map. The Agent Builder sister PR must let Harneth apply
the assignments and grants and request all relevant project collections. Agent Builder #2669 then
makes ContextConfig inspection-only for V3, so V3 source creation needs an engineering-owned
provisioning or admin path.

If any required operation is unavailable, report `Knoweth collection map: pending runtime support`
and leave the existing index intact.

## Validation

- Every package file has exactly one indexed owner.
- A project can read its general, Meta, VoC, and review collections and cannot read another project.
- A review query prefers `review-*.md` over tickets, posts, and comments.
- A broad customer-voice query can combine VoC and review lanes.
- Meta interpretation joins the existing Cacheth project corpus and live Motion data without copies.
- A verified person can retrieve their personal home and another person cannot.
- An ideas-bank canary is found by exact and paraphrased asks after restart.
