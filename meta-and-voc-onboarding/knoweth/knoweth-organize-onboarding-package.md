# Knoweth V2 setup for Meta and Voice of Customer onboarding

## The outcome

People organize their work in folders they understand. Runneth makes those folders findable for
the right brand and person without asking anyone to manage Knoweth.

This package creates only the homes its work needs:

```text
/agent/brain/
|-- runneth.md
|-- brands/
|   `-- <brand>/
|       |-- brand.md
|       |-- integrations/
|       |   `-- meta/
|       `-- customer-feedback/
`-- installed-packages/
    `-- meta-and-voc-onboarding/
```

Do not create empty organization, team, standards, skills, templates, ideas, briefs, products,
or process folders. Keep any useful structure the VM already has. Create another folder only
when real work needs it, using the name and location the person expects.

## What people experience

People talk about brands, teammates, Meta, reviews, comments, briefs, ideas, SOPs, and the
folders they already use. They do not choose lanes, roots, grants, search modes, or ranking
profiles.

During setup, ask only for a business fact that cannot be resolved safely:

- Which Motion workspace represents this brand?
- Which connected Meta or customer-feedback account belongs to it?
- Is a preference personal to the speaker or shared with the team?

After setup, say what is ready in the same language:

> Harry's is ready. I linked it to its Motion workspace, kept the Meta guidance with the brand,
> and grouped its reviews, comments, and support conversations under customer feedback.
> Creative records remain in the Meta creative store.

When saving, use the folder the person names. Infer the active brand from Motion context and the
speaker from Teameth. Ask one short question only when the destination or personal-versus-shared
meaning is genuinely unclear.

## The V2 retrieval map

V2 gives each indexed file one lane. Use the smallest useful map:

```text
shared Brain knowledge          -> global
brands/<brand>/**               -> project:<workspaceId>
team/<handle>/**                -> user:<vmUserId>
```

Everything inside a brand home shares its project boundary. Folder paths still tell retrieval
what kind of material it is:

```text
brands/harrys/integrations/meta/**       Meta interpretation for Harry's
brands/harrys/customer-feedback/**       customer evidence for Harry's
brands/harrys/ideas/**                   Harry's ideas, when that folder actually exists
brands/harrys/creative-flywheel/**       Harry's process, when that is how the team works
```

Do not create `meta:`, `voc:`, `reviews:`, `ideas:`, or `skills:` lanes. Those nouns describe
content inside the authorized brand project; they are not separate access boundaries.

Cacheth creative records already use `project:<workspaceId>`. Matching the brand Brain home to
the same project lets one authorized request combine brand guidance, customer evidence, and
creative records. Exact paths, filenames, file text, and semantic similarity narrow the results
inside that project.

## V2 configuration

Reuse the existing `/agent/brain` root. Do not add overlapping nested roots.

```toml
[[roots]]
id = "<existing-brain-root-id>"
lane_id = "global"
path = "/agent/brain"
kind = "brain"

[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "brands/<brand>/**"
lane_id = "project:<workspaceId>"

[[policy.lane_grants]]
id = "project-<workspaceId>"
project_id = "<workspaceId>"
read = ["project:<workspaceId>", "global"]
write = "project:<workspaceId>"
```

For a Teameth-verified person who has personal files:

```toml
[[lane_assignments]]
root_id = "<existing-brain-root-id>"
pattern = "team/<handle>/**"
lane_id = "user:<vmUserId>"

[[policy.lane_grants]]
id = "user-<vmUserId>"
user_id = "<vmUserId>"
read = ["user:<vmUserId>", "global"]
write = "user:<vmUserId>"
```

The exact Teameth identity is required. Do not infer a `vmUserId` from a display name or Slack
handle. A whole personal home belongs to that person's lane. Shared team material belongs outside
the personal home.

If the deployed authoring surface cannot apply an exact assignment and grant, keep the files in
their correct homes and do not create a second root. Internally record retrieval setup as pending.
When the distinction matters to the person, say only:

> Your folders are ready, but brand-only or personal search is not active yet.

## Resolver files

`/agent/brain/runneth.md` is a short directory, not a second copy of the Brain. Keep:

- brand display name, slug, aliases, Motion workspace ID, and canonical brand home
- verified person display name, handle, stable `vmUserId`, aliases, and canonical personal home

Each `brands/<brand>/brand.md` keeps the same brand identity plus its connected account mappings
and canonical Meta and customer-feedback paths. Do not copy account context or customer evidence
into either resolver.

When one person has repeated, deterministic routing needs, their existing `user.md` may include a
small table:

```markdown
## Where Runneth should look

| When I ask for | Read first |
| --- | --- |
| a Slack mockup | creative-flywheel/production/slack-message-formatting-sop.md |
| Meta performance | creative-flywheel/analysis/meta-ads-data-interpretation.md |
```

This is optional. It captures the person's normal language and the files they already chose. One
ask may match several rows, in which case Runneth reads every mapped file. Ordinary retrieval does
not depend on this table.

## Saving and moving files

- A new file inside `brands/<brand>/` inherits the brand project boundary.
- A new file inside a verified `team/<handle>/` home inherits that person's boundary.
- A new child folder inherits its parent's boundary; it does not need a new lane.
- Preserve names such as `creative strategy flywheel`, `ideas bank`, and `SOP` when those are the
  terms the team uses.
- Keep an SOP beside the work it governs. Do not move it into a generic skills folder merely
  because it contains instructions.
- When moving a file across a brand or person boundary, preview the move, update durable path
  references, reindex, and verify the old path no longer returns.
- Never silently reorganize, rename, delete, or rewrite customer files.

## Existing package installations

After a person approves an upgrade, move package-generated knowledge without changing file
contents:

```text
/agent/brain/<workspace>/
  -> /agent/brain/brands/<brand>/

brands/<brand>/data-sources/meta/
  -> brands/<brand>/integrations/meta/

brands/<brand>/data-sources/voc/
  -> brands/<brand>/customer-feedback/
```

Before moving anything:

1. Resolve the exact workspace ID and brand slug from the current Motion context.
2. Inspect both old and new paths. Stop if both contain different files.
3. Show the person the paths that will move and ask for approval.
4. Move bytes unchanged.
5. Update package-owned guards, routine prompts, `/agent/INDEX.md`, and resolver paths.
6. Apply the project assignment and grant, reindex, and test old and new paths.

The package manager owns the installed package files under
`/agent/brain/installed-packages/meta-and-voc-onboarding/`. On update, it removes the package's old
declared targets and installs the new ones. The approved procedure above is only for generated
customer knowledge, resolver references, and routines. Never copy package files by hand.

## Verification

For each onboarded brand:

1. The brand slug maps to exactly one Motion workspace ID in `runneth.md` and `brand.md`.
2. Meta guidance is under `brands/<brand>/integrations/meta/`.
3. Reviews, comments, support conversations, and the compiled audit are under
   `brands/<brand>/customer-feedback/`.
4. The brand tree appears once in `project:<workspaceId>` and not in `global`.
5. An authorized request can retrieve brand guidance and the matching Cacheth records.
6. Another project cannot retrieve the brand tree.
7. A verified person's personal files are available to that person and not another user.

V3 later expresses the same paths as sources and audiences. It changes the configuration model,
not the folders people use.
