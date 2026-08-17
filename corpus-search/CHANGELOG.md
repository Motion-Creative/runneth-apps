# Changelog

## 1 - 2026-08-14

- Rebuilt the archived use case as a schema-v1 Runneth package.
- Added workspace-isolated Markdown ingestion, BM25 search, optional hybrid vector
  search and structured reranking, secure credential handling, resumable refreshes,
  and human-gated agent-mode refresh routines.
- Kept generated stores outside package ownership so updates and uninstall preserve
  customer data.
- Streamlined first use so direct indexing requests proceed into local setup without
  an upfront effects disclaimer or redundant confirmation.
- Changed exploratory setup to inspect only the current workspace's brain, recommend
  every useful non-overlapping source it finds with explicit exclusions, and accept one
  yes instead of asking the person to design the index manually.
- Added a clear, upbeat kickoff that explains what Corpus Search will unlock and leads
  naturally into Runneth's complete recommendation of what to index.
- Enabled automatic installation and updates for the `ai-training-club-26` intent while
  keeping index creation behind the first-use confirmation.
- Aligned activation with the kickoff: an unconfigured AI Training Club workspace gets
  the explanation and complete source recommendation on its first fresh conversation,
  while index creation still waits for one yes.
- Added persistent per-source refresh cursors so repeated bounded routines advance
  through large corpora instead of restarting at the first file.
- Made source lifecycle state authoritative across add, update, enable, disable, and
  removal, including resumable `awaiting_refresh` and retained `sources_disabled` states.
- Require complete enabled-source embedding coverage before reporting hybrid readiness;
  partial coverage degrades explicitly to BM25, and rejected credentials return the
  workspace to `credential_needed`.
- Coordinated AI Training Club first-use instructions so Corpus Search and Hook & Script
  Mining never stack competing setup questions in one response.
