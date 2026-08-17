# Creator Intel

Build a trusted creator roster, match the right people to each brief, and compare past creator performance without guessing.

Creator Intel gives each Motion workspace one trusted place to:

- build a dashboard of the creators they already work with and how those creators perform
- recommend new creators worth working with, grounded in how the team actually hires

## The journey

**Stage 0: Install and workspace.** Setup runs at install. Runneth gives a one-line overview and offers to start. If the account has one workspace, it uses it; if more than one, it asks once.

**Stage 1: Understand how you work.** One question at a time:
- how performance is measured (Account Context from the Meta onboarding package if present, otherwise spend; never Northbeam)
- where the roster, payment, and rights live, and connecting that source so it can be read live
- how the team hires creators, then grounding that lens in ad names, Account Context, brand context, or a review audit, and asking only for what cannot be found

**Stage 2: Build and confirm the roster.** From naming conventions plus the connected creator database, matched to Meta where possible. Every creator in one table with one overview of open questions, driven to zero. Simple per-creator rights. Captures what each creator represents for later gap analysis.

**Stage 3: The dashboard.** An openable app with three tabs: ROI report (only when Account Context and a cost source are connected), Creator profiles, and a spend Leaderboard. Private to the workspace by default.

**Stage 4: Recommend creators.** Gap analysis first, then a three-method ladder: Motion-context (always available, topics approved before searching), top-10 plus Apify network walk, and reviews-gap micro-personas.

**Stage 5: Refresh.** Manual Meta evidence refresh that never changes trusted decisions. Scheduled only on separate consent.

## Skills

- `setup-creator-intelligence`
- `build-and-confirm-roster`
- `recommend-creators`
- `build-creator-dashboard`
- `refresh-creator-corpus`

## State boundaries

- Package-owned reference docs install to `/agent/brain/creator-intel-reference/`.
- Customer-owned mutable state lives at `/agent/brain/creator-intel/workspaces/<workspaceId>/`.
- Install, update, reinstall, and uninstall never overwrite customer decisions.
