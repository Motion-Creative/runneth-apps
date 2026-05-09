#!/bin/bash
# corpus-search install. Idempotent. Safe to re-run.
#
# Usage:
#   bash /agent/tools/corpus-search/install.sh
#
# What it does:
#   1. Vendors sqlite-vec into ./pkgs/ (precompiled extension, no native build)
#   2. Copies config.example.json -> config.json on first run
#   3. Applies the SQLite schema (creates corpus.db if missing)
#   4. Probes whether OPENAI_API_KEY can reach the embeddings API and reports.
set -euo pipefail

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TOOL_DIR"

echo "==> corpus-search install"
echo "    tool dir: $TOOL_DIR"

# 1) Vendor sqlite-vec into pkgs/
if [ ! -f "pkgs/sqlite_vec/vec0.so" ]; then
  echo "==> vendoring sqlite-vec into pkgs/"
  TMPDIR="$(mktemp -d)"
  pip install --quiet --target "$TMPDIR" sqlite-vec >/dev/null
  mkdir -p pkgs
  # cp -a may emit utime warnings on Azure-mounted paths; data still copies.
  cp -r "$TMPDIR"/* pkgs/ 2>/dev/null || true
  rm -rf "$TMPDIR"
  if [ -f "pkgs/sqlite_vec/vec0.so" ]; then
    echo "    sqlite-vec vendored ($(du -h pkgs/sqlite_vec/vec0.so | cut -f1))"
  else
    echo "    ERROR: sqlite-vec install did not produce vec0.so" >&2
    exit 1
  fi
else
  echo "==> sqlite-vec already vendored, skipping"
fi

# 2) Bootstrap config.json + sources.json from the examples
if [ ! -f "config.json" ]; then
  echo "==> creating config.json from config.example.json"
  cp config.example.json config.json
fi
if [ ! -f "sources.json" ]; then
  echo "==> creating sources.json from sources.example.json (edit it to point at your folders)"
  cp sources.example.json sources.json
fi

# 3) Apply schema (creates DB if missing, idempotent on existing DBs)
echo "==> applying schema"
python3 bin/corpus_search_cli.py init

# 4) Probe the embedding secret without prompting
echo "==> probing OPENAI_API_KEY against the embeddings API"
if python3 bin/corpus_search_cli.py check-secret >/dev/null 2>&1; then
  echo "    secret OK"
else
  echo ""
  echo "    NOTE: OPENAI_API_KEY is not yet usable in this workspace."
  echo "    Add it via the Runneth secret-input widget on first ingest/embed,"
  echo "    or have a Motion admin push it into the workspace secret store."
  echo "    The tool is otherwise ready."
fi

echo ""
echo "==> done"
echo "    next: index a folder of markdown, then embed and query."
echo "    examples:"
echo "      bash $TOOL_DIR/corpus-search.sh index markdown --source /path/to/folder --kind notes"
echo "      bash $TOOL_DIR/corpus-search.sh embed"
echo "      bash $TOOL_DIR/corpus-search.sh query \"<your question>\""
echo "      bash $TOOL_DIR/corpus-search.sh demo"
echo ""
echo "    to keep a corpus current automatically:"
echo "      1. edit $TOOL_DIR/sources.json to list folders + kinds"
echo "      2. bash $TOOL_DIR/corpus-search.sh refresh   (does index + embed for all)"
echo "      3. set up one Runneth reminder to call 'refresh' on a schedule"
