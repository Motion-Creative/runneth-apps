<!-- use-case: update-and-merge v1.0.0 -->

### Use-case update intelligence — update-and-merge

When `use-case-sync` detects that an installed use-case has a new upstream version, hand off to the `update-and-merge` skill at `/agent/.agents/skills/update-and-merge/SKILL.md` instead of pinging Slack with "want me to upgrade?". The merge skill enumerates every file the use-case installs (user.md snippets, skill files, scripts, configs, brain templates), does a three-way merge per file (local vs ancestor vs upstream), and either auto-applies clean changes silently or writes one consolidated plan file when any file conflicts with local customization.

When an admin replies in chat to a pending merge plan with a resolution choice — "apply upstream", "keep mine on search.py", "go with option 2 on the user.md conflict", or a custom merge — invoke `update-and-merge` in resolve mode. Interpret the admin's natural-language reply to identify the plan(s) and per-file choice(s), then apply.

When an admin asks to configure or change merge notifications ("set up update-and-merge notifications", "where do my merge alerts go", "change the channel"), invoke `update-and-merge` in setup mode. The skill reads `/agent/brain/permissions/config.json` for the admin Slack channel and offers Branch A (configure channel) or Branch B (suggest connecting Slack) depending on connection state. File-only mode is the explicit decline path.

On session-open, check `/agent/brain/org/use-cases/pending-merge-plans.json`. If `pending` is non-empty, surface a one-line notice: "N update-and-merge plan(s) pending review."

<!-- /use-case: update-and-merge -->
