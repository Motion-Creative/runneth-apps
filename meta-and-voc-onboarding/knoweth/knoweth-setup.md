# Knoweth Setup (Onboarding Package)

How this package sets up retrieval over the brain: lanes declared in the brain map,
banks built to be searchable, and honest behavior about what the retrieval engine
does today versus what arrives next. This replaces the earlier organize-and-lanes
reference; the enforceable behavior lives in the `/agent/user.md` guard blocks staged
in `meta-onboarding-rules/` — this document is the readable model behind them.

Throughout, `<brand>` is this conversation's brand folder (brand name slugged, exact
Motion workspace ID as the recorded authority) — resolved per conversation, literal in
this file.

## The lane model

Knoweth layers on top of whatever brain exists; it never reshapes it. A lane's job is
to exclude everything irrelevant from a search. Four kinds:

- **Corpus lanes — one per bank.** Every bank of similar raw items is its own lane:
  the `cacheth` lane (the creative store's ads, searchable while the records stay in
  the store), the `voice-of-customer` lane, an `ideas-bank` lane, an `inspo` lane, and
  any other bank the VM actually has. Knowing a lane is called Ideas Bank tells
  Runneth exactly where "save these hooks" or "find inspo like this" lives — and that
  it is a corpus, so the move is search-by-meaning, never crawling items.
- **Brand lanes — a different function: access scope.** One per brand home, keyed to
  the exact Motion workspace ID. A brand lane answers *whose material may be
  searched*; the corpus lanes inside a brand sit within its scope.
- **User lanes — if they apply.** A verified person's home: preferences, voice,
  person-owned work. Backed by verified identity, never a name match.
- **The general lane — everything else.** SOPs, context docs, guides, templates,
  references. Found through the brain map and read in full; searched broadly when
  needed. Nothing goes dark for lacking a lane.

## What this package sets up

The retrieval engine's configuration is runtime-owned — no package, person, or agent
creates lanes directly (the ContextConfig tool is inspect-only). The package's Knoweth
setup is therefore two real things:

1. **The banks themselves.** `integrations/voice-of-customer/<platform>/` folders
   filled by the daily syncs — items only, id-keyed, the exact shape a corpus lane
   wants. The items-only contract is machine-critical: the sync reads the folder to
   choose backfill versus incremental, so nothing else ever writes into a bank.
2. **The lane declarations, in the brain map.** `/agent/brain/brain-map.md` carries a
   lanes section — the natural-language mirror of the retrieval configuration. The
   package declares there:
   - a corpus lane per bank it creates or finds (name, `kind: corpus`, item naming,
     coverage window) — including banks detected on mature VMs at install (step 0.5 of
     post-install) and any corpus-search source registrations, which a person already
     confirmed as searchable;
   - the brand's lane (`kind: brand`, the exact workspace ID);
   - person homes (`kind: user`) - declared where they exist at install, and created
     on first personal save: a verified person's preferences or voice get a person
     home (the VM's own convention, else `team/<name>/<name>.md`) and a lane
     declaration carrying their verified identity, one per person, never in advance;
   - everything else implicitly general.

   The organize step (the `runneth:knoweth-organize` guard) finishes exactly here:
   once the account interpretation is confirmed and content has landed, it writes the
   brand's `_tag-vocabulary.md` and declares that brand's lanes in the map.

The runtime compiles declarations like these into real retrieval scope — the
`cacheth` lane already works this way where the current engine runs. Until the
compilation step reaches a VM, the declarations are still not decoration: they are the
map entries that route every ask correctly today, and the ready input for the engine
tomorrow.

## What is true today, and what to never claim

- **True on every VM:** the whole brain is indexed and searchable by keyword and
  meaning; a few ranked chunks arrive as context each turn; brand separation comes
  from the folder plus attribution (every page names its brand and cites its paths).
- **True where the current engine runs:** search routes itself — meaning-search for
  aggregate and recall asks, precision for exact lookups — and the `cacheth` lane is
  live, fed by the runtime.
- **Arriving, not yet true:** per-corpus lanes compiled from the map's declarations,
  and brand-scoped search over brain content. Until verified on the VM at hand, never
  claim lane scoping, isolation, or freshness. The honest form is always available:
  the folders are ready, search over them finishes on its own.

## How to search, by kind of place

- **A corpus (any `kind: corpus` declaration):** search by meaning inside the bank —
  query the local retrieval service (`GET $KNOWETH_API_URL/search?q=<query>`) with the
  ask's meaning words and read what it returns; where that service does not answer,
  one bounded keyword-and-date pass over the bank folder. Never read a bank item by
  item either way. Better queries beat more context — search, read,
  re-search with the vocabulary the first pass surfaced. For the compiled layer, read
  the audit or context page first, then verify important claims against the raw items
  it cites.
- **Knowledge (the general lane):** route through the brain map, open the mapped
  files, read them in full. When several places could answer, prefer recently active
  ones and say so when using something stale.
- **Stores:** current creative records through the `motion cache` CLI (the `cacheth`
  lane surfaces summaries; transcripts and AI tags stay CLI-only), current performance
  through the `motion` CLI — judged by the account's winner metric from
  `<brand>/integrations/meta/account-context.md`, never a platform default.
- **Most real asks combine these.** Combine the moves and attribute which part of the
  answer came from where.

## Communicating any of this

Customer language only: SOP, process, "save it", "make it available to the whole
team, or keep it just for you?", "your reviews are searchable". Never lanes, grants,
config, indexes, front matter, roster, or guard names in anything customer-visible —
especially failure explanations. The full rules ride the guards; the one-line test:
if a sentence needs this document to make sense, it does not belong in a reply.

## Maintenance

The `runneth:brain-map` guard keeps declarations current on every save; the
`brain-maintenance` routine (create-if-absent, per the `runneth:knoweth-brain` guard)
sweeps on schedule: new banks get their lane declarations, coverage windows and dates
refresh, and a missing or truncated map is rebuilt from a scan without touching
carried-over entries. One routine covers the whole brain and never merges content
across brand folders.
