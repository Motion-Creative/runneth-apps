# hook-script-mining: activation

This instruction is present in every conversation while this package is installed, so
check the done-marker before acting on it. It governs exactly one thing: the first
library build. Everything after that build belongs to the `hook-script-mining` skill,
not to this file.

Resolve the workspace first: read the `Default workspace:` line from this system
prompt's Motion context - the workspace the runtime bound this conversation to, never
one recalled from folders, rosters, or memory - and slug its name (lowercase, every
run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing
hyphens). If that line is null, this gate waits; never guess a workspace.

**The check:** if `/agent/brain/<workspace>/hook-script-mining/` already exists, the
first build has already run (or been started) for this workspace. Say nothing about
this package unprompted and skip the rest of this file - the skill handles every
classification, submission, and rebuild from here.

**If that folder does not exist,** the library has not been built for this workspace
yet. Do not run the first pull silently, but do not wait for a trigger phrase either.
Say plainly what this does and ask before touching anything:

> Installed. This builds a swipe-file library, hook tactics, headline tactics, visual
> formats, and creative mechanics, that you can classify new inspiration against and
> feed back into your ideation engine.
>
> Would you like to begin the first step, which is pulling the last 365 days of your
> own ads and building your library from what you've already run?

(In a conversation later than the installing one, drop the word "Installed." and lead
with the offer itself.)

Wait for a yes. Do not run the pull, and do not present any seeded content, until that
yes lands, in this conversation or a later one. Make the offer at most once per
conversation: if the person says not yet, or asks something else first, drop it and do
not repeat it in this same conversation. A later conversation may offer again, since
the library still does not exist.

**On a yes:** read `/agent/brain/hook-script-mining/04-bank-building-process.md` and
`/agent/brain/hook-script-mining/05-library-confirmation.md`, then run the build-the-
library sequence described in the `hook-script-mining` skill's "Before the first
classification: build the library" section. This resolves what Motion already has
tagged for hook tactic, headline tactic, and visual format from the account's real ad
library, either from an existing saved library or a live pull, and builds creative
mechanics from the same real ads by checking a starting checklist of universal
mechanics plus reading creative breakdowns for anything account-specific, since that
axis has no Motion tag to pull directly. Present
the seeded result using the exact table-per-axis format in `05-library-confirmation.md`, and hold for a second yes
before anything is written as live, per `05-library-confirmation.md`.

After that yes (or if the person defers it), tell them plainly what they can do from
here: send one asset (video or image) at a time, ideally in Slack, with a note on why
it caught their eye or a direct instruction naming the axis ("add as a hook"), and this
skill classifies and files it, holding for a yes on every new entry. Do not recite a
list of what this skill will not do; state only what it does.

Nothing about this activation writes another account's names, quotes, or figures into
this workspace's library. Everything seeded comes from this workspace's own real
evidence, live or saved.
