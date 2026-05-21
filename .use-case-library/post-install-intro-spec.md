# Post-install intro spec

Every use case in this library ends its install with a deterministic moment where Runneth deploys the new capability to the user visibly: a short "what just opened up + try this now" message that converts a silent install into an aha moment.

This doc is the convention. It's the source of truth for what a post-install intro is, where it lives, and how to write one.

## The two pieces

Every use case ships two things that make the intro fire:

1. **`post-install-intro.md`** at the use case root, the content Runneth surfaces.
2. **A final `show-intro` step in `install-config.json` `post-install[]`**, the instruction Runneth follows.

Both live in the use case folder. Nothing external. No protocol doc to update, no runtime code change.

## The content file

`post-install-intro.md` has three fixed-heading sections. The agent parses the headings.

```markdown
# <use case title>

## What just opened up
<2-3 sentences. The human outcome in present tense.
The "moment it clicks" reframe, not what got installed, what now becomes possible.
Plain language. No jargon.>

## Try this now
1. **<label>** — `<exact prompt the user can paste into chat>`
   _You'll get back:_ <one line on what Runneth will produce.>
2. **<label>** — `<prompt>`
   _You'll get back:_ <result>
3. **<label>** — `<prompt>`
   _You'll get back:_ <result>

(3-5 entries. Concrete, paste-ready, tied to a real deliverable.
No "ask me about X" hand-waving. Each prompt must actually work today
in a fresh sandbox with this use case installed.)

## Compounds with
- **<other use case or integration>:** <one sentence on the stack.>

(0-2 entries. Optional. Agent renders this section only when the named
use case or integration is actually installed/connected in the sandbox.)
```

### Voice

Write like a smart colleague handing off a tool, not like a brochure.

- Present tense. Active voice.
- Direct, warm, useful.
- ~80-150 words of prose total across the file (excluding the prompt lines).
- No marketing language. No "unlock," "supercharge," "game-changing."
- No em dashes or en dashes in the rendered prose. Use periods, commas, colons, or parentheses.
- The user is a teammate, not a customer. They already bought in by installing.

### Tokens

Intros support `{{TOKEN_NAME}}` substitution from the same `customize` map already resolved during install. Most intros won't need tokens. Workspace-scoped path tokens are the common case:

```markdown
You'll get back: a fresh delta written to /agent/brain/competitor-intel/{{WORKSPACE_SLUG}}/.
```

If a token appears in the intro, it must already be declared in `install-config.json` `customize`.

## The install-config step

The final entry in `post-install[]` is always:

```json
{
  "action": "show-intro",
  "name": "Introduce the new capability",
  "file": "post-install-intro.md",
  "description": "Read post-install-intro.md from this use case folder. After all prior install and post-install steps complete, surface the file's sections to the user in chat as the closing message of the install turn: '## What just opened up' as prose, '## Try this now' as a numbered prompt list, '## Compounds with' only when present and at least one named use case is installed in the sandbox. Resolve any {{TOKEN}} placeholders using the same customize map applied during install."
}
```

The `description` field is the instruction the agent follows. The `action: show-intro` label is a tag, not a code path. Same pattern `manual` steps use today.

## Sequencing

`show-intro` is **always the last** entry in `post-install[]`.

| Use case type | Order |
|---|---|
| Behavior-only / skill-only | `installs[]` then intro |
| Has setup skill | `installs[]` then setup skill then intro |
| Has app | `installs[]` then app-create then app-build then app-verify then app-url then (setup if present) then intro |
| Bundle | sub-use-case installs run (each fires its own intro) then bundle's own intro fires last |

For bundles, sub-intros still fire. The bundle's own intro adds the meta-frame at the end. Accept the noise; the bundle install is a bigger event and a richer ending fits.

## Validation checklist

Before any intro ships:

- [ ] File named exactly `post-install-intro.md` at the use case root
- [ ] Three sections present with exact headings: `## What just opened up`, `## Try this now`, `## Compounds with` (last optional)
- [ ] "What just opened up" is 2-3 sentences, present tense, names the human outcome (not the mechanism)
- [ ] "Try this now" has 3-5 numbered entries, each with paste-ready prompt + "you'll get back" line
- [ ] Every prompt would actually work today in a fresh sandbox with this use case installed
- [ ] Every `{{TOKEN}}` referenced is declared in the use case's `install-config.json` `customize` block
- [ ] `install-config.json` has the `show-intro` step as the final `post-install` entry
- [ ] Total prose under 250 words
- [ ] No marketing voice, written like a teammate, not a brochure
- [ ] No em or en dashes in the rendered prose

## What to do when the convention isn't a fit

If a use case genuinely can't produce a meaningful "try this now" prompt set after install (for example, pure plumbing that other apps depend on), it can skip the intro. Document the skip in the use case's README under a "Why no post-install intro" subhead. There are very few legitimate cases for this. `authenticate-apps` is one.
