# Creator Intel

Build a trusted creator roster, match the right people to each brief, and compare past creator performance without guessing.

Creator Intel gives each Motion workspace one trusted place to:

- build a dashboard of the creators they already work with and how those creators perform
- recommend new creators worth working with, grounded in how the team actually hires

## The journey

**Stage 0: Install and workspace.** Installation stages the package files only. In the first fresh session after install, Runneth gives a one-line overview and offers setup once. It does not read Motion or connected accounts or write customer state until the person agrees. After approval, a single-workspace account is selected automatically; a multi-workspace account is asked once.

**Stage 1: Understand how you work.** One question at a time:
- how performance is measured (Account Context from the Meta onboarding package if present, otherwise spend; never Northbeam)
- where the roster, payment, and rights live, using Runneth's native Google or connected-integration flows and storing only stable account/resource references
- how the team hires creators, then grounding that lens in ad names, Account Context, brand context, or a review audit, and asking only for what cannot be found

**Stage 2: Build and confirm the roster.** From naming conventions plus the connected creator database, matched to Meta where possible. The complete roster stays in customer-owned state while the canonical review table is presented in pages of at most 25 creators until every open question is decided or explicitly left pending. Simple per-creator rights. Captures what each creator represents for later gap analysis.

**Stage 3: The dashboard.** An openable app with two core tabs, Creator profiles and a spend Leaderboard, plus an ROI tab only when both Account Context and a creator-cost source exist. It supports 30/60/90/365-day windows, refreshes missing or stale snapshots after disclosure and approval, and stays private to the workspace by default.

**Stage 4: Recommend creators.** Gap analysis first, then a three-method ladder: bounded Motion-context discovery when Motion returns usable results, securely credentialed top creator similarity, and reviews-gap micro-personas. Thin, unavailable, malformed, or no-fit results are reported honestly.

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
- This unreleased package remains version `1`; install and update are explicit so branch testers rerun the install command after package changes.
