# voc-onboarding changelog

## v1

Initial release, extracted from `meta-and-voc-onboarding` v6 so the Meta and VoC halves
of onboarding install and test independently.

- **Scope**: the VoC half only - the `voc-data-pull` skill (recipes and templates
  included), the manual `voc-audit` skill, a VoC-only post-install, and a VoC-only
  activation gate. No guards, no Meta account context, no walkthrough: those live in the
  separate `meta-onboarding` package, and neither package requires the other.
- **Own state blocks**: the package tracks workspaces through `runneth:voc-partial`,
  `runneth:voc-connected`, and `runneth:voc-onboarded` blocks in `/agent/user.md`. The
  activation also honors the
  legacy `runneth:meta-voc-onboarded` roster from the combined package as fully
  onboarded, so already
  onboarded VMs are never re-set-up and their existing `voc-sync-<workspace>-*` routines
  keep running untouched.
- **Onboarding is redefined as two halves**: connecting sources is only the technical
  half, recorded in a `runneth:voc-connected` block. The strategic half - the initial
  audit and gap analysis delivered and explained, plus a standing refresh routine -
  is what writes `runneth:voc-onboarded`, and only the voc-audit skill writes it.
  Post-install never marks a workspace onboarded, and its closing report says
  "sources connected", never "install complete".
- **Transparent inventory kickoff**: setup opens by stating what is already connected
  and reachable ("here's what I can already see"), offers the connectable categories
  with concrete examples (customer reviews - Yotpo, Trustpilot, Judge.me; customer
  support - Zendesk, Gorgias, Intercom; post-purchase surveys - Narvar, AfterShip,
  Malomo, Loop Returns, Rebuy; social listening - specific Reddit threads, X), and
  closes by asking which of these the person actually hears from customers on. The
  answer gets an explicit numbered plan (connect, sync, choose the notification
  destination) before any connection work happens - never a silent setup.
- **Social listening defaults to Apify**: any mention of Reddit, X, or social
  listening triggers an immediate suggestion to connect an Apify account and locate
  the right actor, since those channels have no dependable native OAuth path. A stored
  Apify key counts Reddit, X, and Amazon Reviews as reachable in the probe.
- **Gap analysis is a standard audit section**: every audit run maps pain points
  against transformations (resolved / partially addressed / open) as a permanent part
  of the template, consistent across workspaces.
- **Standing audit refresh**: delivering the initial audit creates a daily
  `voc-audit-refresh-<workspace>` routine that updates the audit and gap analysis when
  new customer voice lands, notifies the chosen destination in plain language only
  when the audit moved, and once a month asks whether there are insights or sources
  the audit isn't capturing.
- **A dedicated platform is still required**: when Meta ad comments is the only
  reachable customer-voice source, the workspace is recorded in a `runneth:voc-partial`
  block. The install closes with a
  connect-an-integration message (the ask is the headline; ad comments a parenthetical),
  and the activation reminds once per conversation until a dedicated reviews, support,
  survey, or social-listening platform is connected - then setup resumes for that
  platform and the workspace moves to `runneth:voc-connected`, where the audit
  pipeline completes onboarding.
- **Self-contained audit offer**: the combined package's walkthrough delivered the
  customer-voice summary and audit offer when a Meta onboarding was open; VoC is now
  fully out of Meta onboarding, so the sync routine owns the offer outright. Once
  backfill coverage is reached, each daily run sends the offer if it is still owed -
  deferring (not handing off) while a Meta onboarding is mid-flight
  (`account-context.md` exists with interpretation fields unconfirmed), then sending on
  a later run once the context is confirmed. The `voc-audit-offer` changelog entry still
  guarantees at most one offer.
- **Sync notifications: new-items-only, to a chosen destination**: setup asks once per
  workspace where routine updates land - the web conversation or a Slack channel/thread
  (offered when Slack is connected) - and writes the answer literally into every
  routine's delivery. Runs notify that destination only when new items landed; a run
  that found nothing new is silent, and the initial backfill is silent regardless of
  volume (completion surfaces through the audit offer). Failures and disconnects still
  send a brief note.
- Carries the v6 behavior of the combined package's VoC parts otherwise: pinned
  per-workspace accounts, workspace-named routines, 12-month bounded backfills,
  read-only pulls, unified record format, and the person-approved initial audit with
  the 200-entry gate.
