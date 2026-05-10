#!/bin/bash
# corpus-search install. Idempotent. Safe to re-run.
#
# Usage:
#   bash /agent/tools/corpus-search/install.sh
#
# What it does:
#   1. Vendors sqlite-vec into ./pkgs/ (precompiled extension, no native build)
#   2. Bootstraps config.json + sources.json from their .example.json templates
#   3. Applies the SQLite schema (creates corpus.db if missing)
#   4. Probes whether OPENAI_API_KEY can reach the embeddings API
#   5. Prints an INSTALL PROTOCOL checklist with explicit TODOs for the agent
#
# The script intentionally does NOT prompt for keys or folders interactively.
# The agent driving the install reads the printed [TODO] lines and asks the
# user the relevant questions through chat (e.g. via the secret-input widget
# for keys, or natural-language prompts for folders + schedule).
set -euo pipefail

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TOOL_DIR"

echo "==> corpus-search install"
echo "    tool dir: $TOOL_DIR"

# 1) Vendor sqlite-vec into pkgs/
if [ ! -f "pkgs/sqlite_vec/vec0.so" ]; then
  echo "==> vendoring sqlite-vec into pkgs/"
  TMPDIR_BUILD="$(mktemp -d)"
  pip install --quiet --target "$TMPDIR_BUILD" sqlite-vec >/dev/null
  mkdir -p pkgs
  # cp -a may emit utime warnings on Azure-mounted paths; data still copies.
  cp -r "$TMPDIR_BUILD"/* pkgs/ 2>/dev/null || true
  rm -rf "$TMPDIR_BUILD"
  if [ ! -f "pkgs/sqlite_vec/vec0.so" ]; then
    echo "    ERROR: sqlite-vec install did not produce vec0.so" >&2
    exit 1
  fi
  echo "    sqlite-vec vendored ($(du -h pkgs/sqlite_vec/vec0.so | cut -f1))"
else
  echo "==> sqlite-vec already vendored, skipping"
fi

# 2) Bootstrap config.json + sources.json from the examples
if [ ! -f "config.json" ]; then
  echo "==> creating config.json from config.example.json"
  cp config.example.json config.json
fi
if [ ! -f "sources.json" ]; then
  echo "==> creating sources.json from sources.example.json"
  echo "    (placeholder; replace example entries with the user's real folders)"
  cp sources.example.json sources.json
fi

# 3) Apply schema
echo "==> applying schema"
python3 bin/corpus_search_cli.py init

# 4) Probe the embedding endpoint
OPENAI_OK=false
if python3 bin/corpus_search_cli.py check-endpoint >/dev/null 2>&1; then
  OPENAI_OK=true
fi

# 5) Compute install state
SOURCES_ENABLED=$(python3 - <<'PY'
import json, os
try:
    cfg = json.load(open("sources.json"))
    n = 0
    for s in cfg.get("sources", []):
        if not s.get("enabled"):
            continue
        # Skip the placeholder example entry that points at a fake path.
        src = s.get("source", "")
        if "/path/that/does/not/exist" in src or src.startswith("~/drive/creative-library") or src.startswith("~/drive/briefs"):
            continue
        n += 1
    print(n)
except Exception:
    print(0)
PY
)

CHUNKS_INDEXED=$(python3 - <<'PY'
import sqlite3, os
p = "corpus.db"
try:
    if not os.path.exists(p):
        print(0)
    else:
        con = sqlite3.connect(p)
        try:
            n = con.execute("SELECT count(*) FROM chunk").fetchone()[0]
        except Exception:
            n = 0
        print(n)
except Exception:
    print(0)
PY
)

# 6) Print the install protocol checklist
echo ""
echo "==> INSTALL PROTOCOL — agent must resolve every [TODO] before declaring install done"
echo ""

if $OPENAI_OK; then
  echo "  [done] OPENAI_API_KEY is reachable; no widget needed."
else
  echo "  [TODO] OPENAI_API_KEY is NOT reachable from this workspace."
  echo "         Emit a secret-input widget asking the user to provide it."
  echo "         allowed_hosts: api.openai.com"
fi

if [ "$SOURCES_ENABLED" -gt 0 ]; then
  echo "  [done] sources.json has $SOURCES_ENABLED enabled real source(s)."
else
  echo "  [TODO] sources.json has no enabled real sources yet."
  echo "         ASK THE USER (in chat):"
  echo "           1. Which folders should I index? (one or more; full paths)"
  echo "           2. For each folder, what kind tag should I use?"
  echo "              suggestions: video-summary, brief, gong-call, note,"
  echo "              report, transcript — short and descriptive is fine."
  echo "         Then edit $TOOL_DIR/sources.json with the real entries"
  echo "         (set enabled: true) and run:"
  echo "           bash $TOOL_DIR/corpus-search.sh refresh"
  echo "         for the initial backfill."
fi

if [ "$CHUNKS_INDEXED" -gt 0 ]; then
  echo "  [done] $CHUNKS_INDEXED chunk(s) already indexed in corpus.db."
else
  echo "  [info] no chunks indexed yet; this is expected on a fresh install."
  echo "         Will populate after sources.json is configured + 'refresh' runs."
fi

echo "  [TODO] ensure a daily refresh reminder is set up via the 'reminder' tool."
echo "         ASK THE USER (in chat): How often should I refresh the index?"
echo "           default suggestion: daily at 8:00 in the user's local timezone"
echo "         Then call 'reminder add' once with text like:"
echo "           Every day at 8:00 <tz>, run \`bash $TOOL_DIR/corpus-search.sh refresh\`."
echo "           If chunks_inserted_total > 0 in the JSON output, post a one-line"
echo "           summary in this conversation. Otherwise post nothing."
echo "         Check 'reminder list' first; do not duplicate."

echo ""
echo "==> install.sh is done. Do NOT declare install complete in chat until"
echo "    every [TODO] above is resolved or explicitly waived by the user."
echo ""
echo "    Useful while you go through the protocol:"
echo "      bash $TOOL_DIR/corpus-search.sh status"
echo "      bash $TOOL_DIR/corpus-search.sh check-endpoint"
echo "      bash $TOOL_DIR/corpus-search.sh refresh"
echo "      bash $TOOL_DIR/corpus-search.sh demo"
