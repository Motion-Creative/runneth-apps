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
