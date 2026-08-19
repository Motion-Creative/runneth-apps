# meta-onboarding changelog

## v1

Initial release, extracted from `meta-and-voc-onboarding` v6 so the Meta and VoC halves
of onboarding install and test independently.

- **Scope**: the Meta half only - the Meta docs (Creative Attributes playbook, Account
  Context Brain package, Meta Validation package, Motion CLI Data-Query Guide, Cacheth
  Command Reference), the Knoweth organize package, the four `/agent/user.md` guard
  blocks, and the `meta-ad-performance-analysis`, `onboarding-walkthrough`, and
  `dashboard-design` skills. VoC syncs and the Voice of Customer Audit live in the
  separate `voc-onboarding` package, and neither package requires the other.
- **VoC fully out of the walkthrough**: the combined package's walkthrough closed with a
  customer-voice summary and audit offer; both are removed. The walkthrough now ends
  when the account-context questions are handled. The VoC package's sync routine owns
  the audit offer outright.
- **Family-aware Knoweth organize gate**: `runneth:knoweth-organize` bumped v4 -> v5.
  Gate 2 (content has landed) now judges only the data-source families the workspace
  actually has - the creative layer must resolve, and VoC backfill coverage is required
  only when `voc-sync-<workspace>-*` routines exist. A Meta-only workspace never waits
  on VoC. The other three guards are byte-identical to the combined package's v6
  staging, so already-onboarded VMs pass the guard byte-comparison untouched (the v5
  organize block refreshes on the next human-approved run).
- **Own completion roster**: post-install records workspaces in a
  `runneth:meta-onboarded` block in `/agent/user.md`. The activation also honors the
  legacy `runneth:meta-voc-onboarded` roster from the combined package, so already
  onboarded VMs are never re-set-up.
- **Meta-only install sequence**: connection check, single guard merge, Creative
  Attributes, Account Context Brain autofill, roster, readiness report - no VoC steps.
- **Walkthrough mines conversation history for prior answers**: before presenting, the
  walkthrough runs one bounded query pass per open question against the VM's
  conversation history (SQLite, human-authored messages only, this workspace's context
  only). A statement that answers a question pre-fills its field as a cited provisional
  read - the readout leads with "you said X on <date>" plus a short verbatim quote, and
  the open question becomes a one-word confirm. Citations never confirm a field by
  themselves; the person's answer in the walkthrough still does.
- **The creative-metric benchmark question is removed**: Field 8 no longer asks for a
  goal, target, or floor on thumbstop, hold rate, CTR, or any creative metric - most
  teams don't carry benchmarks and the question consistently failed to land. The
  account's own averages are the baseline and outliers are read against them. Field 8
  settles by pull (normal resting status `[AUTO]`), the confirmation gates now wait on
  Fields 1-7 and 9 only, and a volunteered target is still recorded when the customer
  offers one unprompted.
- **The walkthrough opens with an on-ramp**: Part 1 gains a third beat - why the
  questions are worth a few minutes, the voice-note tip ("feel free to voice-note your
  answers"), and the star tip. The onboarding chat is named predictably
  ("Runneth Onboarding - [Brand]") when the runtime supports setting the title, with a
  rename ask as the fallback.
- **The naming section invites a sheet, casually**: the naming-conventions ask always
  closes with one friendly line - "if your naming conventions already live in a sheet
  or doc somewhere, just drop it in here - I'll read it and save you the typing."
  A sheet that arrives seeds the decoder: where it matches the live names, those reads
  become cited assumptions; where it disagrees, the mismatch surfaces as one plain
  question.
- **Questions are triaged into two piles**: everything Runneth can read with high
  confidence becomes an assumption ("here's what I'll assume unless you correct me"),
  blessed in one reply; only genuinely un-inferable asks stay real questions, capped at
  five and aimed at three, each one sentence with one ask. A blanket "all good" is
  explicit sign-off for every listed assumption; silence confirms nothing, and
  unblessed assumptions resurface in progress recall. Conversation-mined answers land
  in the bless list with their citations. A shaky read never becomes an assumption to
  duck the cap.
- **"Not relevant" is an answer**: the on-ramp invites skips once ("if a question
  doesn't apply to how you run things, just say so"), never per question. A skip
  confirms the field with the person's words recorded and gets a one-line consequence
  acknowledgment, then the topic drops. "I don't know" is not a skip - it stays open
  and resurfaces. Fields 1, 2, and 9 (sources of truth, conversion events, targets)
  cannot be skipped: they are the floor, offered on their own when someone tries to
  skip everything.
- **Progress recall returns questions, not numbers**: "where am I at?" answers with the
  full text of every still-open question, one per line - never question numbers or a
  bare count - and resumed walkthroughs restate open questions the same way.
- **Campaign names are first-class in the naming decode**: the Creative Attributes
  provisional decode analyzes campaign names independently of ad names (both lists come
  from the same Cacheth export - `campaignNames[]` alongside `adNames[]`), Field 4's
  decoder holds campaign positions as typed entries (`query_field: "campaignName"`,
  optional `campaign_format_string`), and the walkthrough's naming section surfaces the
  campaign breakdown as its own table with the same full-breakdown rule as ad names -
  never a one-line summary.
  Staged docs move to `/agent/brain/meta-onboarding/` and every internal path reference
  follows.
- Carries the v6 behavior of the combined package's Meta parts otherwise, including the
  dashboard-design auto-invoke compatibility instruction, the `/agent/user.md`
  whole-file write chain, the ad-keyed Cacheth resolution paths in the Data-Query Guide
  and Cacheth Command Reference, and the conditional (never required) reads of VoC
  artifacts in validation and performance analysis.
